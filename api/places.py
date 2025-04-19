import asyncpg
import json
from typing import List, Dict, Any, Optional


# Place CRUD operations
async def get_place(conn: asyncpg.Connection, place_id: int) -> Optional[Dict[str, Any]]:
    """Get a place by ID with all its categories."""
    place = await conn.fetchrow(
        """
        SELECT p.id, p.name, p.description, p.latitude, p.longitude, 
               p.user_id, p.created_at, p.updated_at,
               p.osm_id, p.is_osm_imported, p.osm_tags,
               u.username as user_username
        FROM places p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.id = $1
        """,
        place_id
    )
    
    if not place:
        return None
    
    # Convert to dict and add categories
    place_dict = dict(place)
    
    # Get all categories for this place
    categories = await conn.fetch(
        """
        SELECT c.id, c.name, c.color, c.icon
        FROM categories c
        JOIN place_categories pc ON c.id = pc.category_id
        WHERE pc.place_id = $1
        ORDER BY c.name
        """,
        place_id
    )
    
    place_dict['categories'] = [dict(category) for category in categories]
    
    # Get likes count
    likes_count = await conn.fetchval(
        """
        SELECT COUNT(*) FROM likes 
        WHERE place_id = $1 AND is_like = TRUE
        """,
        place_id
    )
    
    # Get dislikes count
    dislikes_count = await conn.fetchval(
        """
        SELECT COUNT(*) FROM likes 
        WHERE place_id = $1 AND is_like = FALSE
        """,
        place_id
    )
    
    # Get favorites count
    favorites_count = await conn.fetchval(
        """
        SELECT COUNT(*) FROM favorites 
        WHERE place_id = $1
        """,
        place_id
    )
    
    place_dict['like_count'] = likes_count
    place_dict['dislike_count'] = dislikes_count
    place_dict['favorite_count'] = favorites_count
    
    return place_dict


async def get_place_with_comments(conn: asyncpg.Connection, place_id: int) -> Optional[Dict[str, Any]]:
    """Get a place by ID with its category and comments."""
    # Get the place first
    place_dict = await get_place(conn, place_id)

    if not place_dict:
        return None

    # Get comments for the place
    comments = await conn.fetch(
        """
        SELECT c.id, c.content, c.place_id, c.user_id, c.created_at, c.updated_at,
               u.username as user_username, u.email as user_email
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.place_id = $1
        ORDER BY c.created_at DESC
        """,
        place_id,
    )

    # Format comments with user info
    formatted_comments = []
    for comment in comments:
        comment_dict = dict(comment)
        comment_dict["user"] = {"id": comment_dict["user_id"], "username": comment_dict["user_username"], "email": comment_dict["user_email"]}

        # Clean up redundant keys
        for key in ["user_username", "user_email"]:
            if key in comment_dict:
                del comment_dict[key]

        formatted_comments.append(comment_dict)

    place_dict["comments"] = formatted_comments

    return place_dict


async def create_place(
    conn: asyncpg.Connection,
    name: str,
    description: str,
    latitude: float,
    longitude: float,
    user_id: int,
    category_ids: List[int] = None,  # Changed from category_id to category_ids
    osm_id: Optional[str] = None,
    is_osm_imported: bool = False,
    osm_tags: Optional[Dict] = None,
) -> Dict[str, Any]:
    """Create a new place with multiple categories."""
    # First create the place
    place = await conn.fetchrow(
        """
        INSERT INTO places (
            name, description, latitude, longitude, 
            user_id, osm_id, is_osm_imported, osm_tags
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name, description, latitude, longitude, 
                 user_id, created_at, updated_at,
                 osm_id, is_osm_imported, osm_tags
        """,
        name,
        description,
        latitude,
        longitude,
        user_id,
        osm_id,
        is_osm_imported,
        json.dumps(osm_tags) if osm_tags else None,
    )

    place_dict = dict(place)
    place_id = place_dict["id"]

    # Add categories if provided
    if category_ids and len(category_ids) > 0:
        categories = []
        for category_id in category_ids:
            # Add to junction table
            await conn.execute(
                """
                INSERT INTO place_categories (place_id, category_id)
                VALUES ($1, $2)
                ON CONFLICT (place_id, category_id) DO NOTHING
                """,
                place_id,
                category_id,
            )

            # Get category info
            category = await conn.fetchrow(
                """
                SELECT id, name, color, icon
                FROM categories
                WHERE id = $1
                """,
                category_id,
            )

            if category:
                categories.append(dict(category))

        place_dict["categories"] = categories
    else:
        place_dict["categories"] = []

    return place_dict


async def get_newest_places(conn: asyncpg.Connection, limit: int = 10) -> List[Dict[str, Any]]:
    """Get the newest places."""
    places = await conn.fetch(
        """
        SELECT p.id, p.name, p.description, p.latitude, p.longitude, 
               p.category_id, p.user_id, p.created_at, p.updated_at,
               c.id as category_id, c.name as category_name, 
               c.color as category_color, c.icon as category_icon
        FROM places p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.created_at DESC
        LIMIT $1
        """,
        limit,
    )

    result = []
    for place in places:
        place_dict = dict(place)

        # Add category as nested object
        if place_dict.get("category_id"):
            place_dict["category"] = {"id": place_dict["category_id"], "name": place_dict["category_name"], "color": place_dict["category_color"], "icon": place_dict["category_icon"]}
        else:
            place_dict["category"] = None

        # Clean up redundant keys
        for key in ["category_name", "category_color", "category_icon"]:
            if key in place_dict:
                del place_dict[key]

        result.append(place_dict)

    return result


async def get_newest_places(conn: asyncpg.Connection, limit: int = 10) -> List[Dict[str, Any]]:
    """Get the newest places."""
    # First get the base places data
    places = await conn.fetch(
        """
        SELECT p.id, p.name, p.description, p.latitude, p.longitude, 
               p.user_id, p.created_at, p.updated_at,
               p.osm_id, p.is_osm_imported, p.osm_tags,
               u.username as user_username
        FROM places p
        LEFT JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT $1
        """,
        limit
    )
    
    result = []
    for place in places:
        place_dict = dict(place)
        
        # Get all categories for this place
        categories = await conn.fetch(
            """
            SELECT c.id, c.name, c.color, c.icon
            FROM categories c
            JOIN place_categories pc ON c.id = pc.category_id
            WHERE pc.place_id = $1
            ORDER BY c.name
            """,
            place_dict['id']
        )
        
        place_dict['categories'] = [dict(category) for category in categories]
        
        # Get engagement metrics
        place_id = place_dict['id']
        
        # Get likes count
        likes_count = await conn.fetchval(
            """
            SELECT COUNT(*) FROM likes 
            WHERE place_id = $1 AND is_like = TRUE
            """,
            place_id
        )
        
        # Get dislikes count
        dislikes_count = await conn.fetchval(
            """
            SELECT COUNT(*) FROM likes 
            WHERE place_id = $1 AND is_like = FALSE
            """,
            place_id
        )
        
        # Get favorites count
        favorites_count = await conn.fetchval(
            """
            SELECT COUNT(*) FROM favorites 
            WHERE place_id = $1
            """,
            place_id
        )
        
        place_dict['like_count'] = likes_count
        place_dict['dislike_count'] = dislikes_count
        place_dict['favorite_count'] = favorites_count
        
        result.append(place_dict)
    
    return result

async def get_top_places(conn: asyncpg.Connection, limit: int = 10) -> List[Dict[str, Any]]:
    """Get the top places by number of likes."""
    # Get places with like counts
    places_with_likes = await conn.fetch(
        """
        SELECT p.id, p.name, p.description, p.latitude, p.longitude, 
               p.user_id, p.created_at, p.updated_at,
               p.osm_id, p.is_osm_imported, p.osm_tags,
               u.username as user_username,
               COUNT(l.id) as like_count
        FROM places p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN likes l ON p.id = l.place_id AND l.is_like = TRUE
        GROUP BY p.id, u.username
        ORDER BY like_count DESC, p.created_at DESC
        LIMIT $1
        """,
        limit
    )
    
    result = []
    for place in places_with_likes:
        place_dict = dict(place)
        
        # Get all categories for this place
        categories = await conn.fetch(
            """
            SELECT c.id, c.name, c.color, c.icon
            FROM categories c
            JOIN place_categories pc ON c.id = pc.category_id
            WHERE pc.place_id = $1
            ORDER BY c.name
            """,
            place_dict['id']
        )
        
        place_dict['categories'] = [dict(category) for category in categories]
        
        # Get additional engagement metrics
        place_id = place_dict['id']
        
        # Get dislikes count
        dislikes_count = await conn.fetchval(
            """
            SELECT COUNT(*) FROM likes 
            WHERE place_id = $1 AND is_like = FALSE
            """,
            place_id
        )
        
        # Get favorites count
        favorites_count = await conn.fetchval(
            """
            SELECT COUNT(*) FROM favorites 
            WHERE place_id = $1
            """,
            place_id
        )
        
        place_dict['dislike_count'] = dislikes_count
        place_dict['favorite_count'] = favorites_count
        
        result.append(place_dict)
    
    return result

# Update the function to get all places
async def get_places(conn: asyncpg.Connection, skip: int = 0, limit: int = 100, category_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """Get a list of places with optional category filter."""
    query = """
    SELECT DISTINCT p.id, p.name, p.description, p.latitude, p.longitude, 
           p.user_id, p.created_at, p.updated_at,
           p.osm_id, p.is_osm_imported,
           u.username as user_username
    FROM places p
    LEFT JOIN users u ON p.user_id = u.id
    """

    params = []
    where_clause = []

    if category_id is not None:
        query += """
        JOIN place_categories pc ON p.id = pc.place_id
        """
        where_clause.append("pc.category_id = $1")
        params.append(category_id)

    if where_clause:
        query += " WHERE " + " AND ".join(where_clause)

    query += """
    ORDER BY p.created_at DESC
    LIMIT ${}
    OFFSET ${}
    """.format(
        len(params) + 1, len(params) + 2
    )

    params.extend([limit, skip])

    places = await conn.fetch(query, *params)

    result = []
    for place in places:
        place_dict = dict(place)

        # Get all categories for this place
        categories = await conn.fetch(
            """
            SELECT c.id, c.name, c.color, c.icon
            FROM categories c
            JOIN place_categories pc ON c.id = pc.category_id
            WHERE pc.place_id = $1
            ORDER BY c.name
            """,
            place_dict["id"],
        )

        place_dict["categories"] = [dict(category) for category in categories]

        # Get counts
        place_id = place_dict["id"]

        # Get likes count
        likes_count = await conn.fetchval(
            """
            SELECT COUNT(*) FROM likes 
            WHERE place_id = $1 AND is_like = TRUE
            """,
            place_id,
        )

        # Get dislikes count
        dislikes_count = await conn.fetchval(
            """
            SELECT COUNT(*) FROM likes 
            WHERE place_id = $1 AND is_like = FALSE
            """,
            place_id,
        )

        # Get favorites count
        favorites_count = await conn.fetchval(
            """
            SELECT COUNT(*) FROM favorites 
            WHERE place_id = $1
            """,
            place_id,
        )

        place_dict["like_count"] = likes_count
        place_dict["dislike_count"] = dislikes_count
        place_dict["favorite_count"] = favorites_count

        result.append(place_dict)

    return result


# Update place function (for editing)
async def update_place(
    conn: asyncpg.Connection, place_id: int, user_id: int, name: Optional[str] = None, description: Optional[str] = None, category_ids: Optional[List[int]] = None  # Changed from category_id
) -> Optional[Dict[str, Any]]:
    """Update a place's details, including multiple categories."""
    # First check if the place exists and belongs to the user
    place = await conn.fetchrow(
        """
        SELECT id FROM places
        WHERE id = $1 AND user_id = $2
        """,
        place_id,
        user_id,
    )

    if not place:
        return None  # Place not found or doesn't belong to user

    # Build update query parts
    update_parts = []
    params = [place_id]  # First param is always place_id

    if name is not None:
        update_parts.append(f"name = ${len(params) + 1}")
        params.append(name)

    if description is not None:
        update_parts.append(f"description = ${len(params) + 1}")
        params.append(description)

    # Update timestamp
    update_parts.append("updated_at = CURRENT_TIMESTAMP")

    # Execute the update if there are fields to update
    if update_parts:
        query = f"""
        UPDATE places
        SET {', '.join(update_parts)}
        WHERE id = $1
        """
        await conn.execute(query, *params)

    # Update categories if provided
    if category_ids is not None:
        # Remove all existing categories
        await conn.execute(
            """
            DELETE FROM place_categories
            WHERE place_id = $1
            """,
            place_id,
        )

        # Add new categories
        if category_ids and len(category_ids) > 0:
            for category_id in category_ids:
                await conn.execute(
                    """
                    INSERT INTO place_categories (place_id, category_id)
                    VALUES ($1, $2)
                    """,
                    place_id,
                    category_id,
                )

    # Return the updated place
    return await get_place(conn, place_id)

async def delete_place(conn: asyncpg.Connection, place_id: int, user_id: int) -> bool:
    """Delete a place (only if it belongs to the user)."""
    # First check if the place exists and belongs to the user
    place = await conn.fetchrow(
        """
        SELECT id FROM places
        WHERE id = $1 AND user_id = $2
        """,
        place_id,
        user_id,
    )

    if not place:
        return False  # Place not found or doesn't belong to user

    # Delete the place and all related data (comments, likes, favorites)
    # Note: This relies on CASCADE delete constraints in the database
    await conn.execute(
        """
        DELETE FROM places
        WHERE id = $1
        """,
        place_id,
    )

    return True
