from typing import Optional, List, Dict
import os
import re
import secrets
import random
import string
import smtplib
import json
import shutil
import pytz
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
from dotenv import load_dotenv
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Request, status, BackgroundTasks, WebSocket, WebSocketDisconnect, File, UploadFile
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from jose import JWTError, jwt
from pydantic import BaseModel
from bson import ObjectId

from db import db
from hashing import Hash
import oauth
from oauth import get_current_user
from models import (
    User, UserRegistration, Login, Token, TokenData, EmailVerification, PasswordResetRequest, 
    VerificationCode, PasswordReset, UserProfile, Post, PostResponse, 
    DirectMessage, DirectMessageResponse, Conversation, PostUpdate, PostReport, PostReportResponse, 
    Comment, CommentResponse, CommentReport, CommentReportResponse, Notification, NotificationResponse,
    AdminLogin, UserBan, UserMute, AdminDashboardStats, AdminUserResponse, AdminPostResponse, AdminReportResponse, AdminActionLog, ReportAction
)

# Load environment variables
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1200"))
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME", "your_email@gmail.com")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "your_app_password")

# Store verification codes temporarily (in production, use a database)
verification_codes = {}

# GMT+7 timezone (Vietnam)
VN_TIMEZONE = pytz.timezone('Asia/Ho_Chi_Minh')

# Admin constants
ADMIN_CREDENTIALS = {
    "admin12": "123456"  # In production, use hashed passwords
}

def get_vietnam_time():
    """Get current time in Vietnam timezone (GMT+7)"""
    return datetime.now(VN_TIMEZONE)

def get_utc_time():
    """Get current UTC time (kept for compatibility)"""
    return datetime.utcnow()

def get_vietnam_time_naive():
    """Get current time in Vietnam timezone without timezone info (for database storage)"""
    return get_vietnam_time().replace(tzinfo=None)

# WebSocket Connection Manager for Realtime Chat
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, username: str):
        await websocket.accept()
        self.active_connections[username] = websocket
        print(f"User {username} connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, username: str):
        if username in self.active_connections:
            del self.active_connections[username]
        print(f"User {username} disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: str, username: str):
        if username in self.active_connections:
            try:
                await self.active_connections[username].send_text(message)
                return True
            except:
                # Connection might be broken, remove it
                self.disconnect(username)
                return False
        return False
    
    async def broadcast_to_conversation(self, message: dict, participants: List[str]):
        """Send message to all participants in a conversation who are online"""
        for username in participants:
            if username in self.active_connections:
                try:
                    await self.active_connections[username].send_text(json.dumps(message))
                except:
                    self.disconnect(username)

manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    if db is None:
        print("WARNING: No database connection established. Application may not function properly.")
    
    yield
    # Shutdown - you can add cleanup code here if needed

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = get_vietnam_time() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire.timestamp()})  # Use timestamp for JWT
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str, credentials_exception):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
        return token_data
    except JWTError:
        raise credentials_exception

def generate_verification_token():
    return secrets.token_urlsafe(32)

def generate_verification_code():
    return ''.join(random.choices(string.digits, k=6))

def send_email(to_email: str, subject: str, html_content: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(_send_email_task, to_email, subject, html_content)

def _send_email_task(to_email: str, subject: str, html_content: str):
    """Background task to send email"""
    try:
        gmail_user = EMAIL_USERNAME  # Use environment variable
        gmail_password = EMAIL_PASSWORD  # Use environment variable
        
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = formataddr(("UIT-W2F", gmail_user))
        message["To"] = to_email
        
        # Add HTML content
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        # Create SMTP session
        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)  # Use environment variables
        server.starttls()  # Enable security
        server.login(gmail_user, gmail_password)
        text = message.as_string()
        server.sendmail(gmail_user, to_email, text)
        server.quit()
        print(f"Email sent successfully to {to_email}")
        
    except Exception as e:
        print(f"Error sending email: {e}")

def send_message_notification_email(to_email: str, sender_name: str, message_content: str, post_link: str = None, post_title: str = None):
    """Send email notification when someone sends a message"""
    try:
        subject = f"UIT Lost & Found - Bạn có tin nhắn mới từ {sender_name}"
        
        # Create email content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Tin nhắn mới</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h2 style="color: #007bff; margin-bottom: 20px;">🔔 Bạn có tin nhắn mới!</h2>
                    <p><strong>Người gửi:</strong> {sender_name}</p>
                    <p><strong>Nội dung tin nhắn:</strong></p>
                    <div style="background-color: white; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
                        <p style="margin: 0;">{message_content}</p>
                    </div>
        """
        
        if post_link and post_title:
            html_content += f"""
                    <p><strong>Liên quan đến bài đăng:</strong></p>
                    <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 10px 0;">
                        <p style="margin: 0; font-weight: bold;">{post_title}</p>
                        <a href="{post_link}" style="color: #007bff; text-decoration: none;">👉 Xem bài đăng</a>
                    </div>
            """
        
        html_content += f"""
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="http://localhost:3000/chat" 
                       style="background-color: #007bff; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        💬 Trả lời tin nhắn
                    </a>
                </div>
                
                <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
                    <p style="margin: 0; font-size: 14px; color: #666;">
                        <strong>UIT Lost & Found</strong><br>
                        Nền tảng kết nối sinh viên UIT - Tìm kiếm đồ vật thất lạc<br>
                        <em>Email này được gửi tự động, vui lòng không trả lời.</em>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        _send_email_task(to_email, subject, html_content)
        
    except Exception as e:
        print(f"Error sending message notification email: {e}")

app = FastAPI(lifespan=lifespan)

# Create uploads directory if it doesn't exist before mounting
uploads_dir = "uploads"
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)

origins = [
    "http://localhost:5173",
    "http://localhost:8000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for serving uploaded images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Add exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    print(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred"},
    )

# Helper functions for validation
def validate_email(email: str) -> bool:
    domain = "@gm.uit.edu.vn"
    if not email.endswith(domain):
        return False
    local_part = email.split("@")[0]
    if len(local_part) != 8 or not local_part.isdigit():
        return False

    first_two = int(local_part[:2])
    if first_two < 7 or first_two > 23:
        return False

    if local_part[2:4] != "52":
        return False

    last_four = int(local_part[4:])
    if last_four < 1 or last_four > 1800:
        return False

    return True

def validate_phone(phone: str) -> bool:
    """Validate that phone number is in Vietnam format (starts with 0 and has 10 digits)."""
    pattern = r"^0\d{9}$"
    return re.fullmatch(pattern, phone) is not None

@app.get("/")
def read_root(current_user: User = Depends(get_current_user)):
    return {"data": "Hello World"}

def load_student_mapping():
    """Load student ID to name mapping from JSON file."""
    try:
        with open("student_mapping.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("student_mapping", {})
    except FileNotFoundError:
        print("Warning: student_mapping.json not found. Creating empty mapping.")
        return {}
    except json.JSONDecodeError:
        print("Error: Invalid JSON in student_mapping.json")
        return {}

@app.post('/register')
async def create_user(request: UserRegistration, background_tasks: BackgroundTasks):
    # Load student mapping
    student_mapping = load_student_mapping()
    
    # Check if student_id exists in mapping
    if request.student_id not in student_mapping:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student ID {request.student_id} not found in system. Please contact administrator."
        )
    
    # Get full name from mapping
    full_name = student_mapping[request.student_id]
    
    # Check email and phone number
    if not validate_email(request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email must have the '@gm.uit.edu.vn' domain"
        )
    if not validate_phone(request.phonenumber):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number must be a valid Vietnam phone number (10 digits starting with 0)"
        )
    
    # Auto-generate username from email (first 8 digits)
    username = request.email.split("@")[0]
    
    # Check if email already exists
    if db["User"].find_one({"email": request.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists. Please use a different email address."
        )
    
    # Check if student_id already exists
    if db["User"].find_one({"student_id": request.student_id}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student ID already registered. Please contact administrator if this is an error."
        )
        
    hashed_pass = Hash.bcrypt(request.password)
    user_object = {
        "username": username,
        "email": request.email,
        "phonenumber": request.phonenumber,
        "password": hashed_pass,
        "student_id": request.student_id,
        "full_name": full_name,  # Automatically mapped from student_id
        "created_at": get_vietnam_time_naive(),
        "is_active": False
    }
    
    # Generate verification token
    verification_token = generate_verification_token()
    user_object["verification_token"] = verification_token
    
    # Insert user to database
    db["User"].insert_one(user_object)
    
    # Send verification email
    verification_link = f"http://localhost:8000/verify-email?email={request.email}&token={verification_token}"
    email_content = f"""
    <html>
    <body>
        <h2>Welcome to UIT Where To Find!</h2>
        <p>Hello {full_name},</p>
        <p>Please click the link below to verify your email address:</p>
        <p><a href="{verification_link}">Verify Email</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>Your username is: <strong>{username}</strong></p>
        <p>Your student ID: <strong>{request.student_id}</strong></p>
    </body>
    </html>
    """
    
    send_email(
        to_email=request.email,
        subject="Verify Your Email Address - UIT Where To Find",
        html_content=email_content,
        background_tasks=background_tasks
    )
    
    return {
        "message": "User created successfully. Please check your email to verify your account.",
        "username": username,
        "full_name": full_name
    }

@app.get('/verify-email', response_class=HTMLResponse)
async def verify_email(email: str, token: str):
    user = db["User"].find_one({"email": email, "verification_token": token})
    
    if not user:
        return """
        <html>
        <body>
            <h1>Invalid verification link</h1>
            <p>The verification link is invalid or has expired.</p>
        </body>
        </html>
        """
    
    # Mark user as active
    db["User"].update_one(
        {"email": email}, 
        {"$set": {"is_active": True}, "$unset": {"verification_token": ""}}
    )
    
    return """
    <html>
    <body>
        <h1>Email Verified</h1>
        <p>Your email has been successfully verified. You can now login to your account.</p>
        <script>
            setTimeout(function() {
                window.location.href = 'http://localhost:5173/login';
            }, 3000);
        </script>
    </body>
    </html>
    """

@app.post('/login')
def login(request: Login):
    user = db["User"].find_one({"username": request.username})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'No user found with username {request.username}'
        )
    if not Hash.verify(user["password"], request.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # Check if user is active
    if not user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not activated. Please check your email to verify your account."
        )
        
    access_token = create_access_token(data={"sub": user["username"]})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "username": user["username"],
            "email": user["email"],
            "full_name": user.get("full_name"),
            "avatar_url": user.get("avatar_url")
        }
    }

@app.post('/forgot-password')
async def forgot_password(request: PasswordResetRequest, background_tasks: BackgroundTasks):
    user = db["User"].find_one({"email": request.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No user found with this email address"
        )
    
    # Generate verification code
    verification_code = generate_verification_code()
    
    # Store verification code (in production, store in DB with expiration)
    verification_codes[request.email] = {
        "code": verification_code,
        "expiry": get_vietnam_time_naive() + timedelta(minutes=15)
    }
    
    # Send email with verification code
    email_content = f"""
    <html>
    <body>
        <h2>Password Reset Request</h2>
        <p>Your verification code is: <strong>{verification_code}</strong></p>
        <p>This code will expire in 15 minutes.</p>
    </body>
    </html>
    """
    
    send_email(
        to_email=request.email,
        subject="Password Reset Verification Code",
        html_content=email_content,
        background_tasks=background_tasks
    )
    
    return {"message": "Verification code sent to your email"}

@app.post('/verify-reset-code')
async def verify_reset_code(verification: VerificationCode):
    if verification.email not in verification_codes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No verification code found for this email"
        )
    
    stored_verification = verification_codes[verification.email]
    
    # Check if code has expired
    if get_vietnam_time_naive() > stored_verification["expiry"]:
        # Remove expired code
        del verification_codes[verification.email]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired"
        )
    
    # Check if code matches
    if verification.code != stored_verification["code"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )
    
    return {"message": "Verification successful"}

@app.post('/reset-password')
async def reset_password(reset_request: PasswordReset):
    # Verify the code again
    if reset_request.email not in verification_codes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No verification code found for this email"
        )
    
    stored_verification = verification_codes[reset_request.email]
    
    # Check if code has expired
    if get_vietnam_time_naive() > stored_verification["expiry"]:
        # Remove expired code
        del verification_codes[reset_request.email]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired"
        )
    
    # Check if code matches
    if reset_request.code != stored_verification["code"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )
    
    # Update the password
    hashed_pass = Hash.bcrypt(reset_request.new_password)
    result = db["User"].update_one(
        {"email": reset_request.email},
        {"$set": {"password": hashed_pass}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Remove the verification code
    del verification_codes[reset_request.email]
    
    return {"message": "Password reset successful"}

@app.get("/users")
def get_users(current_user: User = Depends(get_current_user)):
    users = list(db["User"].find({}, {"password": 0}))  # Exclude password from result
    for user in users:
        user["_id"] = str(user["_id"])  # Convert ObjectId to string if needed
    return users

@app.get("/users/{username}")
def get_user(username: str, current_user: User = Depends(get_current_user)):
    user = db["User"].find_one({"username": username}, {"password": 0})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user["_id"] = str(user["_id"])
    return user

@app.put("/users/{username}")
def update_user(username: str, update_data: User, current_user: User = Depends(get_current_user)):
    user = db["User"].find_one({"username": username})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # If email or phone number are updated, revalidate them.
    update_dict = update_data.dict(exclude_unset=True)
    if "email" in update_dict and not validate_email(update_dict["email"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email must have the '@gm.uit.edu.vn' domain"
        )
    if "phonenumber" in update_dict and not validate_phone(update_dict["phonenumber"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number is not valid. Try again."
        )
    # Hash password if it is being updated.
    if "password" in update_dict:
        update_dict["password"] = Hash.bcrypt(update_dict["password"])
    
    db["User"].update_one({"username": username}, {"$set": update_dict})
    return {"res": "User updated successfully"}

@app.delete("/users/{username}")
def delete_user(username: str, current_user: User = Depends(get_current_user)):
    user = db["User"].find_one({"username": username})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    db["User"].delete_one({"username": username})
    return {"res": "User deleted successfully"}

# User Profile endpoints
@app.get("/profile/{username}")
def get_user_profile(username: str, current_user: User = Depends(get_current_user)):
    user = db["User"].find_one({"username": username}, {"password": 0})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Load student mapping to ensure we have latest real names
    student_mapping = load_student_mapping()
    
    # Update full_name from mapping if student_id exists
    if user.get("student_id") and user["student_id"] in student_mapping:
        current_full_name = student_mapping[user["student_id"]]
        # Update user's full_name in database if it's different
        if user.get("full_name") != current_full_name:
            db["User"].update_one(
                {"username": username},
                {"$set": {"full_name": current_full_name}}
            )
            user["full_name"] = current_full_name
    
    profile = db["UserProfile"].find_one({"username": username})
    if profile:
        # If profile exists, merge with user data to ensure we have all basic info
        profile["_id"] = str(profile["_id"])
        # Ensure basic user info is included
        profile["username"] = user["username"]
        profile["email"] = user["email"]
        profile["full_name"] = user.get("full_name")  # Include full_name from User collection
        profile["student_id"] = user.get("student_id")
        profile["avatar_url"] = user.get("avatar_url")  # Include avatar from User collection
        profile["created_at"] = user.get("created_at")
        return profile
    else:
        # Return basic user info if no profile exists
        return {
            "username": user["username"],
            "email": user["email"],
            "phonenumber": user.get("phonenumber"),
            "full_name": user.get("full_name"),  # Include full_name from User collection
            "student_id": user.get("student_id"),
            "avatar_url": user.get("avatar_url"),  # Include avatar from User collection
            "created_at": user.get("created_at")
        }

@app.put("/profile/{username}")
def update_user_profile(username: str, profile_data: UserProfile, current_user: User = Depends(get_current_user)):
    if current_user.username != username:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only update your own profile")
    
    profile_dict = profile_data.dict(exclude_unset=True)
    profile_dict["updated_at"] = get_vietnam_time_naive()
    
    # Remove protected fields that should not be updated via this endpoint
    protected_fields = ["username", "full_name", "student_id", "email"]
    for field in protected_fields:
        profile_dict.pop(field, None)
    
    # Update UserProfile collection
    result = db["UserProfile"].update_one(
        {"username": username},
        {"$set": profile_dict},
        upsert=True
    )
    
    return {"message": "Profile updated successfully"}

# Posts endpoints
@app.get("/posts")
def get_posts(category: Optional[str] = None, limit: int = 20, skip: int = 0):
    filter_dict = {}
    if category:
        filter_dict["category"] = category
    
    posts = list(db["Post"].find(filter_dict).sort("created_at", -1).skip(skip).limit(limit))
    
    # Load student mapping for name resolution
    student_mapping = load_student_mapping()
    
    for post in posts:
        post["id"] = str(post["_id"])
        del post["_id"]
        
        # Check if author field exists and get author's full name and avatar
        if post.get("author"):
            author_user = db["User"].find_one({"username": post["author"]}, {"password": 0})
            if author_user:
                # Update full_name from mapping if needed
                if author_user.get("student_id") and author_user["student_id"] in student_mapping:
                    current_full_name = student_mapping[author_user["student_id"]]
                    if author_user.get("full_name") != current_full_name:
                        db["User"].update_one(
                            {"username": post["author"]},
                            {"$set": {"full_name": current_full_name}}
                        )
                        author_user["full_name"] = current_full_name
                
                post["author_info"] = {
                    "username": author_user["username"],
                    "full_name": author_user.get("full_name"),
                    "avatar_url": author_user.get("avatar_url")
                }
            else:
                # Author user not found, use default info
                post["author_info"] = {
                    "username": post["author"],
                    "full_name": post["author"],
                    "avatar_url": None
                }
        else:
            # No author field, set default values
            post["author"] = "Unknown"
            post["author_info"] = {
                "username": "Unknown",
                "full_name": "Unknown",
                "avatar_url": None
            }
    
    return posts

@app.post("/posts")
def create_post(post_data: Post, current_user: User = Depends(get_current_user)):
    post_dict = post_data.dict()
    post_dict["author"] = current_user.username
    post_dict["created_at"] = get_vietnam_time_naive()
    post_dict["view_count"] = 0  # Initialize view count
    
    result = db["Post"].insert_one(post_dict)
    post_dict["id"] = str(result.inserted_id)
    del post_dict["_id"]
    
    return post_dict

@app.get("/posts/{post_id}")
def get_post(post_id: str):
    try:
        # Increment view count
        db["Post"].update_one(
            {"_id": ObjectId(post_id)},
            {"$inc": {"view_count": 1}}
        )
        
        post = db["Post"].find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        
        post["id"] = str(post["_id"])
        del post["_id"]
        
        # Load student mapping and get author info
        student_mapping = load_student_mapping()
        if post.get("author"):
            author_user = db["User"].find_one({"username": post["author"]}, {"password": 0})
            if author_user:
                # Update full_name from mapping if needed
                if author_user.get("student_id") and author_user["student_id"] in student_mapping:
                    current_full_name = student_mapping[author_user["student_id"]]
                    if author_user.get("full_name") != current_full_name:
                        db["User"].update_one(
                            {"username": post["author"]},
                            {"$set": {"full_name": current_full_name}}
                        )
                        author_user["full_name"] = current_full_name
                
                post["author_info"] = {
                    "username": author_user["username"],
                    "full_name": author_user.get("full_name"),
                    "avatar_url": author_user.get("avatar_url")
                }
            else:
                # Author user not found, use default info
                post["author_info"] = {
                    "username": post["author"],
                    "full_name": post["author"],
                    "avatar_url": None
                }
        else:
            # No author field, set default values
            post["author"] = "Unknown"
            post["author_info"] = {
                "username": "Unknown",
                "full_name": "Unknown",
                "avatar_url": None
            }
        
        return post
    except:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid post ID")

@app.put("/posts/{post_id}")
def update_post(post_id: str, post_data: PostUpdate, current_user: User = Depends(get_current_user)):
    try:
        post = db["Post"].find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        
        if post["author"] != current_user.username:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only edit your own posts")
        
        update_dict = post_data.dict(exclude_unset=True)
        update_dict["updated_at"] = get_vietnam_time_naive()
        
        db["Post"].update_one({"_id": ObjectId(post_id)}, {"$set": update_dict})
        
        return {"message": "Post updated successfully"}
    except:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid post ID")

@app.put("/posts/{post_id}/status")
def update_post_status(post_id: str, status_data: dict, current_user: User = Depends(get_current_user)):
    try:
        post = db["Post"].find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        
        if post["author"] != current_user.username:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only update your own posts")
        
        new_status = status_data.get("status")
        if not new_status:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status is required")
        
        # Validate status based on category
        valid_statuses = {
            "lost": ["not_found", "found"],
            "found": ["not_returned", "returned"]
        }
        
        if new_status not in valid_statuses.get(post["category"], []):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status for this post category")
        
        db["Post"].update_one(
            {"_id": ObjectId(post_id)}, 
            {"$set": {"status": new_status, "updated_at": get_vietnam_time_naive()}}
        )
        
        return {"message": "Post status updated successfully", "status": new_status}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid post ID")

@app.delete("/posts/{post_id}")
def delete_post(post_id: str, current_user: User = Depends(get_current_user)):
    try:
        post = db["Post"].find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        
        if post["author"] != current_user.username:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only delete your own posts")
        
        db["Post"].delete_one({"_id": ObjectId(post_id)})
        
        return {"message": "Post deleted successfully"}
    except:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid post ID")

# Chat endpoints - Replace old room-based system with direct messaging
@app.get("/conversations")
def get_conversations(current_user: User = Depends(get_current_user)):
    """Get all conversations for current user"""
    conversations = list(db["Conversation"].find(
        {"participants": current_user.username}
    ).sort("updated_at", -1))
    
    valid_conversations = []
    for conv in conversations:
        conv["id"] = str(conv["_id"])
        conversation_id = conv["id"]
        del conv["_id"]
        
        # Get other participant info - safety check for valid conversations
        other_participants = [p for p in conv["participants"] if p != current_user.username]
        if not other_participants:
            # Skip conversations with no other participants
            continue
            
        other_participant = other_participants[0]
        user_info = db["User"].find_one({"username": other_participant}, {"password": 0})
        
        if user_info:  # Only include if other user exists
            conv["other_user"] = {
                "username": user_info["username"],
                "full_name": user_info.get("full_name"),
                "email": user_info["email"],
                "avatar_url": user_info.get("avatar_url")
            }
            
            # Get last message
            last_message = db["DirectMessage"].find_one(
                {"conversation_id": conversation_id},
                sort=[("timestamp", -1)]
            )
            
            if last_message:
                conv["last_message"] = {
                    "id": str(last_message["_id"]),
                    "content": last_message["content"],
                    "from_user": last_message["from_user"],
                    "timestamp": last_message["timestamp"],
                    "is_read": last_message.get("is_read", False)
                }
            else:
                conv["last_message"] = None
            
            # Get unread count for current user
            unread_count = db["DirectMessage"].count_documents({
                "conversation_id": conversation_id,
                "to_user": current_user.username,
                "is_read": False
            })
            conv["unread_count"] = unread_count
            
            valid_conversations.append(conv)
        
    return valid_conversations

@app.get("/conversations/{other_username}/messages")
def get_messages(other_username: str, limit: int = 50, skip: int = 0, current_user: User = Depends(get_current_user)):
    """Get messages between current user and another user"""
    participants = sorted([current_user.username, other_username])
    
    # Find or create conversation
    conversation = db["Conversation"].find_one({"participants": participants})
    if not conversation:
        return []
    
    messages = list(db["DirectMessage"].find({
        "conversation_id": str(conversation["_id"])
    }).sort("timestamp", -1).skip(skip).limit(limit))
    
    for message in messages:
        message["id"] = str(message["_id"])
        del message["_id"]
        # Ensure all reply fields are present
        if "reply_to" not in message:
            message["reply_to"] = None
        if "reply_content" not in message:
            message["reply_content"] = None
        if "reply_author" not in message:
            message["reply_author"] = None
        if "is_deleted" not in message:
            message["is_deleted"] = False
            
        # Add author info for from_user and to_user
        for user_field in ["from_user", "to_user"]:
            if user_field in message:
                user_info = db["User"].find_one({"username": message[user_field]}, {"password": 0})
                if user_info:
                    message[f"{user_field}_info"] = {
                        "username": user_info["username"],
                        "full_name": user_info.get("full_name"),
                        "avatar_url": user_info.get("avatar_url")
                    }
                else:
                    message[f"{user_field}_info"] = {
                        "username": message[user_field],
                        "full_name": None,
                        "avatar_url": None
                    }
                    
        # Update reply_author to use full_name if available
        if message.get("reply_author"):
            reply_author_info = db["User"].find_one({"username": message["reply_author"]}, {"password": 0})
            if reply_author_info and reply_author_info.get("full_name"):
                message["reply_author_display"] = reply_author_info["full_name"]
            else:
                message["reply_author_display"] = message["reply_author"]
    
    return messages[::-1]  # Return in chronological order

@app.post("/conversations/{other_username}/messages")
async def send_direct_message(other_username: str, message_data: DirectMessage, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user)):
    """Send a direct message to another user"""
    # Check if other user exists
    other_user = db["User"].find_one({"username": other_username})
    if not other_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    participants = sorted([current_user.username, other_username])
    
    # Find or create conversation
    conversation = db["Conversation"].find_one({"participants": participants})
    if not conversation:
        conversation_data = {
            "participants": participants,
            "created_at": get_vietnam_time_naive(),
            "updated_at": get_vietnam_time_naive()
        }
        result = db["Conversation"].insert_one(conversation_data)
        conversation_id = str(result.inserted_id)
    else:
        conversation_id = str(conversation["_id"])
        # Update conversation timestamp
        db["Conversation"].update_one(
            {"_id": conversation["_id"]},
            {"$set": {"updated_at": get_vietnam_time_naive()}}
        )
    
    # Create message
    message_dict = {
        "conversation_id": conversation_id,
        "from_user": current_user.username,
        "to_user": other_username,
        "content": message_data.content,
        "timestamp": get_vietnam_time_naive(),
        "is_read": False,
        "is_deleted": False,
        "reply_to": message_data.reply_to
    }
    
    # Add post information if provided
    if message_data.post_id:
        message_dict["post_id"] = message_data.post_id
        
        # Get post information for the link
        try:
            post = db["Post"].find_one({"_id": ObjectId(message_data.post_id)})
            if post:
                message_dict["post_link"] = f"http://localhost:3000/posts/{message_data.post_id}"
                message_dict["post_title"] = post.get("title", "")
        except:
            pass
    
    # Add reply information if provided
    if message_data.reply_to:
        try:
            replied_message = db["DirectMessage"].find_one({"_id": ObjectId(message_data.reply_to)})
            if replied_message:
                message_dict["reply_content"] = replied_message.get("content", "")
                message_dict["reply_author"] = replied_message.get("from_user", "")
        except:
            pass
    
    result = db["DirectMessage"].insert_one(message_dict)
    message_dict["id"] = str(result.inserted_id)
    del message_dict["_id"]
    
    # Get current user info from database for email
    current_user_info = db["User"].find_one({"username": current_user.username})
    sender_name = current_user_info.get("full_name", current_user.username) if current_user_info else current_user.username
    
    # Send email notification to recipient
    background_tasks.add_task(
        send_message_notification_email,
        other_user["email"],
        sender_name,
        message_data.content,
        message_dict.get("post_link"),
        message_dict.get("post_title")
    )
    
    # Create in-app notification for recipient
    notification_title = "Tin nhắn mới"
    notification_message = f"{sender_name} đã gửi tin nhắn cho bạn"
    if message_dict.get("post_title"):
        notification_message += f' về bài đăng "{message_dict["post_title"]}"'
    
    create_notification(
        user_id=other_username,
        notification_type="message",
        title=notification_title,
        message=notification_message,
        related_user=current_user.username,
        data={
            "conversation_id": conversation_id,
            "message_id": message_dict["id"],
            "post_id": message_dict.get("post_id"),
            "post_link": message_dict.get("post_link")
        }
    )

    # Send realtime notification to recipient if online
    await manager.broadcast_to_conversation({
        "type": "new_message",
        "message": message_dict
    }, participants)
    
    return message_dict

@app.post("/messages/send")
async def send_message(message_data: DirectMessage, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user)):
    """Send a message to another user"""
    return await send_direct_message(message_data.to_user, message_data, background_tasks, current_user)

@app.delete("/messages/{message_id}")
async def delete_message(message_id: str, current_user: User = Depends(get_current_user)):
    """Delete/recall a message (only by sender)"""
    try:
        # Find the message
        message = db["DirectMessage"].find_one({"_id": ObjectId(message_id)})
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Check if user is the sender
        if message["from_user"] != current_user.username:
            raise HTTPException(status_code=403, detail="You can only delete your own messages")
        
        # Check if message was sent within last 5 minutes (optional time limit)
        message_time = message["timestamp"]
        current_time = get_vietnam_time_naive()
        time_diff = (current_time - message_time).total_seconds()
        
        # Allow deletion within 24 hours
        if time_diff > 86400:  # 24 hours in seconds
            raise HTTPException(status_code=403, detail="Cannot delete messages older than 24 hours")
        
        # Mark message as deleted instead of actually deleting it
        db["DirectMessage"].update_one(
            {"_id": ObjectId(message_id)},
            {"$set": {"is_deleted": True, "content": "Tin nhắn đã được thu hồi"}}
        )
        
        # Broadcast deletion to all participants
        participants = [message["from_user"], message["to_user"]]
        await manager.broadcast_to_conversation({
            "type": "message_deleted",
            "message_id": message_id,
            "deleted_by": current_user.username
        }, participants)
        
        return {"message": "Message deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid message ID")

# WebSocket endpoint for realtime chat
@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    # Verify user authentication through query parameter
    token = websocket.query_params.get("token")
    print(f"WebSocket connection attempt for user: {username}")
    
    if not token:
        print(f"Missing token for user: {username}")
        await websocket.close(code=4001, reason="Missing authentication token")
        return
    
    try:
        # Verify JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        token_username: str = payload.get("sub")
        print(f"Token decoded successfully. Token username: {token_username}, URL username: {username}")
        
        if token_username != username:
            print(f"Username mismatch. Token: {token_username}, URL: {username}")
            await websocket.close(code=4003, reason="Invalid token for user")
            return
            
        # Verify user exists in database
        user = db["User"].find_one({"username": username})
        if not user:
            print(f"User {username} not found in database")
            await websocket.close(code=4004, reason="User not found")
            return
            
        if not user.get("is_active", False):
            print(f"User {username} is not active")
            await websocket.close(code=4005, reason="User account not activated")
            return
            
        print(f"User {username} verified successfully, connecting WebSocket")
        
    except JWTError as e:
        print(f"JWT error for user {username}: {e}")
        await websocket.close(code=4001, reason="Invalid authentication token")
        return
    except Exception as e:
        print(f"Unexpected error during WebSocket auth for user {username}: {e}")
        await websocket.close(code=4002, reason="Authentication error")
        return
    
    # Connect user
    await manager.connect(websocket, username)
    
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
                
                if message_data.get("type") == "ping":
                    # Respond to ping with pong to keep connection alive
                    await websocket.send_text(json.dumps({"type": "pong"}))
                
                elif message_data.get("type") == "send_message":
                    # Handle message sending through WebSocket
                    other_username = message_data.get("to_user")
                    content = message_data.get("content")
                    
                    if other_username and content:
                        # Check if other user exists
                        other_user = db["User"].find_one({"username": other_username})
                        if other_user:
                            participants = sorted([username, other_username])
                            
                            # Find or create conversation
                            conversation = db["Conversation"].find_one({"participants": participants})
                            if not conversation:
                                conversation_data = {
                                    "participants": participants,
                                    "created_at": get_vietnam_time_naive(),
                                    "updated_at": get_vietnam_time_naive()
                                }
                                result = db["Conversation"].insert_one(conversation_data)
                                conversation_id = str(result.inserted_id)
                            else:
                                conversation_id = str(conversation["_id"])
                                # Update conversation timestamp
                                db["Conversation"].update_one(
                                    {"_id": conversation["_id"]},
                                    {"$set": {"updated_at": get_vietnam_time_naive()}}
                                )
                            
                            # Create message
                            message_dict = {
                                "conversation_id": conversation_id,
                                "from_user": username,
                                "to_user": other_username,
                                "content": content,
                                "timestamp": get_vietnam_time_naive(),
                                "is_read": False
                            }
                            
                            result = db["DirectMessage"].insert_one(message_dict)
                            message_dict["id"] = str(result.inserted_id)
                            del message_dict["_id"]
                            
                            # Broadcast to all participants
                            await manager.broadcast_to_conversation({
                                "type": "new_message",
                                "message": message_dict
                            }, participants)
                        
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"type": "error", "message": "Invalid JSON"}))
            except Exception as e:
                print(f"Error handling websocket message: {e}")
                await websocket.send_text(json.dumps({"type": "error", "message": "Server error"}))
                
    except WebSocketDisconnect:
        manager.disconnect(username)
        print(f"User {username} disconnected from WebSocket")
    except Exception as e:
        print(f"WebSocket error for user {username}: {e}")
        manager.disconnect(username)

# Get online users
@app.get("/chat/online-users")
def get_online_users(current_user: User = Depends(get_current_user)):
    """Get list of currently online users"""
    return list(manager.active_connections.keys())

# Mark messages as read
@app.put("/conversations/{other_username}/read")
def mark_messages_read(other_username: str, current_user: User = Depends(get_current_user)):
    """Mark all messages from other user as read"""
    participants = sorted([current_user.username, other_username])
    
    conversation = db["Conversation"].find_one({"participants": participants})
    if conversation:
        db["DirectMessage"].update_many(
            {
                "conversation_id": str(conversation["_id"]),
                "to_user": current_user.username,
                "is_read": False
            },
            {"$set": {"is_read": True}}
        )
    
    return {"message": "Messages marked as read"}

@app.get("/messages/unread-count")
def get_unread_messages_count(current_user: User = Depends(get_current_user)):
    """Get total count of unread messages for current user"""
    count = db["DirectMessage"].count_documents({
        "to_user": current_user.username,
        "is_read": False
    })
    return {"unread_count": count}

# Image upload endpoint for new posts
@app.post("/upload-images")
async def upload_images(files: List[UploadFile] = File(...), current_user: User = Depends(get_current_user)):
    try:
        uploaded_files = []
        timestamp = int(get_vietnam_time_naive().timestamp())
        
        for file in files:
            # Generate unique filename
            file_extension = os.path.splitext(file.filename)[1]
            unique_filename = f"{current_user.username}_{timestamp}_{secrets.token_hex(8)}{file_extension}"
            file_path = f"uploads/{unique_filename}"
            
            # Save the file
            with open(file_path, "wb") as f:
                shutil.copyfileobj(file.file, f)
            
            uploaded_files.append(f"/uploads/{unique_filename}")
        
        return {"image_urls": uploaded_files}
    except Exception as e:
        print(f"Error uploading images: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upload images")

# Avatar upload endpoint
@app.post("/upload-avatar")
async def upload_avatar(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    try:
        # Validate file type
        if file.content_type not in ["image/jpeg", "image/png", "image/gif", "image/webp"]:
            raise HTTPException(status_code=400, detail=f"Invalid file type: {file.content_type}")
        
        timestamp = int(get_vietnam_time_naive().timestamp())
        
        # Generate unique filename for avatar
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"avatar_{current_user.username}_{timestamp}_{secrets.token_hex(8)}{file_extension}"
        file_path = f"uploads/{unique_filename}"
        
        # Create uploads directory if it doesn't exist
        os.makedirs("uploads", exist_ok=True)
        
        # Save the file
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        
        avatar_url = f"/uploads/{unique_filename}"
        
        # Update user's avatar in database
        db["User"].update_one(
            {"username": current_user.username},
            {"$set": {"avatar_url": avatar_url}}
        )
        
        return {"avatar_url": avatar_url}
    except Exception as e:
        print(f"Error uploading avatar: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upload avatar")

# Report Posts
@app.post("/posts/{post_id}/report")
def report_post(post_id: str, report_data: PostReport, current_user: User = Depends(get_current_user)):
    """Report a post for inappropriate content"""
    # Check if post exists
    try:
        post = db["Post"].find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
    except:
        raise HTTPException(status_code=400, detail="Invalid post ID")
    
    # Check if user has already reported this post
    existing_report = db["PostReport"].find_one({
        "post_id": post_id,
        "reporter": current_user.username
    })
    
    if existing_report:
        raise HTTPException(status_code=400, detail="You have already reported this post")
    
    # Create report
    report_dict = {
        "post_id": post_id,
        "reporter": current_user.username,
        "reason": report_data.reason,
        "description": report_data.description,
        "created_at": get_vietnam_time_naive(),
        "status": "pending"
    }
    
    result = db["PostReport"].insert_one(report_dict)
    report_dict["id"] = str(result.inserted_id)
    del report_dict["_id"]
    
    return {"message": "Report submitted successfully", "report": report_dict}

@app.get("/posts/{post_id}/reports")
def get_post_reports(post_id: str, current_user: User = Depends(get_current_user)):
    """Get reports for a specific post (admin only)"""
    # Only allow admin users to view reports
    if current_user.username != "admin":  # You can adjust this based on your admin system
        raise HTTPException(status_code=403, detail="Access denied")
    
    reports = list(db["PostReport"].find({"post_id": post_id}))
    for report in reports:
        report["id"] = str(report["_id"])
        del report["_id"]
    
    return reports

# Comments System
@app.get("/posts/{post_id}/comments")
def get_post_comments(post_id: str, limit: int = 50, skip: int = 0):
    """Get comments for a specific post"""
    try:
        # Check if post exists
        post = db["Post"].find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
    except:
        raise HTTPException(status_code=400, detail="Invalid post ID")
    
    comments = list(db["Comment"].find({"post_id": post_id})
                   .sort("created_at", -1)
                   .skip(skip)
                   .limit(limit))
    
    for comment in comments:
        comment["id"] = str(comment["_id"])
        del comment["_id"]
        
        # Get author info with full_name and avatar
        author_info = db["User"].find_one({"username": comment["author"]}, {"password": 0})
        if author_info:
            comment["author_info"] = {
                "username": author_info["username"],
                "full_name": author_info.get("full_name"),
                "avatar_url": author_info.get("avatar_url")
            }
        else:
            comment["author_info"] = {
                "username": comment["author"],
                "full_name": None,
                "avatar_url": None
            }
    
    return comments

@app.post("/posts/{post_id}/comments")
def create_comment(post_id: str, comment_data: Comment, current_user: User = Depends(get_current_user)):
    """Create a new comment on a post"""
    try:
        # Check if post exists
        post = db["Post"].find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
    except:
        raise HTTPException(status_code=400, detail="Invalid post ID")
    
    # Check if user is banned or muted
    user_info = db["User"].find_one({"username": current_user.username})
    if user_info:
        # Check if user is banned
        if user_info.get("is_banned", False):
            ban_until = user_info.get("ban_until")
            if ban_until is None or ban_until > get_vietnam_time_naive():
                raise HTTPException(
                    status_code=403, 
                    detail="Tài khoản của bạn đã bị khóa và không thể bình luận"
                )
        
        # Check if user is muted
        if user_info.get("is_muted", False):
            mute_until = user_info.get("mute_until")
            if mute_until and mute_until > get_vietnam_time_naive():
                remaining_days = (mute_until - get_vietnam_time_naive()).days + 1
                raise HTTPException(
                    status_code=403, 
                    detail=f"Bạn bị hạn chế bình luận trong {remaining_days} ngày nữa"
                )
            else:
                # Mute period has expired, remove mute status
                db["User"].update_one(
                    {"username": current_user.username},
                    {"$set": {"is_muted": False}, "$unset": {"mute_until": "", "mute_reason": ""}}
                )
    
    # Create comment
    comment_dict = {
        "post_id": post_id,
        "author": current_user.username,
        "content": comment_data.content,
        "created_at": get_vietnam_time_naive(),
        "updated_at": get_vietnam_time_naive()
    }
    
    # Add parent_id if this is a reply
    if hasattr(comment_data, 'parent_id') and comment_data.parent_id:
        # Verify parent comment exists
        try:
            parent_comment = db["Comment"].find_one({"_id": ObjectId(comment_data.parent_id)})
            if not parent_comment:
                raise HTTPException(status_code=404, detail="Parent comment not found")
            comment_dict["parent_id"] = comment_data.parent_id
        except:
            raise HTTPException(status_code=400, detail="Invalid parent comment ID")
    
    result = db["Comment"].insert_one(comment_dict)
    comment_dict["id"] = str(result.inserted_id)
    del comment_dict["_id"]
    
    # Add author info to the response
    author_info = db["User"].find_one({"username": current_user.username}, {"password": 0})
    if author_info:
        comment_dict["author_info"] = {
            "username": author_info["username"],
            "full_name": author_info.get("full_name"),
            "avatar_url": author_info.get("avatar_url")
        }
    else:
        comment_dict["author_info"] = {
            "username": current_user.username,
            "full_name": None,
            "avatar_url": None
        }
    
    # Create notification for post author if it's not their own comment
    if post["author"] != current_user.username:
        # Get commenter info
        commenter_info = db["User"].find_one({"username": current_user.username})
        commenter_name = commenter_info.get("full_name", current_user.username) if commenter_info else current_user.username
        
        create_notification(
            user_id=post["author"],
            notification_type="comment",
            title="Bình luận mới",
            message=f"{commenter_name} đã bình luận về bài đăng '{post['title']}'",
            related_post_id=post_id,
            related_user=current_user.username,
            data={
                "comment_id": comment_dict["id"],
                "post_title": post["title"]
            }
        )
    
    return comment_dict

@app.delete("/posts/{post_id}/comments/{comment_id}")
def delete_comment(post_id: str, comment_id: str, current_user: User = Depends(get_current_user)):
    """Delete a comment (only by author or admin)"""
    try:
        comment = db["Comment"].find_one({"_id": ObjectId(comment_id)})
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
    except:
        raise HTTPException(status_code=400, detail="Invalid comment ID")
    
    # Check if user is the author or admin
    if comment["author"] != current_user.username and current_user.username != "admin":
        raise HTTPException(status_code=403, detail="You can only delete your own comments")
    
    # Delete the comment
    db["Comment"].delete_one({"_id": ObjectId(comment_id)})
    
    # Also delete all reply comments (recursive deletion)
    reply_comments = list(db["Comment"].find({"parent_id": comment_id}))
    if reply_comments:
        reply_ids = [comment["_id"] for comment in reply_comments]
        db["Comment"].delete_many({"_id": {"$in": reply_ids}})
        
        # Recursively delete deeper nested replies
        for reply in reply_comments:
            reply_id = str(reply["_id"])
            deep_replies = list(db["Comment"].find({"parent_id": reply_id}))
            if deep_replies:
                db["Comment"].delete_many({"parent_id": reply_id})
    
    return {"message": "Comment and all replies deleted successfully"}

@app.post("/comments/{comment_id}/report")
def report_comment(comment_id: str, report_data: CommentReport, current_user: User = Depends(get_current_user)):
    """Report a comment"""
    try:
        # Validate ObjectId format
        if not ObjectId.is_valid(comment_id):
            raise HTTPException(status_code=400, detail=f"Invalid comment ID format: {comment_id}")
            
        # Check if comment exists
        comment = db["Comment"].find_one({"_id": ObjectId(comment_id)})
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=f"Invalid comment ID: {str(e)}")
    
    # Check if user has already reported this comment
    existing_report = db["CommentReport"].find_one({
        "comment_id": comment_id,
        "reporter": current_user.username
    })
    
    if existing_report:
        raise HTTPException(status_code=400, detail="You have already reported this comment")
    
    # Check if user is trying to report their own comment
    if comment["author"] == current_user.username:
        raise HTTPException(status_code=400, detail="You cannot report your own comment")
    
    # Create report
    report_dict = {
        "comment_id": comment_id,
        "reporter": current_user.username,
        "reason": report_data.reason,
        "description": report_data.description,
        "created_at": get_vietnam_time_naive(),
        "status": "pending"
    }
    
    result = db["CommentReport"].insert_one(report_dict)
    report_dict["id"] = str(result.inserted_id)
    del report_dict["_id"]
    
    return {"message": "Comment report submitted successfully", "report": report_dict}

# Get similar posts (recommendation algorithm)
@app.get("/posts/{post_id}/similar")
def get_similar_posts(post_id: str, limit: int = 5):
    """Get similar posts based on content, category, location, and item type"""
    try:
        # Get the reference post
        reference_post = db["Post"].find_one({"_id": ObjectId(post_id)})
        if not reference_post:
            raise HTTPException(status_code=404, detail="Post not found")
    except:
        raise HTTPException(status_code=400, detail="Invalid post ID")
    
    # Build similarity criteria
    similarity_criteria = []
    
    # Same category (highest priority)
    if reference_post.get("category"):
        similarity_criteria.append({"category": reference_post["category"]})
    
    # Same item type
    if reference_post.get("item_type"):
        similarity_criteria.append({"item_type": reference_post["item_type"]})
    
    # Same location
    if reference_post.get("location"):
        similarity_criteria.append({"location": reference_post["location"]})
    
    # Similar tags
    if reference_post.get("tags"):
        similarity_criteria.append({"tags": {"$in": reference_post["tags"]}})
    
    # Content similarity (basic keyword matching)
    if reference_post.get("content"):
        # Extract key words from content (simple approach)
        content_words = [word.lower() for word in reference_post["content"].split() 
                        if len(word) > 3][:5]  # Take first 5 significant words
        if content_words:
            content_regex = "|".join(content_words)
            similarity_criteria.append({
                "$or": [
                    {"title": {"$regex": content_regex, "$options": "i"}},
                    {"content": {"$regex": content_regex, "$options": "i"}}
                ]
            })
    
    # Query for similar posts
    similar_posts = []
    
    if similarity_criteria:
        # Use aggregation pipeline to score and sort by relevance
        pipeline = [
            {
                "$match": {
                    "_id": {"$ne": ObjectId(post_id)},  # Exclude the reference post
                    "$or": similarity_criteria
                }
            },
            {
                "$addFields": {
                    "relevance_score": {
                        "$sum": [
                            {"$cond": [{"$eq": ["$category", reference_post.get("category")]}, 10, 0]},
                            {"$cond": [{"$eq": ["$item_type", reference_post.get("item_type")]}, 5, 0]},
                            {"$cond": [{"$eq": ["$location", reference_post.get("location")]}, 3, 0]},
                            {"$cond": [{"$gt": [{"$size": {"$setIntersection": ["$tags", reference_post.get("tags", [])]}}, 0]}, 2, 0]}
                        ]
                    }
                }
            },
            {"$sort": {"relevance_score": -1, "created_at": -1}},
            {"$limit": limit}
        ]
        
        similar_posts = list(db["Post"].aggregate(pipeline))
    
    # If not enough similar posts, fill with recent posts from same category
    if len(similar_posts) < limit:
        additional_posts = list(db["Post"].find({
            "_id": {"$ne": ObjectId(post_id)},
            "category": reference_post.get("category")
        }).sort("created_at", -1).limit(limit - len(similar_posts)))
        
        # Convert ObjectId and avoid duplicates
        existing_ids = [str(post["_id"]) for post in similar_posts]
        for post in additional_posts:
            if str(post["_id"]) not in existing_ids:
                similar_posts.append(post)
    
    # Convert ObjectId to string and format response
    for post in similar_posts:
        post["id"] = str(post["_id"])
        del post["_id"]
    
    return similar_posts

# Notifications API
@app.get("/notifications")
def get_notifications(limit: int = 50, skip: int = 0, current_user: User = Depends(get_current_user)):
    """Get notifications for current user"""
    notifications = list(db["Notification"].find({
        "user_id": current_user.username
    }).sort("created_at", -1).skip(skip).limit(limit))
    
    for notification in notifications:
        notification["id"] = str(notification["_id"])
        del notification["_id"]
        # Convert datetime to ISO string for JSON serialization
        if "created_at" in notification and notification["created_at"]:
            notification["created_at"] = notification["created_at"].isoformat()
    
    return notifications

@app.get("/notifications/unread-count")
def get_unread_notifications_count(current_user: User = Depends(get_current_user)):
    """Get count of unread notifications"""
    count = db["Notification"].count_documents({
        "user_id": current_user.username,
        "is_read": False
    })
    return {"unread_count": count}

@app.put("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str, current_user: User = Depends(get_current_user)):
    """Mark a notification as read"""
    try:
        result = db["Notification"].update_one(
            {
                "_id": ObjectId(notification_id),
                "user_id": current_user.username
            },
            {"$set": {"is_read": True}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
            
        return {"message": "Notification marked as read"}
    except:
        raise HTTPException(status_code=400, detail="Invalid notification ID")

@app.put("/notifications/read-all")
def mark_all_notifications_read(current_user: User = Depends(get_current_user)):
    """Mark all notifications as read for current user"""
    result = db["Notification"].update_many(
        {"user_id": current_user.username, "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    return {"message": f"Marked {result.modified_count} notifications as read"}

def create_notification(user_id: str, notification_type: str, title: str, message: str, related_post_id: str = None, related_user: str = None, data: dict = None):
    """Create a new notification for a user"""
    try:
        notification_data = {
            "user_id": user_id,
            "type": notification_type,
            "title": title,
            "message": message,
            "related_post_id": related_post_id,
            "related_user": related_user,
            "data": data or {},
            "created_at": get_vietnam_time_naive(),
            "is_read": False
        }
        
        result = db["Notification"].insert_one(notification_data)
        
        print(f"Created notification for user {user_id}: {title}")
        return str(result.inserted_id)
        
    except Exception as e:
        print(f"Error creating notification: {e}")
        return None

# Admin helper functions
def verify_admin_credentials(username: str, password: str) -> bool:
    """Verify admin credentials"""
    return ADMIN_CREDENTIALS.get(username) == password

def get_current_admin(token: str = Depends(oauth.oauth2_scheme)):
    """Verify admin token and return admin info"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate admin credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        is_admin: bool = payload.get("is_admin", False)
        
        if username is None or not is_admin:
            raise credentials_exception
            
        # Verify admin still exists in our credentials
        if username not in ADMIN_CREDENTIALS:
            raise credentials_exception
            
        return {"username": username, "is_admin": True}
        
    except JWTError:
        raise credentials_exception

def log_admin_action(admin_username: str, action: str, target_type: str, target_id: str, reason: str = None):
    """Log admin actions for audit trail"""
    try:
        log_data = {
            "admin_username": admin_username,
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
            "reason": reason,
            "created_at": get_vietnam_time_naive()
        }
        
        db["AdminActionLog"].insert_one(log_data)
        print(f"Admin action logged: {admin_username} - {action} - {target_type}:{target_id}")
        
    except Exception as e:
        print(f"Error logging admin action: {e}")

# ===== ADMIN ENDPOINTS =====

@app.post('/admin/login')
def admin_login(request: AdminLogin):
    """Admin login endpoint"""
    try:
        if not verify_admin_credentials(request.username, request.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid admin credentials"
            )
        
        # Create token with admin flag
        access_token = create_access_token(
            data={"sub": request.username, "is_admin": True}
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Admin login error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get('/admin/dashboard/stats')
def get_admin_dashboard_stats(current_admin: dict = Depends(get_current_admin)):
    """Get dashboard statistics for admin"""
    try:
        # Get current date in Vietnam timezone
        today = get_vietnam_time_naive().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Count users
        total_users = db["User"].count_documents({})
        active_users = db["User"].count_documents({"is_active": True})
        banned_users = db["User"].count_documents({"is_banned": True})
        
        # Count posts
        total_posts = db["Post"].count_documents({})
        posts_today = db["Post"].count_documents({
            "created_at": {"$gte": today}
        })
        
        # Count reports
        total_reports = db["PostReport"].count_documents({})
        pending_reports = db["PostReport"].count_documents({"status": "pending"})
        
        # Count new users today
        users_today = db["User"].count_documents({
            "created_at": {"$gte": today}
        })
        
        return AdminDashboardStats(
            total_users=total_users,
            active_users=active_users,
            banned_users=banned_users,
            total_posts=total_posts,
            total_reports=total_reports,
            pending_reports=pending_reports,
            posts_today=posts_today,
            users_today=users_today
        )
        
    except Exception as e:
        print(f"Error getting dashboard stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dashboard statistics")

@app.get('/admin/users')
def get_admin_users(
    limit: int = 50, 
    skip: int = 0,
    search: Optional[str] = None,
    filter_type: Optional[str] = None,  # "all", "active", "banned", "muted"
    current_admin: dict = Depends(get_current_admin)
):
    """Get users list for admin with filters"""
    try:
        # Build query
        query = {}
        
        if search:
            query["$or"] = [
                {"username": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"full_name": {"$regex": search, "$options": "i"}},
                {"student_id": {"$regex": search, "$options": "i"}}
            ]
        
        if filter_type == "active":
            query["is_active"] = True
            query["is_banned"] = {"$ne": True}
        elif filter_type == "banned":
            query["is_banned"] = True
        elif filter_type == "muted":
            query["is_muted"] = True
        
        # Get users
        users_cursor = db["User"].find(query).skip(skip).limit(limit).sort("created_at", -1)
        users = []
        
        for user in users_cursor:
            # Count posts for this user
            posts_count = db["Post"].count_documents({"author": user["username"]})
            
            # Count reports against this user's posts
            user_posts = db["Post"].find({"author": user["username"]})
            post_ids = [str(post["_id"]) for post in user_posts]
            reports_count = db["PostReport"].count_documents({"post_id": {"$in": post_ids}})
            
            user_data = AdminUserResponse(
                username=user["username"],
                email=user["email"],
                full_name=user.get("full_name"),
                student_id=user.get("student_id"),
                is_active=user.get("is_active", False),
                is_banned=user.get("is_banned", False),
                ban_reason=user.get("ban_reason"),
                ban_until=user.get("ban_until"),
                is_muted=user.get("is_muted", False),
                mute_reason=user.get("mute_reason"),
                mute_until=user.get("mute_until"),
                created_at=user.get("created_at", get_vietnam_time_naive()),
                last_login=user.get("last_login"),
                posts_count=posts_count,
                reports_count=reports_count
            )
            users.append(user_data)
        
        return {
            "users": users,
            "total": db["User"].count_documents(query),
            "has_more": len(users) == limit
        }
        
    except Exception as e:
        print(f"Error getting admin users: {e}")
        raise HTTPException(status_code=500, detail="Failed to get users")

@app.post('/admin/users/{username}/ban')
def ban_user(
    username: str, 
    ban_data: UserBan,
    current_admin: dict = Depends(get_current_admin)
):
    """Ban a user"""
    try:
        user = db["User"].find_one({"username": username})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Calculate ban until date
        ban_until = None
        if ban_data.duration_days:
            ban_until = get_vietnam_time_naive() + timedelta(days=ban_data.duration_days)
        
        # Update user
        db["User"].update_one(
            {"username": username},
            {
                "$set": {
                    "is_banned": True,
                    "ban_reason": ban_data.reason,
                    "ban_until": ban_until,
                    "banned_at": get_vietnam_time_naive(),
                    "banned_by": current_admin["username"]
                }
            }
        )
        
        # Log action
        log_admin_action(
            current_admin["username"], 
            "ban_user", 
            "user", 
            username, 
            ban_data.reason
        )
        
        # Send notification to user
        create_notification(
            username,
            "system",
            "Tài khoản bị khóa",
            f"Tài khoản của bạn đã bị khóa. Lý do: {ban_data.reason}"
        )
        
        return {"message": "User banned successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error banning user: {e}")
        raise HTTPException(status_code=500, detail="Failed to ban user")

@app.post('/admin/users/{username}/unban')
def unban_user(username: str, current_admin: dict = Depends(get_current_admin)):
    """Unban a user"""
    try:
        user = db["User"].find_one({"username": username})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update user
        db["User"].update_one(
            {"username": username},
            {
                "$set": {
                    "is_banned": False,
                    "unbanned_at": get_vietnam_time_naive(),
                    "unbanned_by": current_admin["username"]
                },
                "$unset": {
                    "ban_reason": "",
                    "ban_until": ""
                }
            }
        )
        
        # Log action
        log_admin_action(current_admin["username"], "unban_user", "user", username)
        
        # Send notification to user
        create_notification(
            username,
            "system",
            "Tài khoản được khôi phục",
            "Tài khoản của bạn đã được khôi phục và có thể sử dụng bình thường."
        )
        
        return {"message": "User unbanned successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error unbanning user: {e}")
        raise HTTPException(status_code=500, detail="Failed to unban user")

@app.post('/admin/users/{username}/mute')
def mute_user(
    username: str, 
    mute_data: UserMute,
    current_admin: dict = Depends(get_current_admin)
):
    """Mute a user (restrict commenting)"""
    try:
        user = db["User"].find_one({"username": username})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Calculate mute until date
        mute_until = get_vietnam_time_naive() + timedelta(days=mute_data.duration_days)
        
        # Update user
        db["User"].update_one(
            {"username": username},
            {
                "$set": {
                    "is_muted": True,
                    "mute_reason": mute_data.reason,
                    "mute_until": mute_until,
                    "muted_at": get_vietnam_time_naive(),
                    "muted_by": current_admin["username"]
                }
            }
        )
        
        # Log action
        log_admin_action(
            current_admin["username"], 
            "mute_user", 
            "user", 
            username, 
            mute_data.reason
        )
        
        # Send notification to user
        create_notification(
            username,
            "system",
            "Bị hạn chế bình luận",
            f"Bạn bị hạn chế bình luận trong {mute_data.duration_days} ngày. Lý do: {mute_data.reason}"
        )
        
        return {"message": "User muted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error muting user: {e}")
        raise HTTPException(status_code=500, detail="Failed to mute user")

@app.get('/admin/posts')
def get_admin_posts(
    limit: int = 50,
    skip: int = 0,
    search: Optional[str] = None,
    category: Optional[str] = None,
    author: Optional[str] = None,
    has_reports: Optional[bool] = None,
    current_admin: dict = Depends(get_current_admin)
):
    """Get posts list for admin"""
    try:
        print(f"Admin posts request: limit={limit}, skip={skip}, search={search}, category={category}")
        print(f"Current admin: {current_admin}")
        
        # Test database connection
        if db is None:
            print("ERROR: Database connection is None")
            raise HTTPException(status_code=500, detail="Database connection failed")
        # Build query
        query = {}
        
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"content": {"$regex": search, "$options": "i"}}
            ]
        
        if category:
            query["category"] = category
            
        if author:
            query["author"] = author
        
        # Get posts
        print(f"Executing query: {query}")
        posts_cursor = db["Post"].find(query).skip(skip).limit(limit).sort("created_at", -1)
        posts = []
        
        print("Processing posts...")
        for post in posts_cursor:
            print(f"Processing post: {post.get('_id', 'NO_ID')}")
            # Bỏ qua post thiếu trường bắt buộc
            if "title" not in post or "content" not in post or "category" not in post or "author" not in post:
                print(f"Skip invalid post: {post}")
                continue
            reports_count = db["PostReport"].count_documents({"post_id": str(post["_id"])})
            try:
                author_info = db["User"].find_one({"username": post["author"]})
                print(f"Author info for {post['author']}: {author_info is not None}")
            except Exception as e:
                print(f"Error getting author info: {e}")
                author_info = None
            try:
                post_data = {
                    "id": str(post["_id"]),
                    "title": post["title"],
                    "content": post["content"],
                    "category": post["category"],
                    "author": post["author"],
                    "author_info": {
                        "full_name": author_info.get("full_name") if author_info else None,
                        "email": author_info.get("email") if author_info else None
                    },
                    "created_at": post["created_at"].isoformat() if post.get("created_at") else None,
                    "status": post.get("status", "active"),
                    "view_count": post.get("view_count", 0),
                    "reports_count": reports_count,
                    "image_urls": post.get("image_urls", []),
                    "location": post.get("location")
                }
                print(f"Created post_data successfully for {post['_id']}")
                posts.append(post_data)
            except Exception as e:
                print(f"Error creating post_data: {e}")
                print(f"Post data: {post}")
                raise e
        
        print(f"Successfully processed {len(posts)} posts")
        total_count = db["Post"].count_documents(query)
        print(f"Total posts in DB: {total_count}")
        
        return {
            "posts": posts,
            "total": total_count,
            "has_more": len(posts) == limit
        }
        
    except Exception as e:
        print(f"Error getting admin posts: {e}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to get posts: {str(e)}")

@app.delete('/admin/posts/{post_id}')
def admin_delete_post(
    post_id: str,
    reason: Optional[str] = None,
    current_admin: dict = Depends(get_current_admin)
):
    """Admin delete any post"""
    try:
        post = db["Post"].find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Delete post
        db["Post"].delete_one({"_id": ObjectId(post_id)})
        
        # Delete related comments
        db["Comment"].delete_many({"post_id": post_id})
        
        # Delete related reports
        db["PostReport"].delete_many({"post_id": post_id})
        
        # Log action
        log_admin_action(
            current_admin["username"], 
            "delete_post", 
            "post", 
            post_id, 
            reason or "Admin deletion"
        )
        
        # Send notification to post author
        create_notification(
            post["author"],
            "system",
            "Bài viết bị xóa",
            f"Bài viết '{post['title']}' của bạn đã bị xóa bởi quản trị viên. {f'Lý do: {reason}' if reason else ''}"
        )
        
        return {"message": "Post deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting post: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete post")

@app.get('/admin/reports')
def get_admin_reports(
    limit: int = 50,
    skip: int = 0,
    status_filter: Optional[str] = None,  # "pending", "reviewed", "resolved"
    current_admin: dict = Depends(get_current_admin)
):
    """Get reports list for admin"""
    try:
        # Build query
        query = {}
        if status_filter:
            query["status"] = status_filter
        
        # Get reports
        reports_cursor = db["PostReport"].find(query).skip(skip).limit(limit).sort("created_at", -1)
        reports = []
        
        for report in reports_cursor:
            # Get post info
            post = db["Post"].find_one({"_id": ObjectId(report["post_id"])})
            if not post:
                continue  # Skip if post was deleted
            
            # Get reporter info
            reporter_info = db["User"].find_one({"username": report["reporter"]})
            
            report_data = AdminReportResponse(
                id=str(report["_id"]),
                post_id=report["post_id"],
                post_title=post["title"],
                reporter=report["reporter"],
                reporter_info={
                    "full_name": reporter_info.get("full_name") if reporter_info else None,
                    "email": reporter_info.get("email") if reporter_info else None
                },
                reason=report["reason"],
                description=report.get("description"),
                created_at=report["created_at"],
                status=report["status"],
                reviewed_by=report.get("reviewed_by"),
                reviewed_at=report.get("reviewed_at"),
                action_taken=report.get("action_taken")
            )
            reports.append(report_data)
        
        return {
            "reports": reports,
            "total": db["PostReport"].count_documents(query),
            "has_more": len(reports) == limit
        }
        
    except Exception as e:
        print(f"Error getting admin reports: {e}")
        raise HTTPException(status_code=500, detail="Failed to get reports")

@app.post('/admin/reports/{report_id}/action')
def handle_report_action(
    report_id: str,
    action_data: ReportAction,
    current_admin: dict = Depends(get_current_admin)
):
    """Handle admin action on a report"""
    try:
        report = db["PostReport"].find_one({"_id": ObjectId(report_id)})
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Get post
        post = db["Post"].find_one({"_id": ObjectId(report["post_id"])})
        if not post and action_data.action != "ignore":
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Handle different actions
        if action_data.action == "delete_post":
            # Delete the post
            db["Post"].delete_one({"_id": ObjectId(report["post_id"])})
            db["Comment"].delete_many({"post_id": report["post_id"]})
            
            # Notify post author
            create_notification(
                post["author"],
                "system",
                "Bài viết bị xóa",
                f"Bài viết '{post['title']}' của bạn đã bị xóa do vi phạm quy định. {f'Lý do: {action_data.reason}' if action_data.reason else ''}"
            )
            
        elif action_data.action == "warn_user":
            # Send warning to post author
            create_notification(
                post["author"],
                "system",
                "Cảnh báo vi phạm",
                f"Bài viết '{post['title']}' của bạn đã được báo cáo và nhận cảnh báo. {f'Lý do: {action_data.reason}' if action_data.reason else ''}"
            )
        
        # Update report status
        db["PostReport"].update_one(
            {"_id": ObjectId(report_id)},
            {
                "$set": {
                    "status": "resolved",
                    "reviewed_by": current_admin["username"],
                    "reviewed_at": get_vietnam_time_naive(),
                    "action_taken": action_data.action,
                    "action_reason": action_data.reason
                }
            }
        )
        
        # Log action
        log_admin_action(
            current_admin["username"], 
            f"report_{action_data.action}", 
            "report", 
            report_id, 
            action_data.reason
        )
        
        return {"message": f"Report {action_data.action} successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error handling report action: {e}")
        raise HTTPException(status_code=500, detail="Failed to handle report action")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
