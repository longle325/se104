from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class User(BaseModel):
    username: str
    email: str
    phonenumber: str
    password: str
    full_name: Optional[str] = None
    is_active: Optional[bool] = False

class UserRegistration(BaseModel):
    email: str
    phonenumber: str
    password: str
    full_name: Optional[str] = None

class Login(BaseModel):
    username: str  # Changed back to username for login
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None

class EmailVerification(BaseModel):
    email: str
    verification_token: str

class PasswordResetRequest(BaseModel):
    email: str

class VerificationCode(BaseModel):
    email: str
    code: str

class PasswordReset(BaseModel):
    email: str
    code: str
    new_password: str

# New models for additional features
class UserProfile(BaseModel):
    username: str
    full_name: Optional[str] = None
    student_id: Optional[str] = None
    major: Optional[str] = None
    year: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    created_at: Optional[datetime] = None

class Post(BaseModel):
    title: str
    content: str
    category: str  # "lost" (tìm đồ), "found" (nhặt được)
    tags: Optional[List[str]] = []
    location: Optional[str] = None
    image_urls: Optional[List[str]] = []
    contact_info: str
    
class PostResponse(Post):
    id: str
    author: str
    created_at: datetime
    updated_at: Optional[datetime] = None

# Simplified chat models for direct messaging
class DirectMessage(BaseModel):
    to_user: str  # username of recipient
    content: str

class DirectMessageResponse(DirectMessage):
    id: str
    from_user: str
    timestamp: datetime
    is_read: Optional[bool] = False

class Conversation(BaseModel):
    participants: List[str]  # List of 2 usernames
    last_message: Optional[DirectMessageResponse] = None
    created_at: datetime
    updated_at: datetime