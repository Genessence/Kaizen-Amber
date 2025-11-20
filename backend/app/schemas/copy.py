"""Copy & Implement Pydantic schemas."""

from typing import Optional, Literal
from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel, Field


# Implementation status type
ImplementationStatus = Literal["planning", "in_progress", "completed"]


class CopyImplementRequest(BaseModel):
    """Request to copy and implement a benchmarked practice."""
    original_practice_id: UUID
    customized_title: Optional[str] = Field(None, min_length=1, max_length=500)
    customized_solution: Optional[str] = Field(None, min_length=1)
    implementation_status: ImplementationStatus = "planning"


class CopiedPracticeResponse(BaseModel):
    """Copied practice response."""
    id: UUID
    original_practice_id: UUID
    copied_practice_id: UUID
    copying_plant_id: UUID
    copied_date: date
    implementation_status: ImplementationStatus
    created_at: datetime
    
    class Config:
        from_attributes = True


class CopyImplementResponse(BaseModel):
    """Response after copying a practice."""
    copied_practice: 'BestPracticeResponse'  # Forward reference
    copy_record: CopiedPracticeResponse
    points_awarded: dict
    
    class Config:
        from_attributes = True


# Import at the end to avoid circular imports
from app.schemas.best_practice import BestPracticeResponse
CopyImplementResponse.model_rebuild()

