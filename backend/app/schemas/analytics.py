"""Analytics Pydantic schemas."""

from typing import List, Optional, Literal
from decimal import Decimal
from datetime import date
from uuid import UUID
from pydantic import BaseModel


# Period types
PeriodType = Literal["yearly", "monthly"]
CurrencyFormat = Literal["lakhs", "crores"]


class DashboardOverview(BaseModel):
    """Dashboard overview statistics."""
    monthly_count: int
    ytd_count: int
    monthly_savings: Decimal
    ytd_savings: Decimal
    stars: int
    benchmarked_count: int
    currency: CurrencyFormat = "lakhs"


class PlantPerformance(BaseModel):
    """Plant performance statistics."""
    plant_id: UUID
    plant_name: str
    short_name: str
    submitted: int
    
    class Config:
        from_attributes = True


class CategoryBreakdown(BaseModel):
    """Category-wise breakdown."""
    category_id: UUID
    category_name: str
    category_slug: str
    practice_count: int
    color_class: str
    icon_name: str
    
    class Config:
        from_attributes = True


class PlantSavings(BaseModel):
    """Plant savings data."""
    plant_id: UUID
    plant_name: str
    short_name: str
    last_month: Decimal
    current_month: Decimal
    ytd_till_last_month: Decimal
    ytd_total: Decimal
    percent_change: float
    
    class Config:
        from_attributes = True


class MonthlySavingsBreakdown(BaseModel):
    """Monthly savings breakdown for a plant."""
    month: str  # Format: YYYY-MM
    total_savings: Decimal
    practice_count: int
    practices: List['PracticeSavingsDetail'] = []
    
    class Config:
        from_attributes = True


class PracticeSavingsDetail(BaseModel):
    """Practice savings detail."""
    practice_id: UUID
    title: str
    savings: Decimal
    benchmarked: bool
    submitted_date: date
    
    class Config:
        from_attributes = True


class StarRating(BaseModel):
    """Star rating for a plant."""
    plant_id: UUID
    plant_name: str
    monthly_savings: Decimal
    ytd_savings: Decimal
    stars: int
    currency: CurrencyFormat = "lakhs"
    
    class Config:
        from_attributes = True


class MonthlyTrend(BaseModel):
    """Monthly trend data."""
    month: str
    savings: Decimal
    stars: int
    
    class Config:
        from_attributes = True


class BenchmarkStats(BaseModel):
    """Benchmark statistics per plant."""
    plant_id: UUID
    plant_name: str
    benchmarked_count: int
    
    class Config:
        from_attributes = True


# Update forward references
MonthlySavingsBreakdown.model_rebuild()

