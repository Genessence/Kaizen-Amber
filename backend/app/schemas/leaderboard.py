"""Leaderboard Pydantic schemas."""

from typing import List, Literal, Optional
from datetime import date
from uuid import UUID
from pydantic import BaseModel


# Leaderboard entry type
EntryType = Literal["Origin", "Copier"]


class LeaderboardBreakdownEntry(BaseModel):
    """Single breakdown entry."""
    type: EntryType
    points: int
    date: date
    bp_title: str
    bp_id: Optional[UUID] = None
    
    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    """Leaderboard entry with breakdown."""
    plant_id: UUID
    plant_name: str
    total_points: int
    origin_points: int
    copier_points: int
    rank: int
    breakdown: List[LeaderboardBreakdownEntry] = []
    
    class Config:
        from_attributes = True


class CopiedBPDetail(BaseModel):
    """Detail of a copied BP."""
    bp_title: str
    bp_id: UUID
    points: int
    date: date
    
    class Config:
        from_attributes = True


class OriginatedBPDetail(BaseModel):
    """Detail of an originated (benchmarked) BP."""
    bp_title: str
    bp_id: UUID
    copies_count: int
    points: int
    
    class Config:
        from_attributes = True


class PlantLeaderboardBreakdown(BaseModel):
    """Detailed breakdown for a plant."""
    plant_id: UUID
    plant_name: str
    copied: List[CopiedBPDetail] = []
    copiedCount: int
    copiedPoints: int
    originated: List[OriginatedBPDetail] = []
    originatedCount: int
    originatedPoints: int
    
    class Config:
        from_attributes = True

