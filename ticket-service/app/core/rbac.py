from functools import wraps
from fastapi import HTTPException, status


ROLE_HIERARCHY = {
    "admin": [
        "admin",
        "ciso",
        "infosec_manager",
        "security_analyst",
        "viewer",
    ],

    "ciso": [
        "ciso",
        "infosec_manager",
        "security_analyst",
        "viewer",
    ],

    "infosec_manager": [
        "infosec_manager",
        "security_analyst",
        "viewer",
    ],

    "security_analyst": [
        "security_analyst",
        "viewer",
    ],

    "viewer": [
        "viewer",
    ]
}


def check_role(user, required_roles):

    if not user:
        return False

    # Handle CurrentUser object OR dict
    user_role = getattr(user, "role", None)

    if not user_role and isinstance(user, dict):
        user_role = user.get("role")

    if not user_role:
        return False

    # Convert enum/string safely
    user_role = str(user_role)

    for required_role in required_roles:

        role_name = (
            required_role.value
            if hasattr(required_role, "value")
            else str(required_role)
        )

        allowed_roles = ROLE_HIERARCHY.get(role_name, [])

        if user_role in allowed_roles:
            return True

    return False


def require_roles(allowed_roles):

    def decorator(func):

        @wraps(func)
        async def wrapper(*args, **kwargs):

            current_user = kwargs.get("current_user")

            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )

            if not check_role(current_user, allowed_roles):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )

            result = func(*args, **kwargs)

            if hasattr(result, "__await__"):
                return await result

            return result

        return wrapper

    return decorator