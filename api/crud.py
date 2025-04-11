from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from typing import List, Optional

import models
import schemas
from security import verify_password, get_password_hash

# User operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Category operations
def get_category(db: Session, category_id: int):
    return db.query(models.Category).filter(models.Category.id == category_id).first()

def get_categories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Category).offset(skip).limit(limit).all()

def create_category(db: Session, category: schemas.CategoryCreate):
    db_category = models.Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

# Place operations with count aggregations
def get_place(db: Session, place_id: int):
    # Query the place with counts
    place = db.query(models.Place).filter(models.Place.id == place_id).first()
    
    if place:
        # Calculate counts and attach them
        like_count = db.query(func.count(models.Like.id)).filter(
            and_(models.Like.place_id == place_id, models.Like.is_like == True)
        ).scalar() or 0
        
        dislike_count = db.query(func.count(models.Like.id)).filter(
            and_(models.Like.place_id == place_id, models.Like.is_like == False)
        ).scalar() or 0
        
        favorite_count = db.query(func.count(models.Favorite.id)).filter(
            models.Favorite.place_id == place_id
        ).scalar() or 0
        
        # Set the counts as attributes
        setattr(place, 'like_count', like_count)
        setattr(place, 'dislike_count', dislike_count)
        setattr(place, 'favorite_count', favorite_count)
        
    return place

def get_places(db: Session, skip: int = 0, limit: int = 100, category_id: Optional[int] = None):
    # Start with a base query
    base_query = db.query(models.Place)
    
    if category_id:
        base_query = base_query.filter(models.Place.category_id == category_id)
    
    # Order by most recent
    base_query = base_query.order_by(desc(models.Place.created_at))
    
    # Execute the query to get all places
    places = base_query.offset(skip).limit(limit).all()
    
    # For each place, calculate and add the counts
    for place in places:
        like_count = db.query(func.count(models.Like.id)).filter(
            and_(models.Like.place_id == place.id, models.Like.is_like == True)
        ).scalar() or 0
        
        dislike_count = db.query(func.count(models.Like.id)).filter(
            and_(models.Like.place_id == place.id, models.Like.is_like == False)
        ).scalar() or 0
        
        favorite_count = db.query(func.count(models.Favorite.id)).filter(
            models.Favorite.place_id == place.id
        ).scalar() or 0
        
        # Set the counts as attributes
        setattr(place, 'like_count', like_count)
        setattr(place, 'dislike_count', dislike_count)
        setattr(place, 'favorite_count', favorite_count)
    
    return places

def create_place(db: Session, place: schemas.PlaceCreate, user_id: int):
    db_place = models.Place(**place.dict(), user_id=user_id)
    db.add(db_place)
    db.commit()
    db.refresh(db_place)
    
    # Set default count values
    setattr(db_place, 'like_count', 0)
    setattr(db_place, 'dislike_count', 0)
    setattr(db_place, 'favorite_count', 0)
    
    return db_place

# Comment operations
def get_comments_for_place(db: Session, place_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Comment).filter(
        models.Comment.place_id == place_id
    ).offset(skip).limit(limit).all()

def create_comment(db: Session, comment: schemas.CommentCreate, place_id: int, user_id: int):
    db_comment = models.Comment(**comment.dict(), place_id=place_id, user_id=user_id)
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

# Like operations
def create_or_update_like(db: Session, place_id: int, user_id: int, is_like: bool):
    # Check if user already liked/disliked this place
    db_like = db.query(models.Like).filter(
        models.Like.place_id == place_id,
        models.Like.user_id == user_id
    ).first()
    
    if db_like:
        # Update existing like/dislike
        db_like.is_like = is_like
    else:
        # Create new like/dislike
        db_like = models.Like(place_id=place_id, user_id=user_id, is_like=is_like)
        db.add(db_like)
    
    db.commit()
    db.refresh(db_like)
    return db_like

# Favorite operations
def toggle_favorite(db: Session, place_id: int, user_id: int):
    # Check if user already favorited this place
    db_favorite = db.query(models.Favorite).filter(
        models.Favorite.place_id == place_id,
        models.Favorite.user_id == user_id
    ).first()
    
    if db_favorite:
        # Remove favorite
        db.delete(db_favorite)
        db.commit()
        return None
    else:
        # Add favorite
        db_favorite = models.Favorite(place_id=place_id, user_id=user_id)
        db.add(db_favorite)
        db.commit()
        db.refresh(db_favorite)
        return db_favorite

def get_user_favorites(db: Session, user_id: int):
    # Get places that the user has favorited
    places = db.query(models.Place).join(
        models.Favorite, models.Favorite.place_id == models.Place.id
    ).filter(
        models.Favorite.user_id == user_id
    ).all()
    
    # Add count attributes to each place
    for place in places:
        like_count = db.query(func.count(models.Like.id)).filter(
            and_(models.Like.place_id == place.id, models.Like.is_like == True)
        ).scalar() or 0
        
        dislike_count = db.query(func.count(models.Like.id)).filter(
            and_(models.Like.place_id == place.id, models.Like.is_like == False)
        ).scalar() or 0
        
        favorite_count = db.query(func.count(models.Favorite.id)).filter(
            models.Favorite.place_id == place.id
        ).scalar() or 0
        
        # Set the counts as attributes
        setattr(place, 'like_count', like_count)
        setattr(place, 'dislike_count', dislike_count)
        setattr(place, 'favorite_count', favorite_count)
    
    return places

# Feed operations
def get_newest_places(db: Session, limit: int = 10):
    # Get newest places
    places = db.query(models.Place).order_by(
        desc(models.Place.created_at)
    ).limit(limit).all()
    
    # Add count attributes to each place
    for place in places:
        like_count = db.query(func.count(models.Like.id)).filter(
            and_(models.Like.place_id == place.id, models.Like.is_like == True)
        ).scalar() or 0
        
        dislike_count = db.query(func.count(models.Like.id)).filter(
            and_(models.Like.place_id == place.id, models.Like.is_like == False)
        ).scalar() or 0
        
        favorite_count = db.query(func.count(models.Favorite.id)).filter(
            models.Favorite.place_id == place.id
        ).scalar() or 0
        
        # Set the counts as attributes
        setattr(place, 'like_count', like_count)
        setattr(place, 'dislike_count', dislike_count)
        setattr(place, 'favorite_count', favorite_count)
    
    return places

def get_top_places(db: Session, limit: int = 10):
    # Get places with the most likes
    subq = db.query(
        models.Place.id,
        func.count(models.Like.id).filter(models.Like.is_like == True).label('like_count')
    ).outerjoin(
        models.Like, models.Like.place_id == models.Place.id
    ).group_by(
        models.Place.id
    ).subquery()
    
    # Join the subquery to get full place objects, ordered by like count
    places = db.query(models.Place).join(
        subq, models.Place.id == subq.c.id
    ).order_by(
        desc(subq.c.like_count)
    ).limit(limit).all()
    
    # Add count attributes to each place
    for place in places:
        like_count = db.query(func.count(models.Like.id)).filter(
            and_(models.Like.place_id == place.id, models.Like.is_like == True)
        ).scalar() or 0
        
        dislike_count = db.query(func.count(models.Like.id)).filter(
            and_(models.Like.place_id == place.id, models.Like.is_like == False)
        ).scalar() or 0
        
        favorite_count = db.query(func.count(models.Favorite.id)).filter(
            models.Favorite.place_id == place.id
        ).scalar() or 0
        
        # Set the counts as attributes
        setattr(place, 'like_count', like_count)
        setattr(place, 'dislike_count', dislike_count)
        setattr(place, 'favorite_count', favorite_count)
    
    return places