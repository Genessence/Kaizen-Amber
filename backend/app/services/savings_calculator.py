"""Savings calculator service for star ratings and aggregations."""

from decimal import Decimal
from typing import Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.best_practice import BestPractice
from app.models.monthly_savings import MonthlySavings
from app.utils.date_helpers import get_month_date_range, get_ytd_date_range


class SavingsCalculatorService:
    """Service for calculating savings and star ratings."""
    
    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.db = db
    
    def calculate_stars(self, monthly_savings: Decimal, ytd_savings: Decimal) -> int:
        """
        Calculate star rating based on savings thresholds.
        
        Both monthly and YTD thresholds must be met for a band.
        All values assumed to be in Lakhs (L).
        
        Star Bands:
        - 5 stars: YTD > 200L AND Monthly > 16L
        - 4 stars: YTD 150-200L AND Monthly 12-16L
        - 3 stars: YTD 100-150L AND Monthly 8-12L
        - 2 stars: YTD 50-100L AND Monthly 4-8L
        - 1 star: YTD > 50L AND Monthly > 4L
        - 0 stars: Below thresholds
        
        Args:
            monthly_savings: Monthly savings in lakhs
            ytd_savings: YTD savings in lakhs
        
        Returns:
            int: Star rating (0-5)
        """
        if monthly_savings is None:
            monthly_savings = Decimal('0')
        if ytd_savings is None:
            ytd_savings = Decimal('0')
        
        # 5 stars
        if ytd_savings > 200 and monthly_savings > 16:
            return 5
        
        # 4 stars
        if 150 <= ytd_savings <= 200 and 12 <= monthly_savings <= 16:
            return 4
        
        # 3 stars
        if 100 <= ytd_savings <= 150 and 8 <= monthly_savings <= 12:
            return 3
        
        # 2 stars
        if 50 <= ytd_savings <= 100 and 4 <= monthly_savings <= 8:
            return 2
        
        # 1 star
        if ytd_savings > 50 and monthly_savings > 4:
            return 1
        
        # 0 stars
        return 0
    
    async def aggregate_monthly_savings(self, plant_id: str, year: int, month: int) -> dict:
        """
        Aggregate and calculate monthly savings for a plant.
        
        Steps:
        1. Sum all savings from approved BPs submitted in that month
        2. Count number of BPs
        3. Calculate YTD savings
        4. Calculate stars based on monthly and YTD
        5. Upsert into monthly_savings table
        
        Args:
            plant_id: Plant ID (UUID as string)
            year: Year
            month: Month (1-12)
        
        Returns:
            dict: Aggregated savings data
        """
        # Get date range for the month
        start_date, end_date = get_month_date_range(year, month)
        
        # Sum savings for the month (only approved practices)
        monthly_result = self.db.query(
            func.sum(BestPractice.savings_amount),
            func.count(BestPractice.id)
        ).filter(
            BestPractice.plant_id == plant_id,
            BestPractice.is_deleted == False,
            BestPractice.status == 'approved',
            BestPractice.submitted_date.between(start_date, end_date),
            BestPractice.savings_currency == 'lakhs'  # Normalize to lakhs
        ).first()
        
        monthly_savings = monthly_result[0] or Decimal('0')
        practice_count = monthly_result[1] or 0
        
        # Calculate YTD savings
        ytd_start, ytd_end = get_ytd_date_range(year)
        ytd_result = self.db.query(
            func.sum(BestPractice.savings_amount)
        ).filter(
            BestPractice.plant_id == plant_id,
            BestPractice.is_deleted == False,
            BestPractice.status == 'approved',
            BestPractice.submitted_date.between(ytd_start, ytd_end),
            BestPractice.savings_currency == 'lakhs'
        ).scalar() or Decimal('0')
        
        # Calculate stars
        stars = self.calculate_stars(monthly_savings, ytd_result)
        
        # Upsert monthly_savings record
        existing = self.db.query(MonthlySavings).filter(
            MonthlySavings.plant_id == plant_id,
            MonthlySavings.year == year,
            MonthlySavings.month == month
        ).first()
        
        if existing:
            existing.total_savings = monthly_savings
            existing.practice_count = practice_count
            existing.stars = stars
        else:
            new_record = MonthlySavings(
                plant_id=plant_id,
                year=year,
                month=month,
                total_savings=monthly_savings,
                savings_currency='lakhs',
                practice_count=practice_count,
                stars=stars
            )
            self.db.add(new_record)
        
        self.db.commit()
        
        return {
            "plant_id": plant_id,
            "year": year,
            "month": month,
            "monthly_savings": float(monthly_savings),
            "ytd_savings": float(ytd_result),
            "practice_count": practice_count,
            "stars": stars
        }
    
    async def recalculate_all_monthly_savings(self, year: int) -> dict:
        """
        Recalculate monthly savings for all plants for a given year.
        
        Args:
            year: Year to recalculate
        
        Returns:
            dict: Summary of recalculation
        """
        from app.models.plant import Plant
        
        # Get all plants
        plants = self.db.query(Plant).filter(Plant.is_active == True).all()
        
        # Get months to process (1 to current month for current year, or all 12 for past years)
        from app.utils.date_helpers import get_current_year, get_current_month
        current_year = get_current_year()
        
        if year < current_year:
            months = range(1, 13)
        elif year == current_year:
            months = range(1, get_current_month() + 1)
        else:
            return {"success": False, "message": "Cannot calculate for future years"}
        
        total_processed = 0
        
        for plant in plants:
            for month in months:
                await self.aggregate_monthly_savings(str(plant.id), year, month)
                total_processed += 1
        
        return {
            "success": True,
            "data": {
                "year": year,
                "plants_processed": len(plants),
                "months_processed": len(list(months)),
                "total_records": total_processed
            }
        }

