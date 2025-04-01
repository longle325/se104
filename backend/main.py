from typing import Optional
from fastapi import FastAPI, HTTPException, Depends, Request,status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from hashing import Hash
import sys
from oauth import get_current_user
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from models import User,Login,Token,TokenData
from db import db
from datetime import datetime, timedelta
from jose import JWTError, jwt
# from main import TokenData


SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token:str,credentials_exception):
	try:
		payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
		username: str = payload.get("sub")
		if username is None:
			raise credentials_exception
		token_data = main.TokenData(username=username)
	except JWTError:
	    raise credentials_exception
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



@app.get("/")
def read_root(current_user:User = Depends(get_current_user)):
	return {"data":"Hello World"}

@app.post('/register')
def create_user(request:User):
    if not db["User"].find_one({"username":request.username}):
        hashed_pass = Hash.bcrypt(request.password)
        user_object = dict(request)
        user_object["password"] = hashed_pass
        user_id = db["User"].insert_one(user_object)
        # print(user)
        return {"res":"created user succesfully"}
    return {"res": "Username has already exits. Please choose a different name !"}

@app.post('/login')
def login(request:OAuth2PasswordRequestForm = Depends()):
	user = db["User"].find_one({"username":request.username})
	if not user:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail = f'No user found with this {request.username} username')
	if not Hash.verify(user["password"],request.password):
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail = f'Wrong Username or password')
	access_token = create_access_token(data={"sub": user["username"] })
	return {"access_token": access_token, "token_type": "bearer"}