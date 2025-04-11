import asyncpg
from typing import List, Dict, Any, Optional

# Comment operations
async def create_comment(
    conn: asyncpg.Connection,
    content: str,
    place_id: int,
    user_id: int
) -> Dict[str, Any]:
    """Create a new comment."""
    comment = await conn.fetchrow(
        """
        INSERT INTO comments (content, place_id, user_id)
        VALUES ($1, $2, $3)
        RETURNING id, content, place_id, user_id, created_at, updated_at
        """,
        content, place_id, user_id
    )
    
    comment_dict = dict(comment)
    
    # Get user info
    user = await conn.fetchrow(
        """
        SELECT id, username, email
        FROM users
        WHERE id = $1
        """,
        user_id
    )
    
    if user:
        comment_dict['user'] = dict(user)
    
    return comment_dict

async def get_comments_for_place(
    conn: asyncpg.Connection,
    place_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """Get comments for a place."""
    comments = await conn.fetch(
        """
        SELECT c.id, c.content, c.place_id, c.user_id, c.created_at, c.updated_at,
               u.username as user_username, u.email as user_email
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.place_id = $1
        ORDER BY c.created_at DESC
        LIMIT $2 OFFSET $3
        """,
        place_id, limit, skip
    )
    
    result = []
    for comment in comments:
        comment_dict = dict(comment)
        
        # Format user info
        comment_dict['user'] = {
            'id': comment_dict['user_id'],
            'username': comment_dict['user_username'],
            'email': comment_dict['user_email']
        }
        
        # Clean up redundant keys
        for key in ['user_username', 'user_email']:
            if key in comment_dict:
                del comment_dict[key]
        
        result.append(comment_dict)
    
    return result

# Like operations
async def create_or_update_like(
    conn: asyncpg.Connection,
    place_id: int,
    user_id: int,
    is_like: bool
) -> Dict[str, Any]:
    """Create or update a like/dislike."""
    # Check if user already liked/disliked this place
    existing_like = await conn.fetchrow(
        """
        SELECT id, place_id, user_id, is_like, created_at
        FROM likes
        WHERE place_id = $1 AND user_id = $2
        """,
        place_id, user_id
    )
    
    if existing_like:
        # Update existing like/dislike
        like = await conn.fetchrow(
            """
            UPDATE likes
            SET is_like = $1
            WHERE id = $2
            RETURNING id, place_id, user_id, is_like, created_at
            """,
            is_like, existing_like['id']
        )
    else:
        # Create new like/dislike
        like = await conn.fetchrow(
            """
            INSERT INTO likes (place_id, user_id, is_like)
            VALUES ($1, $2, $3)
            RETURNING id, place_id, user_id, is_like, created_at
            """,
            place_id, user_id, is_like
        )
    
    return dict(like)

# Favorite operations
async def toggle_favorite(
    conn: asyncpg.Connection,
    place_id: int,
    user_id: int
) -> Optional[Dict[str, Any]]:
    """Toggle a favorite for a place."""
    # Check if user already favorited this place
    existing_favorite = await conn.fetchrow(
        """
        SELECT id
        FROM favorites
        WHERE place_id = $1 AND user_id = $2
        """,
        place_id, user_id
    )
    
    if existing_favorite:
        # Remove favorite
        await conn.execute(
            """
            DELETE FROM favorites
            WHERE id = $1
            """,
            existing_favorite['id']
        )
        return None
    else:
        # Add favorite
        favorite = await conn.fetchrow(
            """
            INSERT INTO favorites (place_id, user_id)
            VALUES ($1, $2)
            RETURNING id, place_id, user_id, created_at
            """,
            place_id, user_id
        )
        return dict(favorite)

async def get_user_favorites(
    conn: asyncpg.Connection,
    user_id: int
) -> List[Dict[str, Any]]:
    """Get a user's favorited places."""
    places = await conn.fetch(
        """
        SELECT p.id, p.name, p.description, p.latitude, p.longitude, 
               p.category_id, p.user_id, p.created_at, p.updated_at,
               c.id as category_id, c.name as category_name, 
               c.color as category_color, c.icon as category_icon
        FROM places p
        JOIN favorites f ON p.id = f.place_id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE f.user_id = $1
        ORDER BY f.created_at DESC
        """,
        user_id
    )
    
    result = []
    for place in places:
        place_dict = dict(place)
        
        # Add category as nested object
        if place_dict.get('category_id'):
            place_dict['category'] = {
                'id': place_dict['category_id'],
                'name': place_dict['category_name'],
                'color': place_dict['category_color'],
                'icon': place_dict['category_icon']
            }
        else:
            place_dict['category'] = None
        
        # Clean up redundant keys
        for key in ['category_name', 'category_color', 'category_icon']:
            if key in place_dict:
                del place_dict[key]
        
        # Get counts
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