"""Plants endpoints."""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.plant import Plant
from app.models.best_practice import BestPractice
from app.schemas.plant import PlantCreate, PlantUpdate, PlantResponse, PlantWithStats
from app.core.dependencies import get_current_active_user, require_hq_admin

router = APIRouter()


@router.get("", response_model=List[PlantResponse])
async def list_plants(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List all plants.
    
    Query params:
    - is_active: Filter by active status (optional)
    """
    query = db.query(Plant)
    
    if is_active is not None:
        query = query.filter(Plant.is_active == is_active)
    
    plants = query.order_by(Plant.name).all()
    return plants


@router.get("/active", response_model=List[PlantResponse])
async def get_active_plants(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all active plants."""
    plants = db.query(Plant).filter(Plant.is_active == True).order_by(Plant.name).all()
    return plants


@router.get("/inactive", response_model=List[PlantResponse])
async def get_inactive_plants(
    db: Session = Depends(get_db),
    _: User = Depends(require_hq_admin)
):
    """Get all inactive plants (HQ only)."""
    plants = db.query(Plant).filter(Plant.is_active == False).order_by(Plant.name).all()
    return plants


@router.get("/{plant_id}", response_model=PlantWithStats)
async def get_plant(
    plant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get plant details with statistics."""
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plant not found"
        )
    
    # Calculate statistics
    total_practices = db.query(func.count(BestPractice.id)).filter(
        BestPractice.plant_id == plant_id,
        BestPractice.is_deleted == False
    ).scalar() or 0
    
    total_savings = db.query(func.sum(BestPractice.savings_amount)).filter(
        BestPractice.plant_id == plant_id,
        BestPractice.is_deleted == False,
        BestPractice.status == 'approved'
    ).scalar() or 0
    
    # Count benchmarked practices
    from app.models.benchmarked_practice import BenchmarkedPractice
    benchmarked_count = db.query(func.count(BenchmarkedPractice.id)).join(
        BestPractice, BenchmarkedPractice.practice_id == BestPractice.id
    ).filter(BestPractice.plant_id == plant_id).scalar() or 0
    
    # Get current month practices
    from app.utils.date_helpers import get_current_year, get_current_month, get_month_date_range
    year, month = get_current_year(), get_current_month()
    start_date, end_date = get_month_date_range(year, month)
    
    monthly_practices = db.query(func.count(BestPractice.id)).filter(
        BestPractice.plant_id == plant_id,
        BestPractice.is_deleted == False,
        BestPractice.submitted_date.between(start_date, end_date)
    ).scalar() or 0
    
    return {
        **plant.__dict__,
        "total_practices": total_practices,
        "total_savings": float(total_savings),
        "benchmarked_count": benchmarked_count,
        "monthly_practices": monthly_practices
    }


@router.post("", response_model=PlantResponse, status_code=status.HTTP_201_CREATED)
async def create_plant(
    plant_in: PlantCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_hq_admin)
):
    """Create a new plant (HQ only)."""
    # Check if plant name already exists
    existing = db.query(Plant).filter(Plant.name == plant_in.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plant with this name already exists"
        )
    
    plant = Plant(**plant_in.model_dump())
    db.add(plant)
    db.commit()
    db.refresh(plant)
    
    return plant


@router.patch("/{plant_id}", response_model=PlantResponse)
async def update_plant(
    plant_id: UUID,
    plant_update: PlantUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_hq_admin)
):
    """Update plant (HQ only)."""
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plant not found"
        )
    
    # Update fields
    update_data = plant_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plant, field, value)
    
    db.commit()
    db.refresh(plant)
    
    return plant


@router.patch("/{plant_id}/activate", response_model=PlantResponse)
async def activate_plant(
    plant_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_hq_admin)
):
    """Activate a plant (HQ only)."""
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plant not found"
        )
    
    plant.is_active = True
    db.commit()
    db.refresh(plant)
    
    return plant


@router.patch("/{plant_id}/deactivate", response_model=PlantResponse)
async def deactivate_plant(
    plant_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_hq_admin)
):
    """Deactivate a plant (HQ only)."""
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plant not found"
        )
    
    plant.is_active = False
    db.commit()
    db.refresh(plant)
    
    return plant

