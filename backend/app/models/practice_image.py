"""Practice Image model."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class PracticeImage(Base):
    """Practice Image model - stores before/after images for best practices."""
    
    __tablename__ = "practice_images"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    practice_id = Column(UUID(as_uuid=True), ForeignKey("best_practices.id", ondelete="CASCADE"), nullable=False)
    image_type = Column(String, nullable=False)  # 'before' or 'after' - validated in Pydantic
    blob_container = Column(String, nullable=False)  # Azure container name
    blob_name = Column(String, nullable=False)  # Azure blob file name
    blob_url = Column(Text, nullable=False)  # Public/SAS URL
    file_size = Column(Integer, nullable=False)  # File size in bytes
    content_type = Column(String, nullable=False)  # MIME type
    uploaded_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    practice = relationship("BestPractice", back_populates="images")
    
    def __repr__(self):
        return f"<PracticeImage {self.image_type} for {self.practice_id}>"

