"""Leaderboard endpoints."""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.plant import Plant
from app.models.best_practice import BestPractice
from app.models.benchmarked_practice import BenchmarkedPractice
from app.models.copied_practice import CopiedPractice
from app.models.leaderboard_entry import LeaderboardEntry
from app.schemas.leaderboard import (
    LeaderboardEntry as LeaderboardEntrySchema,
    PlantLeaderboardBreakdown,
    LeaderboardBreakdownEntry,
    CopiedBPDetail,
    OriginatedBPDetail
)
from app.core.dependencies import get_current_active_user, require_hq_admin
from app.services.leaderboard_service import LeaderboardService
from app.utils.date_helpers import get_current_year

router = APIRouter()


@router.get("/current", response_model=List[LeaderboardEntrySchema])
async def get_current_leaderboard(
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current year leaderboard.
    
    Returns all plants ranked by total points.
    """
    if year is None:
        year = get_current_year()
    
    # Get leaderboard entries for the year
    entries = db.query(LeaderboardEntry).filter(
        LeaderboardEntry.year == year
    ).order_by(LeaderboardEntry.total_points.desc()).all()
    
    # Build response with breakdown
    result = []
    current_rank = 1
    previous_points = None
    
    for idx, entry in enumerate(entries):
        # Calculate rank (same points = same rank)
        if previous_points is not None and entry.total_points < previous_points:
            current_rank = idx + 1
        
        plant = db.query(Plant).filter(Plant.id == entry.plant_id).first()
        
        # Get breakdown details
        breakdown = await _get_entry_breakdown(entry.plant_id, year, db)
        
        result.append({
            "plant_id": entry.plant_id,
            "plant_name": plant.name if plant else "Unknown",
            "total_points": entry.total_points,
            "origin_points": entry.origin_points,
            "copier_points": entry.copier_points,
            "rank": current_rank,
            "breakdown": breakdown
        })
        
        previous_points = entry.total_points
    
    return result


@router.get("/{plant_id}/breakdown", response_model=PlantLeaderboardBreakdown)
async def get_plant_breakdown(
    plant_id: UUID,
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get detailed leaderboard breakdown for a specific plant.
    
    Shows:
    - BPs copied by this plant (with points and dates)
    - Benchmarked BPs originated by this plant (with copy counts and points)
    """
    if year is None:
        year = get_current_year()
    
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plant not found"
        )
    
    # Get copied practices (as copier)
    copied_practices = db.query(CopiedPractice).filter(
        CopiedPractice.copying_plant_id == plant_id
    ).all()
    
    copied_details = []
    copier_points_total = 0
    for copy in copied_practices:
        original = db.query(BestPractice).filter(BestPractice.id == copy.original_practice_id).first()
        if original:
            copied_details.append({
                "bp_title": original.title,
                "bp_id": original.id,
                "points": 5,  # Copier gets 5 points
                "date": copy.copied_date
            })
            copier_points_total += 5
    
    # Get originated benchmarked practices
    originated_practices = db.query(BestPractice).join(
        BenchmarkedPractice, BenchmarkedPractice.practice_id == BestPractice.id
    ).filter(
        BestPractice.plant_id == plant_id,
        BestPractice.is_deleted == False
    ).all()
    
    originated_details = []
    origin_points_total = 0
    for practice in originated_practices:
        # Count copies
        copy_count = db.query(func.count(CopiedPractice.id)).filter(
            CopiedPractice.original_practice_id == practice.id
        ).scalar() or 0
        
        # Origin gets 10 points if copied at least once
        points = 10 if copy_count > 0 else 0
        
        originated_details.append({
            "bp_title": practice.title,
            "bp_id": practice.id,
            "copies_count": copy_count,
            "points": points
        })
        
        if copy_count > 0:
            origin_points_total += 10
    
    return {
        "plant_id": plant_id,
        "plant_name": plant.name,
        "copied": copied_details,
        "copiedCount": len(copied_details),
        "copiedPoints": copier_points_total,
        "originated": originated_details,
        "originatedCount": len(originated_details),
        "originatedPoints": origin_points_total
    }


@router.post("/recalculate", status_code=status.HTTP_200_OK)
async def recalculate_leaderboard(
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hq_admin)
):
    """
    Recalculate leaderboard from scratch (HQ only).
    
    This ensures data integrity by recalculating all points.
    """
    if year is None:
        year = get_current_year()
    
    leaderboard_service = LeaderboardService(db)
    result = await leaderboard_service.recalculate_leaderboard(year)
    
    return result


async def _get_entry_breakdown(plant_id: UUID, year: int, db: Session) -> List[dict]:
    """
    Get breakdown entries for leaderboard.
    
    Internal helper function.
    """
    breakdown = []
    
    # Get copied practices (Copier entries)
    copied = db.query(CopiedPractice).filter(
        CopiedPractice.copying_plant_id == plant_id
    ).all()
    
    for copy in copied:
        original = db.query(BestPractice).filter(BestPractice.id == copy.original_practice_id).first()
        if original:
            breakdown.append({
                "type": "Copier",
                "points": 5,
                "date": copy.copied_date,
                "bp_title": original.title,
                "bp_id": original.id
            })
    
    # Get originated benchmarked practices (Origin entries)
    originated = db.query(BestPractice).join(
        BenchmarkedPractice, BenchmarkedPractice.practice_id == BestPractice.id
    ).filter(
        BestPractice.plant_id == plant_id,
        BestPractice.is_deleted == False
    ).all()
    
    for practice in originated:
        # Check if it has been copied
        copy_count = db.query(func.count(CopiedPractice.id)).filter(
            CopiedPractice.original_practice_id == practice.id
        ).scalar() or 0
        
        # Only add to breakdown if it was copied (earned points)
        if copy_count > 0:
            benchmarked_record = db.query(BenchmarkedPractice).filter(
                BenchmarkedPractice.practice_id == practice.id
            ).first()
            
            breakdown.append({
                "type": "Origin",
                "points": 10,
                "date": benchmarked_record.benchmarked_date if benchmarked_record else practice.submitted_date,
                "bp_title": practice.title,
                "bp_id": practice.id
            })
    
    # Sort by date descending
    breakdown.sort(key=lambda x: x['date'], reverse=True)
    
    return breakdown

