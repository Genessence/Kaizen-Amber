"""Leaderboard Entry model."""

import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class LeaderboardEntry(Base):
    """Leaderboard Entry model - tracks points for each plant per year."""
    
    __tablename__ = "leaderboard_entries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    plant_id = Column(UUID(as_uuid=True), ForeignKey("plants.id"), nullable=False, index=True)
    year = Column(Integer, nullable=False)
    total_points = Column(Integer, nullable=False, default=0)
    origin_points = Column(Integer, nullable=False, default=0)
    copier_points = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    plant = relationship("Plant", back_populates="leaderboard_entries")
    
    # Constraints and Indexes
    __table_args__ = (
        UniqueConstraint('plant_id', 'year', name='uq_leaderboard_plant_year'),
        Index('idx_leaderboard_year_points', 'year', total_points.desc()),
    )
    
    def __repr__(self):
        return f"<LeaderboardEntry {self.plant_id} {self.year}: {self.total_points} pts>"

