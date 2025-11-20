"""Category Pydantic schemas."""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class CategoryBase(BaseModel):
    """Base category schema."""
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=100)
    color_class: str = Field(..., min_length=1, max_length=100)
    icon_name: str = Field(..., min_length=1, max_length=50)


class CategoryCreate(CategoryBase):
    """Schema for creating a category."""
    pass


class CategoryUpdate(BaseModel):
    """Schema for updating a category."""
    name: str = Field(None, min_length=1, max_length=100)
    slug: str = Field(None, min_length=1, max_length=100)
    color_class: str = Field(None, min_length=1, max_length=100)
    icon_name: str = Field(None, min_length=1, max_length=50)


class CategoryInDB(CategoryBase):
    """Category schema from database."""
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class CategoryResponse(CategoryInDB):
    """Category response schema."""
    pass


class CategoryWithCount(CategoryResponse):
    """Category with best practice count."""
    practice_count: int = 0
    
    class Config:
        from_attributes = True

