
from fastapi import APIRouter, Depends, HTTPException, status, Response
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError, jwt
from typing import Optional
from app.db.session import get_db
from app.db.models.user import User
from app.db.models import Base
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings

class Credentials(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: str
    email: EmailStr

router = APIRouter()

COOKIE_NAME = "refurbd_token"

@router.post("/register", response_model=TokenOut)
async def register(data: Credentials, response: Response, db: AsyncSession = Depends(get_db)):
    # check existing
    res = await db.execute(select(User).where(User.email == data.email.lower()))
    if res.scalar_one_or_none() is not None:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=data.email.lower(), password_hash=hash_password(data.password))
    db.add(user)
    await db.commit()
    token = create_access_token(str(user.id))
    _set_cookie(response, token)
    return TokenOut(access_token=token)

@router.post("/login", response_model=TokenOut)
async def login(data: Credentials, response: Response, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.email == data.email.lower()))
    user = res.scalar_one_or_none()
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(str(user.id))
    _set_cookie(response, token)
    return TokenOut(access_token=token)

def _set_cookie(response: Response, token: str):
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.JWT_EXPIRES_MIN * 60,
        path="/",
    )

def _decode_token(token: str) -> Optional[str]:
    try:
        payload = jwt.get_unverified_claims(token)
        return payload.get("sub")
    except Exception:
        return None

@router.get("/me", response_model=UserOut)
async def me(token: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    # token through cookie preferred
    user_id = None
    if token:
        user_id = _decode_token(token)
    user = None
    if user_id:
        res = await db.execute(select(User).where(User.id == user_id))
        user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorised")
    return UserOut(id=str(user.id), email=user.email)
