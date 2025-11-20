"""User Pydantic schemas."""

from typing import Optional, Literal
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator


# User role type
UserRole = Literal["plant", "hq"]


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    role: UserRole


class UserCreate(UserBase):
    """Schema for creating a user."""
    password: str = Field(..., min_length=8, max_length=100)
    plant_id: Optional[UUID] = None
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    plant_id: Optional[UUID] = None
    is_active: Optional[bool] = None


class UserChangePassword(BaseModel):
    """Schema for changing password."""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        """Validate new password strength."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class UserInDB(UserBase):
    """User schema from database."""
    id: UUID
    plant_id: Optional[UUID]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserResponse(UserInDB):
    """User response schema (without sensitive data)."""
    pass


class UserWithPlant(UserResponse):
    """User response with plant information."""
    plant_name: Optional[str] = None
    plant_short_name: Optional[str] = None
    
    class Config:
        from_attributes = True

