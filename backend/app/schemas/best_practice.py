"""Best Practice Pydantic schemas."""

from typing import Optional, List, Literal
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


# Type literals for validation (no enums in database)
SavingsCurrency = Literal["lakhs", "crores"]
SavingsPeriod = Literal["monthly", "annually"]
PracticeStatus = Literal["draft", "submitted", "approved", "revision_required"]
ImageType = Literal["before", "after"]


class BestPracticeBase(BaseModel):
    """Base best practice schema."""
    title: str = Field(..., min_length=1, max_length=500)
    description: str = Field(..., min_length=1)
    problem_statement: str = Field(..., min_length=1)
    solution: str = Field(..., min_length=1)
    benefits: Optional[List[str]] = None
    metrics: Optional[str] = None
    implementation: Optional[str] = None
    investment: Optional[str] = None
    savings_amount: Optional[Decimal] = Field(None, ge=0)
    savings_currency: Optional[SavingsCurrency] = "lakhs"
    savings_period: Optional[SavingsPeriod] = "annually"
    area_implemented: Optional[str] = None


class BestPracticeCreate(BestPracticeBase):
    """Schema for creating a best practice."""
    category_id: UUID
    plant_id: Optional[UUID] = None  # Will default to user's plant if not provided
    status: PracticeStatus = "draft"
    submitted_date: Optional[date] = None


class BestPracticeUpdate(BaseModel):
    """Schema for updating a best practice."""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, min_length=1)
    category_id: Optional[UUID] = None
    problem_statement: Optional[str] = Field(None, min_length=1)
    solution: Optional[str] = Field(None, min_length=1)
    benefits: Optional[List[str]] = None
    metrics: Optional[str] = None
    implementation: Optional[str] = None
    investment: Optional[str] = None
    savings_amount: Optional[Decimal] = Field(None, ge=0)
    savings_currency: Optional[SavingsCurrency] = None
    savings_period: Optional[SavingsPeriod] = None
    area_implemented: Optional[str] = None
    status: Optional[PracticeStatus] = None


class PracticeImageBase(BaseModel):
    """Base schema for practice images."""
    image_type: ImageType
    blob_container: str
    blob_name: str
    blob_url: str
    file_size: int
    content_type: str


class PracticeImageCreate(PracticeImageBase):
    """Schema for creating a practice image."""
    practice_id: UUID


class PracticeImageResponse(PracticeImageBase):
    """Practice image response."""
    id: UUID
    practice_id: UUID
    uploaded_at: datetime
    
    class Config:
        from_attributes = True


class PracticeDocumentBase(BaseModel):
    """Base schema for practice documents."""
    document_name: str
    blob_container: str
    blob_name: str
    blob_url: str
    file_size: int
    content_type: str


class PracticeDocumentCreate(PracticeDocumentBase):
    """Schema for creating a practice document."""
    practice_id: UUID


class PracticeDocumentResponse(PracticeDocumentBase):
    """Practice document response."""
    id: UUID
    practice_id: UUID
    uploaded_at: datetime
    
    class Config:
        from_attributes = True


class BestPracticeInDB(BestPracticeBase):
    """Best practice schema from database."""
    id: UUID
    category_id: UUID
    submitted_by_user_id: UUID
    plant_id: UUID
    status: PracticeStatus
    submitted_date: Optional[date]
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class BestPracticeResponse(BestPracticeInDB):
    """Best practice response schema."""
    category_name: Optional[str] = None
    plant_name: Optional[str] = None
    submitted_by_name: Optional[str] = None
    is_benchmarked: bool = False
    question_count: int = 0
    copy_count: int = 0
    images: List[PracticeImageResponse] = []
    documents: List[PracticeDocumentResponse] = []
    
    class Config:
        from_attributes = True


class BestPracticeListItem(BaseModel):
    """Best practice list item (minimal data for lists)."""
    id: UUID
    title: str
    description: str
    category_id: UUID
    category_name: str
    plant_id: UUID
    plant_name: str
    submitted_by_name: str
    submitted_date: Optional[date]
    status: PracticeStatus
    savings_amount: Optional[Decimal]
    savings_currency: Optional[SavingsCurrency]
    is_benchmarked: bool = False
    question_count: int = 0
    has_images: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True


class PresignedUrlRequest(BaseModel):
    """Request for presigned URL."""
    practice_id: UUID
    file_type: Literal["image", "document"]
    image_type: Optional[ImageType] = None  # Required if file_type is 'image'
    filename: str
    content_type: str
    file_size: int
    
    @field_validator('image_type')
    @classmethod
    def validate_image_type(cls, v, info):
        """Validate image_type is provided for images."""
        if info.data.get('file_type') == 'image' and v is None:
            raise ValueError('image_type is required for image uploads')
        return v


class PresignedUrlResponse(BaseModel):
    """Response with presigned URL."""
    upload_url: str
    blob_name: str
    container: str
    expiry: datetime

