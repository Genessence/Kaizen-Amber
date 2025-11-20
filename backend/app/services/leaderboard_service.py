"""Leaderboard calculation service."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.best_practice import BestPractice
from app.models.benchmarked_practice import BenchmarkedPractice
from app.models.copied_practice import CopiedPractice
from app.models.leaderboard_entry import LeaderboardEntry
from app.utils.date_helpers import get_current_year


class LeaderboardService:
    """Service for leaderboard calculations and updates."""
    
    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.db = db
    
    async def update_on_copy(self, original_practice_id: UUID, copying_plant_id: UUID) -> dict:
        """
        Update leaderboard when a practice is copied.
        
        Awards:
        - Origin plant: +10 points (only if this is the first copy)
        - Copying plant: +5 points
        
        Args:
            original_practice_id: ID of original benchmarked practice
            copying_plant_id: ID of plant doing the copying
        
        Returns:
            dict: Points awarded {origin_points, copier_points}
        """
        # Get original practice to find origin plant
        original_practice = self.db.query(BestPractice).filter(
            BestPractice.id == original_practice_id
        ).first()
        
        if not original_practice:
            return {"origin_points": 0, "copier_points": 0}
        
        origin_plant_id = original_practice.plant_id
        year = get_current_year()
        
        # Check if this is the first copy (for origin points)
        previous_copies = self.db.query(func.count(CopiedPractice.id)).filter(
            CopiedPractice.original_practice_id == original_practice_id
        ).scalar() or 0
        
        is_first_copy = previous_copies == 0
        
        # Award origin points (10 points) if first copy
        origin_points = 0
        if is_first_copy:
            origin_entry = self._get_or_create_leaderboard_entry(origin_plant_id, year)
            origin_entry.origin_points += 10
            origin_entry.total_points += 10
            origin_points = 10
        
        # Award copier points (5 points)
        copier_entry = self._get_or_create_leaderboard_entry(copying_plant_id, year)
        copier_entry.copier_points += 5
        copier_entry.total_points += 5
        copier_points = 5
        
        self.db.commit()
        
        return {
            "origin_points": origin_points,
            "copier_points": copier_points,
            "origin_plant_id": origin_plant_id,
            "copying_plant_id": copying_plant_id
        }
    
    async def recalculate_leaderboard(self, year: int) -> dict:
        """
        Recalculate entire leaderboard from scratch for a given year.
        
        This is used for data integrity and can be run periodically.
        
        Args:
            year: Year to recalculate
        
        Returns:
            dict: Summary of recalculation
        """
        # Clear existing leaderboard for the year
        self.db.query(LeaderboardEntry).filter(
            LeaderboardEntry.year == year
        ).delete()
        
        # Get all benchmarked practices
        benchmarked_practices = self.db.query(BenchmarkedPractice).join(
            BestPractice, BenchmarkedPractice.practice_id == BestPractice.id
        ).all()
        
        origin_points_awarded = 0
        copier_points_awarded = 0
        
        for bp in benchmarked_practices:
            practice = self.db.query(BestPractice).filter(
                BestPractice.id == bp.practice_id
            ).first()
            
            if not practice:
                continue
            
            origin_plant_id = practice.plant_id
            
            # Get all copies of this practice
            copies = self.db.query(CopiedPractice).filter(
                CopiedPractice.original_practice_id == bp.practice_id
            ).all()
            
            # Award origin points if there's at least one copy
            if len(copies) > 0:
                origin_entry = self._get_or_create_leaderboard_entry(origin_plant_id, year)
                origin_entry.origin_points += 10
                origin_entry.total_points += 10
                origin_points_awarded += 10
            
            # Award copier points for each copy
            for copy in copies:
                copier_entry = self._get_or_create_leaderboard_entry(copy.copying_plant_id, year)
                copier_entry.copier_points += 5
                copier_entry.total_points += 5
                copier_points_awarded += 5
        
        self.db.commit()
        
        # Get total entries
        total_entries = self.db.query(func.count(LeaderboardEntry.id)).filter(
            LeaderboardEntry.year == year
        ).scalar() or 0
        
        return {
            "success": True,
            "data": {
                "year": year,
                "total_entries": total_entries,
                "origin_points_awarded": origin_points_awarded,
                "copier_points_awarded": copier_points_awarded,
                "total_points": origin_points_awarded + copier_points_awarded
            }
        }
    
    def _get_or_create_leaderboard_entry(self, plant_id: UUID, year: int) -> LeaderboardEntry:
        """
        Get or create leaderboard entry for a plant and year.
        
        Args:
            plant_id: Plant ID
            year: Year
        
        Returns:
            LeaderboardEntry: Existing or new entry
        """
        entry = self.db.query(LeaderboardEntry).filter(
            LeaderboardEntry.plant_id == plant_id,
            LeaderboardEntry.year == year
        ).first()
        
        if not entry:
            entry = LeaderboardEntry(
                plant_id=plant_id,
                year=year,
                total_points=0,
                origin_points=0,
                copier_points=0
            )
            self.db.add(entry)
            self.db.flush()  # Flush to get ID without committing
        
        return entry

