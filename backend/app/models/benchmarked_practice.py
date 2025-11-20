"""Benchmarked Practice model."""

import uuid
from datetime import datetime, date
from sqlalchemy import Column, DateTime, Date, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class BenchmarkedPractice(Base):
    """Benchmarked Practice model - tracks which practices are benchmarked."""
    
    __tablename__ = "benchmarked_practices"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    practice_id = Column(UUID(as_uuid=True), ForeignKey("best_practices.id"), unique=True, nullable=False, index=True)
    benchmarked_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    benchmarked_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    practice = relationship("BestPractice", back_populates="benchmarked_practice")
    benchmarked_by = relationship("User", back_populates="benchmarked_practices")
    
    # Indexes
    __table_args__ = (
        Index('idx_benchmarked_practices_date', benchmarked_date.desc()),
    )
    
    def __repr__(self):
        return f"<BenchmarkedPractice {self.practice_id}>"

