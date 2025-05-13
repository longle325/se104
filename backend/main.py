from typing import Optional
import os
import re
import secrets
import random
import string
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Depends, Request, status, BackgroundTasks
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from pydantic import BaseModel

from db import db
from hashing import Hash
from oauth import get_current_user, create_access_token
from models import User, Login, Token, TokenData, EmailVerification, PasswordResetRequest, VerificationCode, PasswordReset

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

app = FastAPI()
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

# Check DB connection
@app.on_event("startup")
async def startup_db_client():
    if db is None:
        print("WARNING: No database connection established. Application may not function properly.")

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
async def create_user(request: User, background_tasks: BackgroundTasks):
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
        
    # Check if username already exists
    if db["User"].find_one({"username": request.username}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists. Please choose a different name."
        )
        
    # Check if email already exists
    if db["User"].find_one({"email": request.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists. Please use a different email address."
        )
        
    hashed_pass = Hash.bcrypt(request.password)
    user_object = dict(request)
    user_object["password"] = hashed_pass
    user_object["created_at"] = datetime.utcnow()
    user_object["is_active"] = False
    
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
        <h2>Welcome to our platform!</h2>
        <p>Please click the link below to verify your email address:</p>
        <p><a href="{verification_link}">Verify Email</a></p>
        <p>This link will expire in 24 hours.</p>
    </body>
    </html>
    """
    
    send_email(
        to_email=request.email,
        subject="Verify Your Email Address",
        html_content=email_content,
        background_tasks=background_tasks
    )
    
    return {"res": "User created successfully. Please check your email to verify your account."}

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
def login(request: OAuth2PasswordRequestForm = Depends()):
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
    return {"access_token": access_token, "token_type": "bearer"}

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
