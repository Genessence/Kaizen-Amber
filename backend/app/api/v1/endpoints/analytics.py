"""Analytics endpoints."""

from typing import List, Optional, Literal
from decimal import Decimal
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract

from app.database import get_db
from app.models.user import User
from app.models.plant import Plant
from app.models.category import Category
from app.models.best_practice import BestPractice
from app.models.benchmarked_practice import BenchmarkedPractice
from app.models.monthly_savings import MonthlySavings
from app.models.practice_image import PracticeImage
from app.schemas.analytics import (
    DashboardOverview,
    PlantPerformance,
    CategoryBreakdown,
    PlantSavings,
    MonthlySavingsBreakdown,
    PracticeSavingsDetail,
    StarRating,
    MonthlyTrend,
    BenchmarkStats,
    PeriodType,
    CurrencyFormat
)
from app.core.dependencies import get_current_active_user, require_hq_admin
from app.services.savings_calculator import SavingsCalculatorService
from app.utils.date_helpers import (
    get_current_year,
    get_current_month,
    get_month_date_range,
    get_ytd_date_range,
    get_months_in_year
)

router = APIRouter()


@router.get("/overview", response_model=DashboardOverview)
async def get_overview(
    currency: CurrencyFormat = Query("lakhs"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get dashboard overview statistics.
    
    For Plant Users: only their plant
    For HQ Admin: company-wide
    """
    year = get_current_year()
    month = get_current_month()
    
    # Determine plant filter
    plant_filter = []
    if current_user.role == "plant":
        plant_filter.append(BestPractice.plant_id == current_user.plant_id)
    
    # Monthly count
    start_date, end_date = get_month_date_range(year, month)
    monthly_count = db.query(func.count(BestPractice.id)).filter(
        BestPractice.is_deleted == False,
        BestPractice.submitted_date.between(start_date, end_date),
        *plant_filter
    ).scalar() or 0
    
    # YTD count
    ytd_start, ytd_end = get_ytd_date_range(year)
    ytd_count = db.query(func.count(BestPractice.id)).filter(
        BestPractice.is_deleted == False,
        BestPractice.submitted_date.between(ytd_start, ytd_end),
        *plant_filter
    ).scalar() or 0
    
    # Monthly savings (in lakhs)
    monthly_savings_result = db.query(func.sum(BestPractice.savings_amount)).filter(
        BestPractice.is_deleted == False,
        BestPractice.status == 'approved',
        BestPractice.submitted_date.between(start_date, end_date),
        BestPractice.savings_currency == 'lakhs',
        *plant_filter
    ).scalar() or Decimal('0')
    
    # YTD savings
    ytd_savings_result = db.query(func.sum(BestPractice.savings_amount)).filter(
        BestPractice.is_deleted == False,
        BestPractice.status == 'approved',
        BestPractice.submitted_date.between(ytd_start, ytd_end),
        BestPractice.savings_currency == 'lakhs',
        *plant_filter
    ).scalar() or Decimal('0')
    
    # Calculate stars
    calc_service = SavingsCalculatorService(db)
    stars = calc_service.calculate_stars(monthly_savings_result, ytd_savings_result)
    
    # Benchmarked count
    benchmarked_query = db.query(func.count(BenchmarkedPractice.id)).join(
        BestPractice, BenchmarkedPractice.practice_id == BestPractice.id
    )
    if plant_filter:
        benchmarked_query = benchmarked_query.filter(*plant_filter)
    benchmarked_count = benchmarked_query.scalar() or 0
    
    return {
        "monthly_count": monthly_count,
        "ytd_count": ytd_count,
        "monthly_savings": monthly_savings_result,
        "ytd_savings": ytd_savings_result,
        "stars": stars,
        "benchmarked_count": benchmarked_count,
        "currency": currency
    }


@router.get("/plant-performance", response_model=List[PlantPerformance])
async def get_plant_performance(
    period: PeriodType = Query("yearly"),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get plant-wise performance (BP submissions).
    
    Query params:
    - period: 'yearly' or 'monthly'
    - year: Year (defaults to current)
    - month: Month (required if period is 'monthly')
    """
    if year is None:
        year = get_current_year()
    
    # Get all plants
    plants = db.query(Plant).filter(Plant.is_active == True).order_by(Plant.name).all()
    
    result = []
    
    for plant in plants:
        if period == "monthly":
            if month is None:
                month = get_current_month()
            
            start_date, end_date = get_month_date_range(year, month)
            submitted = db.query(func.count(BestPractice.id)).filter(
                BestPractice.plant_id == plant.id,
                BestPractice.is_deleted == False,
                BestPractice.submitted_date.between(start_date, end_date)
            ).scalar() or 0
        else:  # yearly
            ytd_start, ytd_end = get_ytd_date_range(year)
            submitted = db.query(func.count(BestPractice.id)).filter(
                BestPractice.plant_id == plant.id,
                BestPractice.is_deleted == False,
                BestPractice.submitted_date.between(ytd_start, ytd_end)
            ).scalar() or 0
        
        result.append({
            "plant_id": plant.id,
            "plant_name": plant.name,
            "short_name": plant.short_name,
            "submitted": submitted
        })
    
    return result


@router.get("/category-breakdown", response_model=List[CategoryBreakdown])
async def get_category_breakdown(
    plant_id: Optional[UUID] = Query(None),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get category-wise breakdown of best practices.
    
    Query params:
    - plant_id: Filter by plant (optional)
    - year: Filter by year (optional)
    """
    # Get all categories
    categories = db.query(Category).order_by(Category.name).all()
    
    result = []
    
    for category in categories:
        # Build filter
        filters = [
            BestPractice.category_id == category.id,
            BestPractice.is_deleted == False
        ]
        
        if plant_id:
            filters.append(BestPractice.plant_id == plant_id)
        
        if year:
            ytd_start, ytd_end = get_ytd_date_range(year)
            filters.append(BestPractice.submitted_date.between(ytd_start, ytd_end))
        
        # Count practices
        count = db.query(func.count(BestPractice.id)).filter(*filters).scalar() or 0
        
        result.append({
            "category_id": category.id,
            "category_name": category.name,
            "category_slug": category.slug,
            "practice_count": count,
            "color_class": category.color_class,
            "icon_name": category.icon_name
        })
    
    return result


@router.get("/cost-savings", response_model=dict)
async def get_cost_savings(
    period: PeriodType = Query("yearly"),
    currency: CurrencyFormat = Query("lakhs"),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get cost savings by plant.
    
    Query params:
    - period: 'yearly' or 'monthly'
    - currency: 'lakhs' or 'crores'
    - year: Year (defaults to current)
    - month: Month (required if period is 'monthly')
    """
    if year is None:
        year = get_current_year()
    
    plants = db.query(Plant).filter(Plant.is_active == True).order_by(Plant.name).all()
    
    result = []
    
    for plant in plants:
        if period == "monthly":
            if month is None:
                month = get_current_month()
            
            start_date, end_date = get_month_date_range(year, month)
            savings = db.query(func.sum(BestPractice.savings_amount)).filter(
                BestPractice.plant_id == plant.id,
                BestPractice.is_deleted == False,
                BestPractice.status == 'approved',
                BestPractice.submitted_date.between(start_date, end_date),
                BestPractice.savings_currency == 'lakhs'
            ).scalar() or Decimal('0')
        else:  # yearly
            ytd_start, ytd_end = get_ytd_date_range(year)
            savings = db.query(func.sum(BestPractice.savings_amount)).filter(
                BestPractice.plant_id == plant.id,
                BestPractice.is_deleted == False,
                BestPractice.status == 'approved',
                BestPractice.submitted_date.between(ytd_start, ytd_end),
                BestPractice.savings_currency == 'lakhs'
            ).scalar() or Decimal('0')
        
        # Convert to crores if needed
        from app.utils.currency import convert_to_crores, truncate_decimal
        if currency == "crores":
            savings = convert_to_crores(savings)
            savings = truncate_decimal(savings, 2)
        else:
            savings = truncate_decimal(savings, 2 if savings < 100 else 1)
        
        result.append({
            "plant_id": plant.id,
            "plant_name": plant.name,
            "short_name": plant.short_name,
            "savings": float(savings)
        })
    
    return {
        "success": True,
        "data": result,
        "period": period,
        "currency": currency
    }


@router.get("/cost-analysis", response_model=dict)
async def get_cost_analysis(
    currency: CurrencyFormat = Query("lakhs"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get detailed cost analysis with current month, last month, and YTD breakdowns.
    """
    year = get_current_year()
    month = get_current_month()
    
    # Get last month
    last_month = month - 1 if month > 1 else 12
    last_year = year if month > 1 else year - 1
    
    plants = db.query(Plant).filter(Plant.is_active == True).order_by(Plant.name).all()
    
    result = []
    
    for plant in plants:
        # Current month
        start, end = get_month_date_range(year, month)
        current_month_savings = db.query(func.sum(BestPractice.savings_amount)).filter(
            BestPractice.plant_id == plant.id,
            BestPractice.is_deleted == False,
            BestPractice.status == 'approved',
            BestPractice.submitted_date.between(start, end),
            BestPractice.savings_currency == 'lakhs'
        ).scalar() or Decimal('0')
        
        # Last month
        last_start, last_end = get_month_date_range(last_year, last_month)
        last_month_savings = db.query(func.sum(BestPractice.savings_amount)).filter(
            BestPractice.plant_id == plant.id,
            BestPractice.is_deleted == False,
            BestPractice.status == 'approved',
            BestPractice.submitted_date.between(last_start, last_end),
            BestPractice.savings_currency == 'lakhs'
        ).scalar() or Decimal('0')
        
        # YTD till last month
        ytd_start = get_ytd_date_range(year)[0]
        ytd_till_last = db.query(func.sum(BestPractice.savings_amount)).filter(
            BestPractice.plant_id == plant.id,
            BestPractice.is_deleted == False,
            BestPractice.status == 'approved',
            BestPractice.submitted_date.between(ytd_start, last_end),
            BestPractice.savings_currency == 'lakhs'
        ).scalar() or Decimal('0')
        
        # YTD total
        ytd_end = get_ytd_date_range(year)[1]
        ytd_total = db.query(func.sum(BestPractice.savings_amount)).filter(
            BestPractice.plant_id == plant.id,
            BestPractice.is_deleted == False,
            BestPractice.status == 'approved',
            BestPractice.submitted_date.between(ytd_start, ytd_end),
            BestPractice.savings_currency == 'lakhs'
        ).scalar() or Decimal('0')
        
        # Calculate percent change
        if last_month_savings > 0:
            percent_change = ((current_month_savings - last_month_savings) / last_month_savings) * 100
        else:
            percent_change = 0.0
        
        result.append({
            "plant_id": plant.id,
            "plant_name": plant.name,
            "short_name": plant.short_name,
            "last_month": last_month_savings,
            "current_month": current_month_savings,
            "ytd_till_last_month": ytd_till_last,
            "ytd_total": ytd_total,
            "percent_change": float(percent_change)
        })
    
    return {
        "success": True,
        "data": result,
        "currency": currency
    }


@router.get("/cost-analysis/{plant_id}/monthly", response_model=List[MonthlySavingsBreakdown])
async def get_plant_monthly_breakdown(
    plant_id: UUID,
    year: Optional[int] = Query(None),
    currency: CurrencyFormat = Query("lakhs"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get monthly cost breakdown for a specific plant.
    
    Returns breakdown of practices and savings for each month.
    """
    if year is None:
        year = get_current_year()
    
    # Verify plant exists
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plant not found"
        )
    
    # Get all months in the year
    months = get_months_in_year(year)
    
    result = []
    
    for y, m in months:
        start_date, end_date = get_month_date_range(y, m)
        
        # Get practices for this month
        practices = db.query(BestPractice).filter(
            BestPractice.plant_id == plant_id,
            BestPractice.is_deleted == False,
            BestPractice.status == 'approved',
            BestPractice.submitted_date.between(start_date, end_date)
        ).all()
        
        total_savings = Decimal('0')
        practice_details = []
        
        for practice in practices:
            savings_amount = practice.savings_amount or Decimal('0')
            
            # Convert to lakhs if needed
            if practice.savings_currency == 'crores':
                savings_amount = savings_amount * Decimal('100')
            
            total_savings += savings_amount
            
            # Check if benchmarked
            is_benchmarked = db.query(BenchmarkedPractice).filter(
                BenchmarkedPractice.practice_id == practice.id
            ).first() is not None
            
            practice_details.append({
                "practice_id": practice.id,
                "title": practice.title,
                "savings": savings_amount,
                "benchmarked": is_benchmarked,
                "submitted_date": practice.submitted_date
            })
        
        result.append({
            "month": f"{y}-{m:02d}",
            "total_savings": total_savings,
            "practice_count": len(practices),
            "practices": practice_details
        })
    
    return result


@router.get("/star-ratings", response_model=List[StarRating])
async def get_star_ratings(
    currency: CurrencyFormat = Query("lakhs"),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get star ratings for all plants based on savings.
    """
    if year is None:
        year = get_current_year()
    
    month = get_current_month()
    
    plants = db.query(Plant).filter(Plant.is_active == True).order_by(Plant.name).all()
    
    calc_service = SavingsCalculatorService(db)
    result = []
    
    for plant in plants:
        # Monthly savings
        start, end = get_month_date_range(year, month)
        monthly_savings = db.query(func.sum(BestPractice.savings_amount)).filter(
            BestPractice.plant_id == plant.id,
            BestPractice.is_deleted == False,
            BestPractice.status == 'approved',
            BestPractice.submitted_date.between(start, end),
            BestPractice.savings_currency == 'lakhs'
        ).scalar() or Decimal('0')
        
        # YTD savings
        ytd_start, ytd_end = get_ytd_date_range(year)
        ytd_savings = db.query(func.sum(BestPractice.savings_amount)).filter(
            BestPractice.plant_id == plant.id,
            BestPractice.is_deleted == False,
            BestPractice.status == 'approved',
            BestPractice.submitted_date.between(ytd_start, ytd_end),
            BestPractice.savings_currency == 'lakhs'
        ).scalar() or Decimal('0')
        
        # Calculate stars
        stars = calc_service.calculate_stars(monthly_savings, ytd_savings)
        
        result.append({
            "plant_id": plant.id,
            "plant_name": plant.name,
            "monthly_savings": monthly_savings,
            "ytd_savings": ytd_savings,
            "stars": stars,
            "currency": currency
        })
    
    return result


@router.get("/star-ratings/{plant_id}/monthly-trend", response_model=List[MonthlyTrend])
async def get_plant_monthly_trend(
    plant_id: UUID,
    year: Optional[int] = Query(None),
    currency: CurrencyFormat = Query("lakhs"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get monthly savings and stars trend for a plant (12 months).
    """
    if year is None:
        year = get_current_year()
    
    # Verify plant exists
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plant not found"
        )
    
    calc_service = SavingsCalculatorService(db)
    result = []
    
    # Generate data for all 12 months
    for month_num in range(1, 13):
        start, end = get_month_date_range(year, month_num)
        
        # Monthly savings
        monthly_savings = db.query(func.sum(BestPractice.savings_amount)).filter(
            BestPractice.plant_id == plant_id,
            BestPractice.is_deleted == False,
            BestPractice.status == 'approved',
            BestPractice.submitted_date.between(start, end),
            BestPractice.savings_currency == 'lakhs'
        ).scalar() or Decimal('0')
        
        # YTD savings (up to this month)
        ytd_start = get_ytd_date_range(year)[0]
        ytd_savings = db.query(func.sum(BestPractice.savings_amount)).filter(
            BestPractice.plant_id == plant_id,
            BestPractice.is_deleted == False,
            BestPractice.status == 'approved',
            BestPractice.submitted_date.between(ytd_start, end),
            BestPractice.savings_currency == 'lakhs'
        ).scalar() or Decimal('0')
        
        # Calculate stars
        stars = calc_service.calculate_stars(monthly_savings, ytd_savings)
        
        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        
        result.append({
            "month": month_names[month_num - 1],
            "savings": monthly_savings,
            "stars": stars
        })
    
    return result


@router.get("/benchmark-stats", response_model=List[BenchmarkStats])
async def get_benchmark_stats(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get benchmarked BPs count per plant for current month.
    """
    if year is None:
        year = get_current_year()
    if month is None:
        month = get_current_month()
    
    start_date, end_date = get_month_date_range(year, month)
    
    plants = db.query(Plant).filter(Plant.is_active == True).order_by(Plant.name).all()
    
    result = []
    
    for plant in plants:
        # Count benchmarked practices from this plant in the specified month
        count = db.query(func.count(BenchmarkedPractice.id)).join(
            BestPractice, BenchmarkedPractice.practice_id == BestPractice.id
        ).filter(
            BestPractice.plant_id == plant.id,
            BestPractice.is_deleted == False,
            BenchmarkedPractice.benchmarked_date.between(start_date, end_date)
        ).scalar() or 0
        
        result.append({
            "plant_id": plant.id,
            "plant_name": plant.name,
            "benchmarked_count": count
        })
    
    return result


@router.post("/recalculate-savings")
async def recalculate_monthly_savings(
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hq_admin)
):
    """
    Recalculate monthly savings for all plants (HQ only).
    
    This aggregates savings and calculates stars for all plants.
    """
    if year is None:
        year = get_current_year()
    
    calc_service = SavingsCalculatorService(db)
    result = await calc_service.recalculate_all_monthly_savings(year)
    
    return result

