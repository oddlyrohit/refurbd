
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGO = "HS256"

def create_access_token(sub: str, minutes: int = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=minutes or settings.JWT_EXPIRES_MIN)
    to_encode = {"sub": sub, "exp": expire}
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=ALGO)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)
