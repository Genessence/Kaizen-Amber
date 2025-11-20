"""Plant Pydantic schemas."""

from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class PlantBase(BaseModel):
    """Base plant schema."""
    name: str = Field(..., min_length=1, max_length=255)
    short_name: str = Field(..., min_length=1, max_length=100)
    division: str = Field(..., min_length=1, max_length=100)


class PlantCreate(PlantBase):
    """Schema for creating a plant."""
    is_active: bool = True


class PlantUpdate(BaseModel):
    """Schema for updating a plant."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    short_name: Optional[str] = Field(None, min_length=1, max_length=100)
    division: Optional[str] = Field(None, min_length=1, max_length=100)
    is_active: Optional[bool] = None


class PlantInDB(PlantBase):
    """Plant schema from database."""
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PlantResponse(PlantInDB):
    """Plant response schema."""
    pass


class PlantWithStats(PlantResponse):
    """Plant with statistics."""
    total_practices: int = 0
    total_savings: float = 0.0
    benchmarked_count: int = 0
    monthly_practices: int = 0
    
    class Config:
        from_attributes = True

