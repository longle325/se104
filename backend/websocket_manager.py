import asyncio
import json
import logging
from typing import Dict, Set, Optional
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import jwt
from config import settings

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Store active connections: {user_id: {websocket, last_ping}}
        self.active_connections: Dict[str, Dict] = {}
        # Track online users
        self.online_users: Set[str] = set()
        # Store user rooms for group features
        self.user_rooms: Dict[str, Set[str]] = {}
        # Ping interval (seconds)
        self.ping_interval = 30
        
    async def connect(self, websocket: WebSocket, user_id: str):
        """Add new connection"""
        try:
            await websocket.accept()
            
            # Store connection info
            self.active_connections[user_id] = {
                'websocket': websocket,
                'last_ping': datetime.now(),
                'connected_at': datetime.now()
            }
            
            # Add to online users
            self.online_users.add(user_id)
            
            logger.info(f"🔗 User {user_id} connected. Total online: {len(self.online_users)}")
            
            # Broadcast user online status
            await self.broadcast_user_status(user_id, "online")
            
            # Send online users list to newly connected user
            await self.send_to_user(user_id, {
                "type": "online_users",
                "users": list(self.online_users)
            })
            
            # Start ping task for this connection
            asyncio.create_task(self._ping_user(user_id))
            
        except Exception as e:
            logger.error(f"Error connecting user {user_id}: {e}")
            await self.disconnect(user_id)

    async def disconnect(self, user_id: str):
        """Remove connection"""
        try:
            if user_id in self.active_connections:
                # Close websocket if still open
                ws_info = self.active_connections[user_id]
                try:
                    await ws_info['websocket'].close()
                except:
                    pass
                
                # Remove from active connections
                del self.active_connections[user_id]
                
                # Remove from online users
                self.online_users.discard(user_id)
                
                # Remove from all rooms
                for room_id in list(self.user_rooms.keys()):
                    self.user_rooms[room_id].discard(user_id)
                    if not self.user_rooms[room_id]:
                        del self.user_rooms[room_id]
                
                logger.info(f"❌ User {user_id} disconnected. Total online: {len(self.online_users)}")
                
                # Broadcast user offline status
                await self.broadcast_user_status(user_id, "offline")
                
        except Exception as e:
            logger.error(f"Error disconnecting user {user_id}: {e}")

    async def send_to_user(self, user_id: str, message: dict):
        """Send message to specific user"""
        try:
            if user_id in self.active_connections:
                websocket = self.active_connections[user_id]['websocket']
                await websocket.send_text(json.dumps(message))
                return True
        except Exception as e:
            logger.error(f"Error sending message to {user_id}: {e}")
            # Remove broken connection
            await self.disconnect(user_id)
        return False

    async def broadcast_to_all(self, message: dict, exclude: Optional[str] = None):
        """Broadcast message to all connected users"""
        disconnected_users = []
        
        for user_id in list(self.active_connections.keys()):
            if exclude and user_id == exclude:
                continue
                
            success = await self.send_to_user(user_id, message)
            if not success:
                disconnected_users.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected_users:
            await self.disconnect(user_id)

    async def broadcast_user_status(self, user_id: str, status: str):
        """Broadcast user online/offline status"""
        message = {
            "type": "user_status",
            "username": user_id,
            "status": status,
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast_to_all(message, exclude=user_id)

    async def join_room(self, user_id: str, room_id: str):
        """Add user to a room"""
        if room_id not in self.user_rooms:
            self.user_rooms[room_id] = set()
        self.user_rooms[room_id].add(user_id)
        logger.info(f"User {user_id} joined room {room_id}")

    async def leave_room(self, user_id: str, room_id: str):
        """Remove user from a room"""
        if room_id in self.user_rooms:
            self.user_rooms[room_id].discard(user_id)
            if not self.user_rooms[room_id]:
                del self.user_rooms[room_id]
        logger.info(f"User {user_id} left room {room_id}")

    async def broadcast_to_room(self, room_id: str, message: dict, exclude: Optional[str] = None):
        """Broadcast message to all users in a room"""
        if room_id in self.user_rooms:
            for user_id in list(self.user_rooms[room_id]):
                if exclude and user_id == exclude:
                    continue
                await self.send_to_user(user_id, message)

    async def send_notification(self, user_id: str, notification_data: dict):
        """Send notification to user"""
        message = {
            "type": "notification",
            "data": notification_data
        }
        return await self.send_to_user(user_id, message)

    async def send_new_message(self, participants: list, message_data: dict):
        """Send new message to conversation participants"""
        message = {
            "type": "new_message",
            "message": message_data
        }
        
        for participant in participants:
            if participant in self.online_users:
                await self.send_to_user(participant, message)
                logger.info(f"📤 Message sent to {participant}")

    async def handle_typing_start(self, user_id: str, conversation_id: str, other_user: str):
        """Handle typing start event"""
        message = {
            "type": "typing_start",
            "username": user_id,
            "conversation_id": conversation_id
        }
        await self.send_to_user(other_user, message)

    async def handle_typing_stop(self, user_id: str, conversation_id: str, other_user: str):
        """Handle typing stop event"""
        message = {
            "type": "typing_stop", 
            "username": user_id,
            "conversation_id": conversation_id
        }
        await self.send_to_user(other_user, message)

    async def _ping_user(self, user_id: str):
        """Send periodic ping to maintain connection"""
        while user_id in self.active_connections:
            try:
                await asyncio.sleep(self.ping_interval)
                
                if user_id not in self.active_connections:
                    break
                    
                # Send ping
                ping_message = {"type": "ping", "timestamp": datetime.now().isoformat()}
                success = await self.send_to_user(user_id, ping_message)
                
                if success:
                    self.active_connections[user_id]['last_ping'] = datetime.now()
                else:
                    # Connection failed, disconnect user
                    await self.disconnect(user_id)
                    break
                    
            except Exception as e:
                logger.error(f"Error pinging user {user_id}: {e}")
                await self.disconnect(user_id)
                break

    def get_online_users_count(self) -> int:
        """Get number of online users"""
        return len(self.online_users)

    def is_user_online(self, user_id: str) -> bool:
        """Check if user is online"""
        return user_id in self.online_users

    def get_connection_info(self) -> dict:
        """Get connection statistics"""
        return {
            "total_connections": len(self.active_connections),
            "online_users": len(self.online_users),
            "active_rooms": len(self.user_rooms),
            "users": list(self.online_users)
        }

# Global connection manager instance
connection_manager = ConnectionManager()

def verify_websocket_token(token: str) -> Optional[str]:
    """Verify JWT token for WebSocket connection"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        return username
    except jwt.JWTError:
        return None 