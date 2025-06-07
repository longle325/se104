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
    view_count: Optional[int] = 0
    
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
    reply_to: Optional[str] = None  # ID of message being replied to

class DirectMessageResponse(DirectMessage):
    id: str
    from_user: str
    timestamp: datetime
    is_read: Optional[bool] = False
    is_deleted: Optional[bool] = False
    reply_content: Optional[str] = None  # Content of replied message
    reply_author: Optional[str] = None   # Author of replied message

class Conversation(BaseModel):
    participants: List[str]  # List of 2 usernames
    last_message: Optional[DirectMessageResponse] = None
    created_at: datetime
    updated_at: datetime

class PostReport(BaseModel):
    post_id: str
    reason: str  # "spam", "inappropriate", "fake", "other"
    description: Optional[str] = None  # Additional details
    
class PostReportResponse(PostReport):
    id: str
    reporter: str
    created_at: datetime
    status: str  # "pending", "reviewed", "resolved"

class Comment(BaseModel):
    post_id: str
    content: str
    
class CommentResponse(Comment):
    id: str
    author: str
    created_at: datetime
    updated_at: Optional[datetime] = None

class Notification(BaseModel):
    user_id: str  # recipient username
    type: str  # "comment", "message", "system", "contact"
    title: str
    message: str
    related_post_id: Optional[str] = None
    related_user: Optional[str] = None  # username of the person who triggered notification
    data: Optional[dict] = None  # additional data
    
class NotificationResponse(Notification):
    id: str
    created_at: datetime
    is_read: Optional[bool] = False

# Admin models
class AdminLogin(BaseModel):
    username: str
    password: str

class UserBan(BaseModel):
    username: str
    reason: str
    duration_days: Optional[int] = None  # None means permanent ban
    
class UserMute(BaseModel):
    username: str
    reason: str
    duration_days: int

class AdminDashboardStats(BaseModel):
    total_users: int
    active_users: int
    banned_users: int
    total_posts: int
    total_reports: int
    pending_reports: int
    posts_today: int
    users_today: int

class AdminUserResponse(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    student_id: Optional[str] = None
    is_active: bool
    is_banned: Optional[bool] = False
    ban_reason: Optional[str] = None
    ban_until: Optional[datetime] = None
    is_muted: Optional[bool] = False
    mute_reason: Optional[str] = None
    mute_until: Optional[datetime] = None
    created_at: datetime
    last_login: Optional[datetime] = None
    posts_count: int
    reports_count: int  # Number of times this user has been reported

class AdminPostResponse(BaseModel):
    id: str
    title: str
    content: str
    category: str
    author: str
    author_info: Optional[dict] = None
    created_at: datetime
    status: str
    view_count: int
    reports_count: int
    image_urls: Optional[List[str]] = []
    location: Optional[str] = None

class AdminReportResponse(BaseModel):
    id: str
    post_id: str
    post_title: str
    reporter: str
    reporter_info: Optional[dict] = None
    reason: str
    description: Optional[str] = None
    created_at: datetime
    status: str  # "pending", "reviewed", "resolved"
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    action_taken: Optional[str] = None  # "deleted", "warned", "ignored"

class AdminActionLog(BaseModel):
    id: str
    admin_username: str
    action: str  # "ban_user", "delete_post", "resolve_report", etc.
    target_type: str  # "user", "post", "report"
    target_id: str
    reason: Optional[str] = None
    created_at: datetime
    
class ReportAction(BaseModel):
    action: str  # "resolve", "delete_post", "warn_user", "ignore"
    reason: Optional[str] = None