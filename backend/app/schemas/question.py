"""Question & Answer Pydantic schemas."""

from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class QuestionCreate(BaseModel):
    """Schema for creating a question."""
    question_text: str = Field(..., min_length=1)


class QuestionAnswer(BaseModel):
    """Schema for answering a question."""
    answer_text: str = Field(..., min_length=1)


class QuestionResponse(BaseModel):
    """Question response schema."""
    id: UUID
    practice_id: UUID
    asked_by_user_id: UUID
    asked_by_name: str
    question_text: str
    answer_text: Optional[str]
    answered_by_user_id: Optional[UUID]
    answered_by_name: Optional[str]
    answered_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class QuestionWithPractice(QuestionResponse):
    """Question with practice information."""
    practice_title: str
    practice_plant: str
    
    class Config:
        from_attributes = True

