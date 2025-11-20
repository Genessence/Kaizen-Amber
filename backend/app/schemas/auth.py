"""Authentication Pydantic schemas."""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Login request schema."""
    email: EmailStr
    password: str
    remember_me: bool = False


class TokenResponse(BaseModel):
    """Token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class TokenRefresh(BaseModel):
    """Token refresh request."""
    refresh_token: str


class AccessTokenResponse(BaseModel):
    """Access token response."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int

