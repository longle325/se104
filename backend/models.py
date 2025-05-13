from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class User(BaseModel):
    username: str
    email: str
    phonenumber: str
    password: str
    is_active: Optional[bool] = False

class Login(BaseModel):
    username: str
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