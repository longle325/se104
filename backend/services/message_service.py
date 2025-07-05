from typing import Optional, List, Dict
from bson import ObjectId
from datetime import datetime
from db import db
from config import VN_TIMEZONE
from models import DirectMessage, DirectMessageResponse, Conversation

class MessageService:
    def __init__(self):
        self.messages_collection = db.direct_messages
        self.conversations_collection = db.conversations
        self.users_collection = db.users
    
    def get_vietnam_time_naive(self):
        """Get current time in Vietnam timezone without timezone info"""
        return datetime.now(VN_TIMEZONE).replace(tzinfo=None)
    
    async def send_message(self, message_data: DirectMessage, sender: str) -> DirectMessageResponse:
        """Send a direct message with enhanced features"""
        try:
            current_time = self.get_vietnam_time_naive()
            
            # Create message document
            message_dict = {
                "from_user": sender,
                "to_user": message_data.to_user,
                "content": message_data.content,
                "post_id": message_data.post_id,
                "post_link": message_data.post_link,
                "reply_to": message_data.reply_to,
                "timestamp": current_time,
                "is_read": False,
                "is_delivered": True,
                "is_deleted": False,
                "edited_at": None,
                "reactions": [],
                "message_type": "text"  # text, image, file, etc.
            }
            
            # Handle reply context
            if message_data.reply_to:
                reply_message = self.messages_collection.find_one({"_id": ObjectId(message_data.reply_to)})
                if reply_message:
                    message_dict["reply_content"] = reply_message["content"][:100]  # Limit reply preview
                    message_dict["reply_author"] = reply_message["from_user"]
            
            result = self.messages_collection.insert_one(message_dict)
            
            if result.inserted_id:
                # Update or create conversation
                await self._update_conversation(sender, message_data.to_user, result.inserted_id, current_time)
                
                # Get sender info for response
                sender_info = self.users_collection.find_one({"username": sender})
                
                # Get created message
                created_message = self.messages_collection.find_one({"_id": result.inserted_id})
                created_message["from_user_info"] = {
                    "full_name": sender_info.get("full_name") if sender_info else sender,
                    "avatar_url": sender_info.get("avatar_url") if sender_info else None
                }
                
                return self._format_message_response(created_message)
            else:
                raise Exception("Failed to send message")
                
        except Exception as e:
            raise Exception(f"Error sending message: {str(e)}")
    
    async def get_conversation_messages(self, user1: str, user2: str, limit: int = 50, skip: int = 0) -> List[DirectMessageResponse]:
        """Get messages between two users with pagination"""
        try:
            query = {
                "$or": [
                    {"from_user": user1, "to_user": user2},
                    {"from_user": user2, "to_user": user1}
                ],
                "is_deleted": {"$ne": True}
            }
            
            cursor = self.messages_collection.find(query).sort("timestamp", -1).skip(skip).limit(limit)
            messages = list(cursor)
            
            # Get user info for messages
            user_infos = {}
            for message in messages:
                for user in [message["from_user"], message["to_user"]]:
                    if user not in user_infos:
                        user_info = self.users_collection.find_one({"username": user})
                        user_infos[user] = {
                            "full_name": user_info.get("full_name") if user_info else user,
                            "avatar_url": user_info.get("avatar_url") if user_info else None
                        }
            
            # Add user info to messages
            for message in messages:
                message["from_user_info"] = user_infos.get(message["from_user"])
                message["to_user_info"] = user_infos.get(message["to_user"])
            
            return [self._format_message_response(msg) for msg in reversed(messages)]
            
        except Exception as e:
            raise Exception(f"Error getting messages: {str(e)}")
    
    async def get_user_conversations(self, username: str) -> List[Dict]:
        """Get all conversations for a user"""
        try:
            query = {"participants": username}
            conversations = list(self.conversations_collection.find(query).sort("updated_at", -1))
            
            result = []
            for conv in conversations:
                # Get other participant
                other_user = [p for p in conv["participants"] if p != username][0]
                
                # Get other user info
                other_user_info = self.users_collection.find_one({"username": other_user})
                
                # Get last message
                last_message = None
                if conv.get("last_message_id"):
                    last_message_doc = self.messages_collection.find_one({"_id": conv["last_message_id"]})
                    if last_message_doc:
                        last_message = self._format_message_response(last_message_doc)
                
                # Get unread count
                unread_count = self.messages_collection.count_documents({
                    "from_user": other_user,
                    "to_user": username,
                    "is_read": False,
                    "is_deleted": {"$ne": True}
                })
                
                result.append({
                    "id": str(conv["_id"]),
                    "other_user": other_user,
                    "other_user_info": {
                        "full_name": other_user_info.get("full_name") if other_user_info else other_user,
                        "avatar_url": other_user_info.get("avatar_url") if other_user_info else None,
                        "is_online": other_user_info.get("is_online", False) if other_user_info else False
                    },
                    "last_message": last_message,
                    "unread_count": unread_count,
                    "updated_at": conv["updated_at"]
                })
            
            return result
            
        except Exception as e:
            raise Exception(f"Error getting conversations: {str(e)}")
    
    async def mark_messages_as_read(self, reader: str, sender: str) -> bool:
        """Mark messages as read"""
        try:
            result = self.messages_collection.update_many(
                {
                    "from_user": sender,
                    "to_user": reader,
                    "is_read": False
                },
                {
                    "$set": {
                        "is_read": True,
                        "read_at": self.get_vietnam_time_naive()
                    }
                }
            )
            return result.modified_count > 0
            
        except Exception as e:
            raise Exception(f"Error marking messages as read: {str(e)}")
    
    async def delete_message(self, message_id: str, user: str) -> bool:
        """Delete message (soft delete)"""
        try:
            if not ObjectId.is_valid(message_id):
                return False
            
            # Check if user is sender
            message = self.messages_collection.find_one({
                "_id": ObjectId(message_id),
                "from_user": user
            })
            
            if not message:
                return False
            
            result = self.messages_collection.update_one(
                {"_id": ObjectId(message_id)},
                {
                    "$set": {
                        "is_deleted": True,
                        "deleted_at": self.get_vietnam_time_naive(),
                        "content": "Tin nhắn đã được thu hồi"
                    }
                }
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            raise Exception(f"Error deleting message: {str(e)}")
    
    async def edit_message(self, message_id: str, user: str, new_content: str) -> Optional[DirectMessageResponse]:
        """Edit message content"""
        try:
            if not ObjectId.is_valid(message_id):
                return None
            
            # Check if user is sender and message is not too old (e.g., 15 minutes)
            message = self.messages_collection.find_one({
                "_id": ObjectId(message_id),
                "from_user": user,
                "is_deleted": {"$ne": True}
            })
            
            if not message:
                return None
            
            # Check time limit (15 minutes)
            current_time = self.get_vietnam_time_naive()
            time_diff = current_time - message["timestamp"]
            if time_diff.total_seconds() > 900:  # 15 minutes
                return None
            
            result = self.messages_collection.update_one(
                {"_id": ObjectId(message_id)},
                {
                    "$set": {
                        "content": new_content,
                        "edited_at": current_time,
                        "is_edited": True
                    }
                }
            )
            
            if result.modified_count > 0:
                updated_message = self.messages_collection.find_one({"_id": ObjectId(message_id)})
                return self._format_message_response(updated_message)
            
            return None
            
        except Exception as e:
            raise Exception(f"Error editing message: {str(e)}")
    
    async def get_unread_count(self, username: str) -> int:
        """Get total unread messages count for user"""
        try:
            return self.messages_collection.count_documents({
                "to_user": username,
                "is_read": False,
                "is_deleted": {"$ne": True}
            })
            
        except Exception as e:
            return 0
    
    async def _update_conversation(self, user1: str, user2: str, last_message_id: ObjectId, timestamp: datetime):
        """Update or create conversation"""
        try:
            participants = sorted([user1, user2])
            
            conversation = self.conversations_collection.find_one({
                "participants": participants
            })
            
            if conversation:
                # Update existing conversation
                self.conversations_collection.update_one(
                    {"_id": conversation["_id"]},
                    {
                        "$set": {
                            "last_message_id": last_message_id,
                            "updated_at": timestamp
                        }
                    }
                )
            else:
                # Create new conversation
                self.conversations_collection.insert_one({
                    "participants": participants,
                    "last_message_id": last_message_id,
                    "created_at": timestamp,
                    "updated_at": timestamp
                })
                
        except Exception as e:
            print(f"Error updating conversation: {str(e)}")
    
    def _format_message_response(self, message_dict: Dict) -> DirectMessageResponse:
        """Format message dictionary to DirectMessageResponse model"""
        if not message_dict:
            return None
        
        return DirectMessageResponse(
            id=str(message_dict["_id"]),
            to_user=message_dict["to_user"],
            content=message_dict["content"],
            post_id=message_dict.get("post_id"),
            post_link=message_dict.get("post_link"),
            reply_to=message_dict.get("reply_to"),
            from_user=message_dict["from_user"],
            timestamp=message_dict["timestamp"],
            is_read=message_dict.get("is_read", False),
            is_deleted=message_dict.get("is_deleted", False),
            reply_content=message_dict.get("reply_content"),
            reply_author=message_dict.get("reply_author")
        ) 