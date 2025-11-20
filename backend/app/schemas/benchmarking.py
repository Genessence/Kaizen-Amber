"""Benchmarking Pydantic schemas."""

from datetime import datetime, date
from typing import List
from uuid import UUID
from pydantic import BaseModel


class BenchmarkCreate(BaseModel):
    """Schema for benchmarking a practice."""
    practice_id: UUID


class BenchmarkResponse(BaseModel):
    """Benchmarked practice response."""
    id: UUID
    practice_id: UUID
    benchmarked_by_user_id: UUID
    benchmarked_date: date
    created_at: datetime
    
    class Config:
        from_attributes = True


class BenchmarkedPracticeListItem(BaseModel):
    """Benchmarked practice list item with practice details."""
    id: UUID
    practice_id: UUID
    practice_title: str
    practice_category: str
    plant_name: str
    benchmarked_date: date
    copy_count: int = 0
    
    class Config:
        from_attributes = True


class CopySpreadItem(BaseModel):
    """Copy spread item for horizontal deployment status."""
    bp_id: UUID
    bp_title: str
    origin_plant_id: UUID
    origin_plant_name: str
    copy_count: int
    copies: List['CopyDetail'] = []
    
    class Config:
        from_attributes = True


class CopyDetail(BaseModel):
    """Detail of a single copy."""
    plant_id: UUID
    plant_name: str
    copied_date: date
    
    class Config:
        from_attributes = True

