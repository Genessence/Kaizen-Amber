"""Best Practice model."""

import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Text, Boolean, DateTime, Date, ForeignKey, Numeric, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database import Base


class BestPractice(Base):
    """Best Practice model - represents submitted best practices."""
    
    __tablename__ = "best_practices"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False)
    submitted_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    plant_id = Column(UUID(as_uuid=True), ForeignKey("plants.id"), nullable=False)
    problem_statement = Column(Text, nullable=False)
    solution = Column(Text, nullable=False)
    benefits = Column(JSONB, nullable=True)  # Array of strings
    metrics = Column(Text, nullable=True)
    implementation = Column(Text, nullable=True)
    investment = Column(Text, nullable=True)
    savings_amount = Column(Numeric(12, 2), nullable=True)
    savings_currency = Column(String, nullable=True)  # 'lakhs' or 'crores' - validated in Pydantic
    savings_period = Column(String, nullable=True)  # 'monthly' or 'annually' - validated in Pydantic
    area_implemented = Column(String, nullable=True)
    status = Column(String, nullable=False, default='draft')  # 'draft', 'submitted', 'approved', 'revision_required'
    submitted_date = Column(Date, nullable=True, index=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    category = relationship("Category", back_populates="best_practices")
    submitted_by = relationship("User", back_populates="submitted_practices", foreign_keys=[submitted_by_user_id])
    plant = relationship("Plant", back_populates="best_practices")
    images = relationship("PracticeImage", back_populates="practice", cascade="all, delete-orphan")
    documents = relationship("PracticeDocument", back_populates="practice", cascade="all, delete-orphan")
    benchmarked_practice = relationship("BenchmarkedPractice", back_populates="practice", uselist=False)
    copied_as_original = relationship("CopiedPractice", back_populates="original_practice", foreign_keys="CopiedPractice.original_practice_id")
    copied_as_copy = relationship("CopiedPractice", back_populates="copied_practice", foreign_keys="CopiedPractice.copied_practice_id")
    questions = relationship("PracticeQuestion", back_populates="practice", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_best_practices_plant_date', 'plant_id', submitted_date.desc()),
        Index('idx_best_practices_category', 'category_id'),
        Index('idx_best_practices_status', 'status', postgresql_where=(is_deleted == False)),
    )
    
    def __repr__(self):
        return f"<BestPractice {self.title}>"

