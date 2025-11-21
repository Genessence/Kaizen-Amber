"""User model."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    """User model - represents plant users and HQ admins."""
    
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'plant' or 'hq' - validated in Pydantic
    plant_id = Column(UUID(as_uuid=True), ForeignKey("plants.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    plant = relationship("Plant", back_populates="users", foreign_keys=[plant_id])
    submitted_practices = relationship("BestPractice", back_populates="submitted_by", foreign_keys="BestPractice.submitted_by_user_id")
    benchmarked_practices = relationship("BenchmarkedPractice", back_populates="benchmarked_by")
    asked_questions = relationship("PracticeQuestion", back_populates="asked_by", foreign_keys="PracticeQuestion.asked_by_user_id")
    answered_questions = relationship("PracticeQuestion", back_populates="answered_by", foreign_keys="PracticeQuestion.answered_by_user_id")
    notifications = relationship("Notification", back_populates="user", foreign_keys="Notification.user_id", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.email} ({self.role})>"

