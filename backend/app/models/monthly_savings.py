"""Monthly Savings model."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Numeric, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class MonthlySavings(Base):
    """Monthly Savings model - aggregated savings per plant per month."""
    
    __tablename__ = "monthly_savings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    plant_id = Column(UUID(as_uuid=True), ForeignKey("plants.id"), nullable=False, index=True)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)  # 1-12
    total_savings = Column(Numeric(12, 2), nullable=False, default=0)
    savings_currency = Column(String, nullable=False, default='lakhs')  # 'lakhs' or 'crores'
    practice_count = Column(Integer, nullable=False, default=0)
    stars = Column(Integer, nullable=False, default=0)  # 0-5
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    plant = relationship("Plant", back_populates="monthly_savings")
    
    # Constraints and Indexes
    __table_args__ = (
        UniqueConstraint('plant_id', 'year', 'month', name='uq_monthly_savings_plant_year_month'),
        Index('idx_monthly_savings_plant_year', 'plant_id', 'year', month.desc()),
    )
    
    def __repr__(self):
        return f"<MonthlySavings {self.plant_id} {self.year}-{self.month}>"

