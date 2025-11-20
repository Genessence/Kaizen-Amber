"""Category model."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Category(Base):
    """Category model - represents best practice categories."""
    
    __tablename__ = "categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)  # Safety, Quality, Productivity, Cost, etc.
    slug = Column(String, unique=True, nullable=False, index=True)
    color_class = Column(String, nullable=False)  # UI color styling
    icon_name = Column(String, nullable=False)  # Lucide icon name
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    best_practices = relationship("BestPractice", back_populates="category")
    
    def __repr__(self):
        return f"<Category {self.name}>"

