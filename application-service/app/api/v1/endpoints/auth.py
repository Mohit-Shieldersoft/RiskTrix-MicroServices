"""Auth endpoints for Application Service.

Provides /login and /refresh so the frontend can authenticate
without the monolith running. Uses the shared users table and
the same JWT secret, making tokens interchangeable with the monolith.
"""
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_session
from app.models.models import User
from app.core.security import security_manager

router = APIRouter()


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class RefreshRequest(BaseModel):
    refresh_token: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _user_profile(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "profile_type": user.profile_type,
        "privilege_level": user.privilege_level,
        "clearance_level": user.clearance_level,
        "company": user.company,
        "phone": user.phone,
        "department": user.department,
        "is_active": user.is_active,
    }


def _make_tokens(user: User) -> dict:
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "roles": [user.role],
    }
    access_token = security_manager.create_access_token(token_data)
    refresh_token = security_manager.create_refresh_token(token_data)
    return {"access_token": access_token, "refresh_token": refresh_token}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_session)):
    """Authenticate with email/username + password, return JWT tokens + user profile."""
    if not payload.email and not payload.username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either email or username must be provided",
        )

    # Look up the user
    user: Optional[User] = None
    if payload.email:
        result = await db.execute(select(User).where(User.email == payload.email))
        user = result.scalar_one_or_none()
    if user is None and payload.username:
        result = await db.execute(select(User).where(User.username == payload.username))
        user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not security_manager.verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Update last_login
    user.last_login = datetime.now(timezone.utc)
    await db.commit()

    tokens = _make_tokens(user)
    return {**tokens, "user": _user_profile(user)}


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_session)):
    """Exchange a valid refresh token for a new access + refresh token pair."""
    try:
        token_payload = security_manager.verify_token(body.refresh_token)
    except HTTPException:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    if token_payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    user_email = token_payload.get("email")
    result = await db.execute(select(User).where(User.email == user_email))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    tokens = _make_tokens(user)
    return {**tokens, "user": _user_profile(user)}


@router.post("/logout")
async def logout():
    """Logout endpoint — client should discard tokens."""
    return {"message": "Logged out successfully"}
