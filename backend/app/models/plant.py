"""Plant model."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Plant(Base):
    """Plant model - represents manufacturing plants."""
    
    __tablename__ = "plants"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)  # e.g., "Greater Noida (Ecotech 1)"
    short_name = Column(String, nullable=False)  # e.g., "Greater Noida"
    division = Column(String, nullable=False)  # e.g., "Component"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    users = relationship("User", back_populates="plant")
    best_practices = relationship("BestPractice", back_populates="plant")
    copied_practices = relationship("CopiedPractice", back_populates="copying_plant")
    monthly_savings = relationship("MonthlySavings", back_populates="plant")
    leaderboard_entries = relationship("LeaderboardEntry", back_populates="plant")
    
    def __repr__(self):
        return f"<Plant {self.name}>"

