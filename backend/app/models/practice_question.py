"""Practice Question model."""

import uuid
from datetime import datetime
from sqlalchemy import Column, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class PracticeQuestion(Base):
    """Practice Question model - Q&A for best practices."""
    
    __tablename__ = "practice_questions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    practice_id = Column(UUID(as_uuid=True), ForeignKey("best_practices.id", ondelete="CASCADE"), nullable=False)
    asked_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    answer_text = Column(Text, nullable=True)
    answered_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    answered_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    practice = relationship("BestPractice", back_populates="questions")
    asked_by = relationship("User", back_populates="asked_questions", foreign_keys=[asked_by_user_id])
    answered_by = relationship("User", back_populates="answered_questions", foreign_keys=[answered_by_user_id])
    
    # Indexes
    __table_args__ = (
        Index('idx_practice_questions_practice', 'practice_id', created_at.desc()),
    )
    
    def __repr__(self):
        return f"<PracticeQuestion for {self.practice_id}>"

