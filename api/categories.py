import asyncpg
from typing import List, Dict, Any, Optional


# Category CRUD operations
async def get_category(conn: asyncpg.Connection, category_id: int) -> Optional[Dict[str, Any]]:
    """Get a category by ID."""
    category = await conn.fetchrow(
        """
        SELECT id, name, color, icon, created_at
        FROM categories
        WHERE id = $1
        """,
        category_id,
    )
    return dict(category) if category else None


async def get_categories(conn: asyncpg.Connection, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    """Get a list of categories."""
    categories = await conn.fetch(
        """
        SELECT id, name, color, icon, created_at
        FROM categories
        ORDER BY name
        LIMIT $1 OFFSET $2
        """,
        limit,
        skip,
    )
    return [dict(category) for category in categories]


async def create_category(conn: asyncpg.Connection, name: str, color: str, icon: Optional[str] = None) -> Dict[str, Any]:
    """Create a new category."""
    category = await conn.fetchrow(
        """
        INSERT INTO categories (name, color, icon)
        VALUES ($1, $2, $3)
        RETURNING id, name, color, icon, created_at
        """,
        name,
        color,
        icon,
    )

    return dict(category)
