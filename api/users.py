import asyncpg
from typing import List, Dict, Any, Optional
from security import get_password_hash

# User CRUD operations
async def get_user(conn: asyncpg.Connection, user_id: int) -> Optional[Dict[str, Any]]:
    """Get a user by ID."""
    user = await conn.fetchrow(
        """
        SELECT id, username, email, is_admin, created_at, updated_at
        FROM users
        WHERE id = $1
        """,
        user_id
    )
    return dict(user) if user else None

async def get_user_by_email(conn: asyncpg.Connection, email: str) -> Optional[Dict[str, Any]]:
    """Get a user by email."""
    user = await conn.fetchrow(
        """
        SELECT id, username, email, password_hash, is_admin, created_at, updated_at
        FROM users
        WHERE email = $1
        """,
        email
    )
    return dict(user) if user else None

async def get_user_by_username(conn: asyncpg.Connection, username: str) -> Optional[Dict[str, Any]]:
    """Get a user by username."""
    user = await conn.fetchrow(
        """
        SELECT id, username, email, password_hash, is_admin, created_at, updated_at
        FROM users
        WHERE username = $1
        """,
        username
    )
    return dict(user) if user else None

async def get_users(conn: asyncpg.Connection, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    """Get a list of users."""
    users = await conn.fetch(
        """
        SELECT id, username, email, is_admin, created_at, updated_at
        FROM users
        ORDER BY id
        LIMIT $1 OFFSET $2
        """,
        limit, skip
    )
    return [dict(user) for user in users]

async def create_user(conn: asyncpg.Connection, username: str, email: str, password: str, is_admin: bool = False) -> Dict[str, Any]:
    """Create a new user."""
    hashed_password = get_password_hash(password)
    
    user = await conn.fetchrow(
        """
        INSERT INTO users (username, email, password_hash, is_admin)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, email, is_admin, created_at, updated_at
        """,
        username, email, hashed_password, is_admin
    )
    
    return dict(user)