"""Notification Pydantic schemas."""

from typing import Optional, Literal
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


NotificationType = Literal['question_asked', 'question_answered', 'practice_benchmarked']


class NotificationCreate(BaseModel):
    """Schema for creating a notification."""
    user_id: UUID
    type: NotificationType
    title: str
    message: str
    related_practice_id: UUID
    related_question_id: Optional[UUID] = None


class NotificationResponse(BaseModel):
    """Notification response schema."""
    id: UUID
    user_id: UUID
    type: NotificationType
    title: str
    message: str
    related_practice_id: UUID
    related_question_id: Optional[UUID]
    practice_title: Optional[str] = None  # Populated from related practice
    is_read: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    """Paginated notification list response."""
    success: bool = True
    data: list[NotificationResponse]
    pagination: dict = Field(default_factory=dict)

