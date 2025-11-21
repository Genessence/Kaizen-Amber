"""Notification model."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Notification(Base):
    """Notification model - represents user notifications."""
    
    __tablename__ = "notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False)  # 'question_asked' or 'practice_benchmarked'
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    related_practice_id = Column(UUID(as_uuid=True), ForeignKey("best_practices.id", ondelete="CASCADE"), nullable=False)
    related_question_id = Column(UUID(as_uuid=True), ForeignKey("practice_questions.id", ondelete="CASCADE"), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="notifications", foreign_keys=[user_id])
    practice = relationship("BestPractice", foreign_keys=[related_practice_id])
    question = relationship("PracticeQuestion", foreign_keys=[related_question_id])
    
    # Indexes
    __table_args__ = (
        Index('idx_notifications_user_read', 'user_id', 'is_read'),
        Index('idx_notifications_user_created', 'user_id', created_at.desc()),
    )
    
    def __repr__(self):
        return f"<Notification {self.type} for user {self.user_id}>"

