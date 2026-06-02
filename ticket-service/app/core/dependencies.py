from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.schemas.auth import CurrentUser

security = HTTPBearer()

SECRET_KEY = "risktrix-shared-secret-key-2024-do-not-change"
ALGORITHM = "HS256"


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        print("DECODED TOKEN:", payload)

        role = payload.get("role")

        if not role:
            roles = payload.get("roles", [])
            role = roles[0] if roles else None

        if not payload.get("sub") or not payload.get("email") or not role:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )

        return CurrentUser(
            id=payload.get("sub"),
            email=payload.get("email"),
            role=role,
        )

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )