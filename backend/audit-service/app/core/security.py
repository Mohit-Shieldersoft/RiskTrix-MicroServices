"""Security utilities for JWT validation."""
from typing import Optional
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from app.core.config import settings

# HTTP Bearer scheme for token extraction
security = HTTPBearer()


class SecurityManager:
    """Handles JWT token validation."""
    
    @staticmethod
    def verify_token(token: str) -> dict:
        """
        Verify and decode JWT token.
        
        Note: This service validates tokens but does NOT create them.
        Tokens are created by the auth service/monolith.
        """
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
            return payload
        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Could not validate credentials: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    @staticmethod
    def get_user_id_from_token(token: str) -> int:
        """Extract user ID from token."""
        payload = SecurityManager.verify_token(token)
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
            )
        return user_id
    
    @staticmethod
    def get_user_email_from_token(token: str) -> str:
        """Extract user email from token."""
        payload = SecurityManager.verify_token(token)
        email: str = payload.get("email")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing email",
            )
        return email


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Dependency to get current user from JWT token.
    
    Returns the decoded token payload containing user information.
    """
    token = credentials.credentials
    return SecurityManager.verify_token(token)


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> int:
    """
    Dependency to get current user ID from JWT token.
    
    Returns just the user ID for convenience.
    """
    token = credentials.credentials
    return SecurityManager.get_user_id_from_token(token)


# Export commonly used dependencies
__all__ = ["SecurityManager", "get_current_user", "get_current_user_id"]
