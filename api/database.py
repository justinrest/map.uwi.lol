
import os
import asyncpg
from typing import AsyncGenerator

# Database connection URL (from environment variable or default)
DATABASE_URL = "postgresql://postgres:password@127.0.0.1:5432/uwi_map"

# Parse connection string to components if needed
# This handles both standard postgres:// URLs and the format used by some hosts
def parse_db_url(url: str) -> dict:
    """Parse a database URL into connection parameters."""
    # Handle some systems that prefix with postgres:// or postgresql://
    url = url.replace('postgres://', 'postgresql://')
    
    if "postgresql://" in url:
        # Standard URL format
        url = url.replace('postgresql://', '')
        auth, rest = url.split('@', 1)
        host_port, dbname = rest.split('/', 1)
        
        user, password = auth.split(':', 1) if ':' in auth else (auth, '')
        
        if ':' in host_port:
            host, port = host_port.split(':', 1)
            return {
                'user': user,
                'password': password,
                'host': host,
                'port': int(port),
                'database': dbname
            }
        else:
            return {
                'user': user,
                'password': password,
                'host': host_port,
                'database': dbname
            }
    else:
        # Already in keyword format
        return url

async def get_connection_pool():
    """Create and return a connection pool."""
    return await asyncpg.create_pool(DATABASE_URL)

# Connection pool
pool = None

async def get_db() -> AsyncGenerator[asyncpg.Connection, None]:
    """Get a database connection from the pool."""
    global pool
    if pool is None:
        pool = await get_connection_pool()
    
    async with pool.acquire() as connection:
        yield connection

async def close_db_connection():
    """Close the database connection pool."""
    global pool
    if pool:
        await pool.close()
        pool = None

async def initialize_db():
    """Initialize the database with tables and initial data."""
    global pool
    if pool is None:
        pool = await get_connection_pool()
    
    async with pool.acquire() as conn:
        # Create tables
        await conn.execute('''
        -- Users Table
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            is_admin BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Categories Table
        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL,
            color VARCHAR(7) NOT NULL,
            icon VARCHAR(50),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Places Table
        CREATE TABLE IF NOT EXISTS places (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            latitude DECIMAL(10, 8) NOT NULL,
            longitude DECIMAL(11, 8) NOT NULL,
            category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            osm_id VARCHAR(100),
            is_osm_imported BOOLEAN DEFAULT FALSE,
            osm_tags JSONB
        );

        -- Comments Table
        CREATE TABLE IF NOT EXISTS comments (
            id SERIAL PRIMARY KEY,
            content TEXT NOT NULL,
            place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Likes Table
        CREATE TABLE IF NOT EXISTS likes (
            id SERIAL PRIMARY KEY,
            place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            is_like BOOLEAN NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(place_id, user_id)
        );

        -- Favorites Table
        CREATE TABLE IF NOT EXISTS favorites (
            id SERIAL PRIMARY KEY,
            place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(place_id, user_id)
        );
        ''')
        
        # Check if admin user already exists
        admin_exists = await conn.fetchval(
            "SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)",
            "bob"
        )
        
        if not admin_exists:
            # Insert default admin user with password hash for 'bobpass'
            # Using bcrypt hash - this is equivalent to 'bobpass'
            await conn.execute('''
            INSERT INTO users (username, email, password_hash, is_admin)
            VALUES ($1, $2, $3, $4)
            ''', 'bob', 'admin@uwi.edu', 
            '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', True)
        
        # Add default categories if they don't exist
        categories = [
            ('Food', '#FF5733', 'utensils'),
            ('Study', '#33FF57', 'book'),
            ('Hangout', '#3357FF', 'users'),
            ('Events', '#FF33F5', 'calendar'),
            ('Sports', '#F5FF33', 'running')
        ]
        
        for name, color, icon in categories:
            await conn.execute('''
            INSERT INTO categories (name, color, icon)
            VALUES ($1, $2, $3)
            ON CONFLICT (name) DO NOTHING
            ''', name, color, icon)