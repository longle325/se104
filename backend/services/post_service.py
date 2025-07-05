from typing import Optional, List, Dict
from bson import ObjectId
from datetime import datetime
from db import db
from config import settings, VN_TIMEZONE
from models import Post, PostUpdate, PostResponse

class PostService:
    def __init__(self):
        self.collection = db["Post"]
    
    def get_vietnam_time_naive(self):
        """Get current time in Vietnam timezone without timezone info"""
        return datetime.now(VN_TIMEZONE).replace(tzinfo=None)
    
    async def create_post(self, post_data: Post, author: str) -> PostResponse:
        """Create new post with default status based on category"""
        try:
            # Set default status based on category
            default_status = settings.DEFAULT_POST_STATUS.get(post_data.category, "active")
            
            post_dict = {
                **post_data.dict(),
                "author": author,
                "status": default_status,  # Set default status here
                "view_count": 0,
                "created_at": self.get_vietnam_time_naive(),
                "updated_at": self.get_vietnam_time_naive()
            }
            
            result = self.collection.insert_one(post_dict)
            
            if result.inserted_id:
                # Retrieve the created post
                created_post = self.collection.find_one({"_id": result.inserted_id})
                return self._format_post_response(created_post)
            else:
                raise Exception("Failed to create post")
                
        except Exception as e:
            raise Exception(f"Error creating post: {str(e)}")
    
    async def get_post_by_id(self, post_id: str) -> Optional[PostResponse]:
        """Get post by ID and increment view count"""
        try:
            if not ObjectId.is_valid(post_id):
                return None
                
            # Increment view count
            self.collection.update_one(
                {"_id": ObjectId(post_id)},
                {"$inc": {"view_count": 1}}
            )
            
            post = self.collection.find_one({"_id": ObjectId(post_id)})
            return self._format_post_response(post) if post else None
            
        except Exception as e:
            raise Exception(f"Error getting post: {str(e)}")
    
    async def get_posts(self, category: Optional[str] = None, limit: int = 20, skip: int = 0) -> List[PostResponse]:
        """Get posts with filtering and pagination"""
        try:
            query = {}
            if category:
                query["category"] = category
            
            cursor = self.collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
            posts = list(cursor)
            
            return [self._format_post_response(post) for post in posts]
            
        except Exception as e:
            raise Exception(f"Error getting posts: {str(e)}")
    
    async def update_post(self, post_id: str, post_data: PostUpdate, author: str) -> PostResponse:
        """Update post (only by author)"""
        try:
            if not ObjectId.is_valid(post_id):
                raise Exception("Invalid post ID")
            
            # Check if post exists and user is author
            existing_post = self.collection.find_one({"_id": ObjectId(post_id)})
            if not existing_post:
                raise Exception("Post not found")
            
            if existing_post["author"] != author:
                raise Exception("Not authorized to update this post")
            
            # Prepare update data
            update_data = {k: v for k, v in post_data.dict().items() if v is not None}
            update_data["updated_at"] = self.get_vietnam_time_naive()
            
            result = self.collection.update_one(
                {"_id": ObjectId(post_id)},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                updated_post = self.collection.find_one({"_id": ObjectId(post_id)})
                return self._format_post_response(updated_post)
            else:
                raise Exception("Failed to update post")
                
        except Exception as e:
            raise Exception(f"Error updating post: {str(e)}")
    
    async def update_post_status(self, post_id: str, status: str, author: str) -> PostResponse:
        """Update post status (only by author)"""
        try:
            if not ObjectId.is_valid(post_id):
                raise Exception("Invalid post ID")
            
            # Check if post exists and user is author
            existing_post = self.collection.find_one({"_id": ObjectId(post_id)})
            if not existing_post:
                raise Exception("Post not found")
            
            if existing_post["author"] != author:
                raise Exception("Not authorized to update this post")
            
            # Validate status based on category
            valid_statuses = {
                "lost": ["not_found", "found"],
                "found": ["not_returned", "returned"]
            }
            
            category = existing_post["category"]
            if status not in valid_statuses.get(category, []):
                raise Exception(f"Invalid status '{status}' for category '{category}'")
            
            result = self.collection.update_one(
                {"_id": ObjectId(post_id)},
                {"$set": {"status": status, "updated_at": self.get_vietnam_time_naive()}}
            )
            
            if result.modified_count > 0:
                updated_post = self.collection.find_one({"_id": ObjectId(post_id)})
                return self._format_post_response(updated_post)
            else:
                raise Exception("Failed to update post status")
                
        except Exception as e:
            raise Exception(f"Error updating post status: {str(e)}")
    
    async def delete_post(self, post_id: str, author: str) -> bool:
        """Delete post (only by author)"""
        try:
            if not ObjectId.is_valid(post_id):
                raise Exception("Invalid post ID")
            
            # Check if post exists and user is author
            existing_post = self.collection.find_one({"_id": ObjectId(post_id)})
            if not existing_post:
                raise Exception("Post not found")
            
            if existing_post["author"] != author:
                raise Exception("Not authorized to delete this post")
            
            result = self.collection.delete_one({"_id": ObjectId(post_id)})
            return result.deleted_count > 0
            
        except Exception as e:
            raise Exception(f"Error deleting post: {str(e)}")
    
    def _format_post_response(self, post_dict: Dict) -> PostResponse:
        """Format post dictionary to PostResponse model"""
        if not post_dict:
            return None
        
        return PostResponse(
            id=str(post_dict["_id"]),
            title=post_dict["title"],
            content=post_dict["content"],
            category=post_dict["category"],
            item_type=post_dict.get("item_type"),
            tags=post_dict.get("tags", []),
            location=post_dict.get("location"),
            custom_location=post_dict.get("custom_location"),
            image_urls=post_dict.get("image_urls", []),
            status=post_dict.get("status", "active"),
            view_count=post_dict.get("view_count", 0),
            author=post_dict["author"],
            created_at=post_dict["created_at"],
            updated_at=post_dict.get("updated_at")
        ) 