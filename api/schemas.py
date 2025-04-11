from pydantic import BaseModel, EmailStr, constr, validator, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime

# Base schemas
class CommentBase(BaseModel):
    content: constr(min_length=1, max_length=1000)

class LikeBase(BaseModel):
    is_like: bool

class PlaceBase(BaseModel):
    name: constr(min_length=1, max_length=100)
    description: constr(min_length=1, max_length=5000)
    latitude: float
    longitude: float
    category_id: int

class CategoryBase(BaseModel):
    name: str
    color: str
    icon: Optional[str] = None

class UserBase(BaseModel):
    username: constr(min_length=3, max_length=50)
    email: EmailStr

# Create schemas
class UserCreate(UserBase):
    password: constr(min_length=6)

class CategoryCreate(CategoryBase):
    pass

class PlaceCreate(PlaceBase):
    osm_id: Optional[str] = None
    is_osm_imported: Optional[bool] = False
    osm_tags: Optional[Dict[str, Any]] = None

class CommentCreate(CommentBase):
    pass

class LikeCreate(LikeBase):
    pass

class FavoriteCreate(BaseModel):
    pass

# Response schemas
class User(UserBase):
    id: int
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Category(CategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Comment(CommentBase):
    id: int
    place_id: int
    user_id: int
    created_at: datetime
    user: Optional[User] = None

    class Config:
        from_attributes = True

class Like(LikeBase):
    id: int
    place_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Favorite(BaseModel):
    id: int
    place_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Place(PlaceBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    category: Optional[Category] = None
    like_count: Optional[int] = 0
    dislike_count: Optional[int] = 0
    favorite_count: Optional[int] = 0
    osm_id: Optional[str] = None
    is_osm_imported: Optional[bool] = False
    osm_tags: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class PlaceDetail(Place):
    comments: List[Comment] = []
    
    class Config:
        from_attributes = True

# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str
    
    # Add these to schemas.py

class PlaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None

class DeleteResponse(BaseModel):
    success: bool
    message: str