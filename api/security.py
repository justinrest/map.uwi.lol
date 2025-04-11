from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import asyncpg
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
import os

from database import get_db

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "YOUR_SECRET_KEY_HERE")  # In production, use env variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/token")

# Password verification and hashing
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_user_by_username(conn: asyncpg.Connection, username: str) -> Optional[Dict[str, Any]]:
    """Get a user by username from the database."""
    user = await conn.fetchrow(
        """
        SELECT id, username, email, password_hash, is_admin, created_at, updated_at
        FROM users
        WHERE username = $1
        """,
        username
    )
    return dict(user) if user else None

async def get_current_user(token: str = Depends(oauth2_scheme), conn: asyncpg.Connection = Depends(get_db)):
    """Get the current authenticated user from the token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await get_user_by_username(conn, username)
    if user is None:
        raise credentials_exception
    
    return user