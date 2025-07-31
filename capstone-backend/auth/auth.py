from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt import PyJWTError, encode, decode
from datetime import datetime, timedelta
from database.db import get_db
from database.models import User
from sqlalchemy.orm import Session
from passlib.context import CryptContext

# Configuration
SECRET_KEY = "your-secret-key"  # Replace with a strong, random key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/admin/admin/token")  # Matches frontend

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")  # Extract role
        if username is None or role is None:
            raise credentials_exception
        expire = payload.get("exp")
        if expire and datetime.utcnow() > datetime.utcfromtimestamp(expire):
            raise credentials_exception
    except PyJWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None or user.role != role:  # Ensure role matches
        raise credentials_exception
    return user

def get_current_user_role(current_user: User = Depends(get_current_user)):
    if not current_user.role:
        raise HTTPException(status_code=400, detail="User role not set")
    return current_user.role

