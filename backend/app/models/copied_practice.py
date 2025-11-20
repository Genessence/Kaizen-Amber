"""Copied Practice model."""

import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, Date, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class CopiedPractice(Base):
    """Copied Practice model - tracks when practices are copied between plants."""
    
    __tablename__ = "copied_practices"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    original_practice_id = Column(UUID(as_uuid=True), ForeignKey("best_practices.id"), nullable=False)
    copied_practice_id = Column(UUID(as_uuid=True), ForeignKey("best_practices.id"), nullable=False)
    copying_plant_id = Column(UUID(as_uuid=True), ForeignKey("plants.id"), nullable=False)
    copied_date = Column(Date, nullable=False)
    implementation_status = Column(String, nullable=False, default='planning')  # 'planning', 'in_progress', 'completed'
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    original_practice = relationship("BestPractice", back_populates="copied_as_original", foreign_keys=[original_practice_id])
    copied_practice = relationship("BestPractice", back_populates="copied_as_copy", foreign_keys=[copied_practice_id])
    copying_plant = relationship("Plant", back_populates="copied_practices")
    
    # Indexes
    __table_args__ = (
        Index('idx_copied_practices_original_plant', 'original_practice_id', 'copying_plant_id'),
    )
    
    def __repr__(self):
        return f"<CopiedPractice {self.original_practice_id} -> {self.copying_plant_id}>"

