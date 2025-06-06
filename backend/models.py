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
    student_id: str  # MSSV - Student ID
    email: str
    phonenumber: str
    password: str
    # full_name will be automatically mapped from student_id, so not needed in registration

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
    item_type: Optional[str] = None  # "the_sinh_vien", "vi_giay_to", "dien_tu", "khac"
    tags: Optional[List[str]] = []
    location: Optional[str] = None
    custom_location: Optional[str] = None  # For when location is "khac"
    image_urls: Optional[List[str]] = []
    status: Optional[str] = "active"  # For lost: "found"/"not_found", For found: "returned"/"not_returned"
    
class PostResponse(Post):
    id: str
    author: str
    created_at: datetime
    updated_at: Optional[datetime] = None

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    item_type: Optional[str] = None
    tags: Optional[List[str]] = None
    location: Optional[str] = None
    status: Optional[str] = None

# Simplified chat models for direct messaging
class DirectMessage(BaseModel):
    to_user: str  # username of recipient
    content: str
    post_id: Optional[str] = None  # Link to a specific post
    post_link: Optional[str] = None  # Direct link to the post

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