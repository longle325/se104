from typing import Optional, List, Dict
import os
import re
import secrets
import random
import string
import smtplib
import json
import shutil
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
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
from oauth import get_current_user, create_access_token
from models import (
    User, UserRegistration, Login, Token, TokenData, EmailVerification, PasswordResetRequest, 
    VerificationCode, PasswordReset, UserProfile, Post, PostResponse, 
    DirectMessage, DirectMessageResponse, Conversation
)

# Load environment variables
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME", "your_email@gmail.com")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "your_app_password")

# Store verification codes temporarily (in production, use a database)
verification_codes = {}

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
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
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
    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = EMAIL_USERNAME
        message["To"] = to_email

        html_part = MIMEText(html_content, "html")
        message.attach(html_part)

        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
            server.sendmail(EMAIL_USERNAME, to_email, message.as_string())
        print(f"Email sent successfully to {to_email}")
    except Exception as e:
        print(f"Failed to send email: {e}")
        # In a production app, you might want to log this error or retry

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

@app.post('/register')
async def create_user(request: UserRegistration, background_tasks: BackgroundTasks):
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
        
    hashed_pass = Hash.bcrypt(request.password)
    user_object = {
        "username": username,
        "email": request.email,
        "phonenumber": request.phonenumber,
        "password": hashed_pass,
        "full_name": request.full_name,
        "created_at": datetime.utcnow(),
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
        <p>Hello {request.full_name or username},</p>
        <p>Please click the link below to verify your email address:</p>
        <p><a href="{verification_link}">Verify Email</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>Your username is: <strong>{username}</strong></p>
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
        "username": username
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
            "full_name": user.get("full_name")
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
        "expiry": datetime.utcnow() + timedelta(minutes=15)
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
    if datetime.utcnow() > stored_verification["expiry"]:
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
    if datetime.utcnow() > stored_verification["expiry"]:
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
    
    profile = db["UserProfile"].find_one({"username": username})
    if profile:
        profile["_id"] = str(profile["_id"])
        return profile
    else:
        # Return basic user info if no profile exists
        return {
            "username": user["username"],
            "email": user["email"],
            "created_at": user.get("created_at")
        }

@app.put("/profile/{username}")
def update_user_profile(username: str, profile_data: UserProfile, current_user: User = Depends(get_current_user)):
    if current_user.username != username:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only update your own profile")
    
    profile_dict = profile_data.dict(exclude_unset=True)
    profile_dict["updated_at"] = datetime.utcnow()
    
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
    for post in posts:
        post["id"] = str(post["_id"])
        del post["_id"]
    
    return posts

@app.post("/posts")
def create_post(post_data: Post, current_user: User = Depends(get_current_user)):
    post_dict = post_data.dict()
    post_dict["author"] = current_user.username
    post_dict["created_at"] = datetime.utcnow()
    
    result = db["Post"].insert_one(post_dict)
    post_dict["id"] = str(result.inserted_id)
    del post_dict["_id"]
    
    return post_dict

@app.get("/posts/{post_id}")
def get_post(post_id: str):
    try:
        post = db["Post"].find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        
        post["id"] = str(post["_id"])
        del post["_id"]
        return post
    except:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid post ID")

@app.put("/posts/{post_id}")
def update_post(post_id: str, post_data: Post, current_user: User = Depends(get_current_user)):
    try:
        post = db["Post"].find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        
        if post["author"] != current_user.username:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only edit your own posts")
        
        update_dict = post_data.dict(exclude_unset=True)
        update_dict["updated_at"] = datetime.utcnow()
        
        db["Post"].update_one({"_id": ObjectId(post_id)}, {"$set": update_dict})
        
        return {"message": "Post updated successfully"}
    except:
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
    
    for conv in conversations:
        conv["id"] = str(conv["_id"])
        del conv["_id"]
        
        # Get other participant info
        other_participant = [p for p in conv["participants"] if p != current_user.username][0]
        user_info = db["User"].find_one({"username": other_participant}, {"password": 0})
        conv["other_user"] = {
            "username": user_info["username"],
            "full_name": user_info.get("full_name"),
            "email": user_info["email"]
        }
        
    return conversations

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
    
    return messages[::-1]  # Return in chronological order

@app.post("/conversations/{other_username}/messages")
async def send_direct_message(other_username: str, message_data: DirectMessage, current_user: User = Depends(get_current_user)):
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
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = db["Conversation"].insert_one(conversation_data)
        conversation_id = str(result.inserted_id)
    else:
        conversation_id = str(conversation["_id"])
        # Update conversation timestamp
        db["Conversation"].update_one(
            {"_id": conversation["_id"]},
            {"$set": {"updated_at": datetime.utcnow()}}
        )
    
    # Create message
    message_dict = {
        "conversation_id": conversation_id,
        "from_user": current_user.username,
        "to_user": other_username,
        "content": message_data.content,
        "timestamp": datetime.utcnow(),
        "is_read": False
    }
    
    result = db["DirectMessage"].insert_one(message_dict)
    message_dict["id"] = str(result.inserted_id)
    del message_dict["_id"]
    
    # Send realtime notification to recipient if online
    await manager.broadcast_to_conversation({
        "type": "new_message",
        "message": message_dict
    }, participants)
    
    return message_dict

# WebSocket endpoint for realtime chat
@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    # Verify user authentication through query parameter
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing authentication token")
        return
    
    try:
        # Verify JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        token_username: str = payload.get("sub")
        if token_username != username:
            await websocket.close(code=4003, reason="Invalid token for user")
            return
    except JWTError:
        await websocket.close(code=4001, reason="Invalid authentication token")
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
                                    "created_at": datetime.utcnow(),
                                    "updated_at": datetime.utcnow()
                                }
                                result = db["Conversation"].insert_one(conversation_data)
                                conversation_id = str(result.inserted_id)
                            else:
                                conversation_id = str(conversation["_id"])
                                # Update conversation timestamp
                                db["Conversation"].update_one(
                                    {"_id": conversation["_id"]},
                                    {"$set": {"updated_at": datetime.utcnow()}}
                                )
                            
                            # Create message
                            message_dict = {
                                "conversation_id": conversation_id,
                                "from_user": username,
                                "to_user": other_username,
                                "content": content,
                                "timestamp": datetime.utcnow(),
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
    return {"online_users": list(manager.active_connections.keys())}

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

# Image upload endpoint for new posts
@app.post("/upload-images")
async def upload_images(files: List[UploadFile] = File(...), current_user: User = Depends(get_current_user)):
    try:
        uploaded_files = []
        timestamp = int(datetime.utcnow().timestamp())
        
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
