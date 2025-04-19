from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime, timedelta
import asyncpg
import uvicorn

import schemas
from database import get_db, initialize_db, close_db_connection
from security import verify_password, create_access_token, get_current_user

import users as users_dao
import categories as categories_dao
import places as places_dao
import interactions as interactions_dao

app = FastAPI(title="Find D Lime")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, set to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    await initialize_db()

@app.on_event("shutdown")
async def shutdown_event():
    await close_db_connection()

# Authentication endpoints
@app.post("/api/token")
async def login_for_access_token(form_data: schemas.UserLogin, conn: asyncpg.Connection = Depends(get_db)):
    user = await users_dao.get_user_by_username(conn, username=form_data.username)
    
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=60 * 24 * 7)  # 1 week
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# User endpoints
@app.post("/api/users/")
async def create_user(user: schemas.UserCreate, conn: asyncpg.Connection = Depends(get_db)):
    db_user = await users_dao.get_user_by_username(conn, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_user = await users_dao.get_user_by_email(conn, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    return await users_dao.create_user(
        conn=conn, 
        username=user.username, 
        email=user.email, 
        password=user.password
    )

@app.get("/api/users/me/")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

# Category endpoints
@app.get("/api/categories/")
async def read_categories(
    skip: int = 0, 
    limit: int = 100, 
    conn: asyncpg.Connection = Depends(get_db)
):
    categories = await categories_dao.get_categories(conn=conn, skip=skip, limit=limit)
    return categories

# Place endpoints
# Update these in main.py

@app.post("/api/places/")
async def create_place(
    place: schemas.PlaceCreate, 
    conn: asyncpg.Connection = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    return await places_dao.create_place(
        conn=conn,
        name=place.name,
        description=place.description,
        latitude=place.latitude,
        longitude=place.longitude,
        category_ids=place.category_ids,  # Changed from category_id
        user_id=current_user["id"],
        osm_id=place.osm_id,
        is_osm_imported=place.is_osm_imported,
        osm_tags=place.osm_tags
    )

@app.put("/api/places/{place_id}")
async def update_place(
    place_id: int,
    place_update: schemas.PlaceUpdate,
    conn: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update a place's details (if it belongs to the current user)."""
    updated_place = await places_dao.update_place(
        conn=conn,
        place_id=place_id,
        user_id=current_user["id"],
        name=place_update.name,
        description=place_update.description,
        category_ids=place_update.category_ids  # Changed from category_id
    )
    
    if not updated_place:
        raise HTTPException(
            status_code=404,
            detail="Place not found or you don't have permission to modify it"
        )
    
    return updated_place

@app.get("/api/places/")
async def read_places(
    skip: int = 0, 
    limit: int = 100, 
    category_id: Optional[int] = None,
    conn: asyncpg.Connection = Depends(get_db)
):
    places = await places_dao.get_places(
        conn=conn, 
        skip=skip, 
        limit=limit, 
        category_id=category_id
    )
    return places

@app.get("/api/places/{place_id}")
async def read_place(place_id: int, conn: asyncpg.Connection = Depends(get_db)):
    db_place = await places_dao.get_place_with_comments(conn=conn, place_id=place_id)
    if db_place is None:
        raise HTTPException(status_code=404, detail="Place not found")
    return db_place

# Comment endpoints
@app.post("/api/places/{place_id}/comments/")
async def create_comment(
    place_id: int,
    comment: schemas.CommentCreate,
    conn: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return await interactions_dao.create_comment(
        conn=conn, 
        content=comment.content, 
        place_id=place_id, 
        user_id=current_user["id"]
    )

@app.get("/api/places/{place_id}/comments/")
async def read_place_comments(
    place_id: int,
    skip: int = 0,
    limit: int = 100,
    conn: asyncpg.Connection = Depends(get_db)
):
    return await interactions_dao.get_comments_for_place(
        conn=conn, 
        place_id=place_id, 
        skip=skip, 
        limit=limit
    )

# Like endpoints
@app.post("/api/places/{place_id}/like")
async def like_place(
    place_id: int,
    like: schemas.LikeCreate,
    conn: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return await interactions_dao.create_or_update_like(
        conn=conn, 
        place_id=place_id, 
        user_id=current_user["id"], 
        is_like=like.is_like
    )

# Favorite endpoints
@app.post("/api/places/{place_id}/favorite")
async def favorite_place(
    place_id: int,
    conn: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return await interactions_dao.toggle_favorite(
        conn=conn, 
        place_id=place_id, 
        user_id=current_user["id"]
    )

@app.get("/api/users/me/favorites")
async def get_user_favorites(
    conn: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return await interactions_dao.get_user_favorites(conn=conn, user_id=current_user["id"])

# Feed endpoint - get newest places
@app.get("/api/feed/new")
async def get_new_places(limit: int = 10, conn: asyncpg.Connection = Depends(get_db)):
    return await places_dao.get_newest_places(conn=conn, limit=limit)

# Get top places by likes
@app.get("/api/feed/top")
async def get_top_places(limit: int = 10, conn: asyncpg.Connection = Depends(get_db)):
    return await places_dao.get_top_places(conn=conn, limit=limit)

# Add these to main.py

# User's places endpoints
@app.get("/api/users/me/places")
async def get_my_places(
    skip: int = 0,
    limit: int = 100,
    conn: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all places created by the current user."""
    return await places_dao.get_places_by_user(
        conn=conn,
        user_id=current_user["id"],
        skip=skip,
        limit=limit
    )

@app.delete("/api/places/{place_id}")
async def delete_place(
    place_id: int,
    conn: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a place (if it belongs to the current user)."""
    success = await places_dao.delete_place(
        conn=conn,
        place_id=place_id,
        user_id=current_user["id"]
    )
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Place not found or you don't have permission to delete it"
        )
    
    return {"success": True, "message": "Place deleted successfully"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8888, reload=True)