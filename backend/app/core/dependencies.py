"""FastAPI dependencies for authentication and authorization."""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import verify_token
from app.models.user import User

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from JWT token.
    
    Args:
        token: JWT access token
        db: Database session
    
    Returns:
        User: Current authenticated user
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = verify_token(token, token_type="access")
        if payload is None:
            raise credentials_exception
        
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get the current active user (must be active).
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        User: Current active user
    
    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return current_user


async def require_hq_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Require HQ admin role.
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        User: Current user (if HQ admin)
    
    Raises:
        HTTPException: If user is not HQ admin
    """
    if current_user.role != "hq":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HQ admin privileges required"
        )
    
    return current_user


async def require_plant_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Require plant user role.
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        User: Current user (if plant user)
    
    Raises:
        HTTPException: If user is not plant user or has no plant assigned
    """
    if current_user.role != "plant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Plant user privileges required"
        )
    
    if current_user.plant_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has no plant assigned"
        )
    
    return current_user


def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get current user if authenticated, otherwise return None.
    Used for endpoints that work with or without authentication.
    
    Args:
        token: Optional JWT access token
        db: Database session
    
    Returns:
        User or None: Current user if authenticated, None otherwise
    """
    if token is None:
        return None
    
    try:
        payload = verify_token(token, token_type="access")
        if payload is None:
            return None
        
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        
        user = db.query(User).filter(User.id == user_id).first()
        return user
    
    except JWTError:
        return None

