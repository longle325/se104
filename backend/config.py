import os
from typing import Optional
from pydantic import BaseModel
from dotenv import load_dotenv
import pytz

# Load environment variables
load_dotenv()

class Settings(BaseModel):
    # JWT Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "525600"))  # 365 days
    
    # Email Settings
    EMAIL_HOST: str = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    EMAIL_PORT: int = int(os.getenv("EMAIL_PORT", "587"))
    EMAIL_USERNAME: str = os.getenv("EMAIL_USERNAME", "your_email@gmail.com")
    EMAIL_PASSWORD: str = os.getenv("EMAIL_PASSWORD", "your_app_password")
    
    # Database Settings
    MONGODB_URL: str = os.getenv("MONGO_URI")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "uit_lost_found")
    
    # CORS Settings
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3050", 
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "https://se104-frontend.vercel.app"
    ]
    
    # File Upload Settings
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 5 * 1024 * 1024  # 5MB
    ALLOWED_EXTENSIONS: set = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    
    # Timezone
    TIMEZONE: str = "Asia/Ho_Chi_Minh"
    
    # Admin Settings
    ADMIN_CREDENTIALS: dict = {
        "admin12": "123456"  # In production, use hashed passwords
    }
    
    # Post Settings
    DEFAULT_POST_STATUS: dict = {
        "lost": "not_found",
        "found": "not_returned"
    }

# Global settings instance
settings = Settings()

# Timezone instance
VN_TIMEZONE = pytz.timezone(settings.TIMEZONE) 