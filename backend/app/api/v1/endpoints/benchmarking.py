"""Benchmarking endpoints."""

from typing import List, Optional
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.plant import Plant
from app.models.category import Category
from app.models.best_practice import BestPractice
from app.models.benchmarked_practice import BenchmarkedPractice
from app.models.copied_practice import CopiedPractice
from app.schemas.benchmarking import (
    BenchmarkCreate,
    BenchmarkResponse,
    BenchmarkedPracticeListItem,
    CopySpreadItem,
    CopyDetail
)
from app.core.dependencies import get_current_active_user, require_hq_admin

router = APIRouter()


@router.post("/benchmark/{practice_id}", response_model=BenchmarkResponse, status_code=status.HTTP_201_CREATED)
async def benchmark_practice(
    practice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hq_admin)
):
    """
    Benchmark a best practice (HQ only).
    
    This marks the practice as exceptional and available for copying.
    """
    # Verify practice exists
    practice = db.query(BestPractice).filter(
        BestPractice.id == practice_id,
        BestPractice.is_deleted == False
    ).first()
    
    if not practice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Best practice not found"
        )
    
    # Check if already benchmarked
    existing = db.query(BenchmarkedPractice).filter(
        BenchmarkedPractice.practice_id == practice_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Practice is already benchmarked"
        )
    
    # Create benchmarked entry
    benchmarked = BenchmarkedPractice(
        practice_id=practice_id,
        benchmarked_by_user_id=current_user.id,
        benchmarked_date=datetime.utcnow().date()
    )
    
    db.add(benchmarked)
    db.commit()
    db.refresh(benchmarked)
    
    return benchmarked


@router.delete("/unbenchmark/{practice_id}")
async def unbenchmark_practice(
    practice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hq_admin)
):
    """
    Remove benchmark status from a practice (HQ only).
    """
    benchmarked = db.query(BenchmarkedPractice).filter(
        BenchmarkedPractice.practice_id == practice_id
    ).first()
    
    if not benchmarked:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Practice is not benchmarked"
        )
    
    # Check if practice has been copied
    copy_count = db.query(func.count(CopiedPractice.id)).filter(
        CopiedPractice.original_practice_id == practice_id
    ).scalar() or 0
    
    if copy_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot unbenchmark: practice has been copied by {copy_count} plant(s)"
        )
    
    db.delete(benchmarked)
    db.commit()
    
    return {"success": True, "message": "Practice unbenchmarked successfully"}


@router.get("/list", response_model=List[BenchmarkedPracticeListItem])
async def list_benchmarked_practices(
    plant_id: Optional[UUID] = Query(None),
    category_id: Optional[UUID] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List all benchmarked practices.
    
    Query params:
    - plant_id: Filter by plant
    - category_id: Filter by category
    - limit, offset: Pagination
    """
    # Query benchmarked practices with joins
    query = db.query(BenchmarkedPractice).join(
        BestPractice, BenchmarkedPractice.practice_id == BestPractice.id
    ).filter(BestPractice.is_deleted == False)
    
    if plant_id:
        query = query.filter(BestPractice.plant_id == plant_id)
    
    if category_id:
        query = query.filter(BestPractice.category_id == category_id)
    
    benchmarked_practices = query.order_by(
        BenchmarkedPractice.benchmarked_date.desc()
    ).offset(offset).limit(limit).all()
    
    # Build response
    result = []
    for bp in benchmarked_practices:
        practice = db.query(BestPractice).filter(BestPractice.id == bp.practice_id).first()
        category = db.query(Category).filter(Category.id == practice.category_id).first()
        plant = db.query(Plant).filter(Plant.id == practice.plant_id).first()
        
        # Count copies
        copy_count = db.query(func.count(CopiedPractice.id)).filter(
            CopiedPractice.original_practice_id == bp.practice_id
        ).scalar() or 0
        
        result.append({
            "id": bp.id,
            "practice_id": bp.practice_id,
            "practice_title": practice.title,
            "practice_category": category.name if category else "Unknown",
            "plant_name": plant.name if plant else "Unknown",
            "benchmarked_date": bp.benchmarked_date,
            "copy_count": copy_count
        })
    
    return result


@router.get("/recent", response_model=List[BenchmarkedPracticeListItem])
async def get_recent_benchmarked_practices(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get recently benchmarked practices."""
    return await list_benchmarked_practices(
        plant_id=None,
        category_id=None,
        limit=limit,
        offset=0,
        db=db,
        current_user=current_user
    )


@router.get("/{practice_id}/copies", response_model=List[CopyDetail])
async def get_practice_copies(
    practice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get list of plants that copied this practice.
    """
    # Verify practice is benchmarked
    benchmarked = db.query(BenchmarkedPractice).filter(
        BenchmarkedPractice.practice_id == practice_id
    ).first()
    
    if not benchmarked:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Practice is not benchmarked or not found"
        )
    
    # Get all copies
    copies = db.query(CopiedPractice).filter(
        CopiedPractice.original_practice_id == practice_id
    ).order_by(CopiedPractice.copied_date.desc()).all()
    
    result = []
    for copy in copies:
        plant = db.query(Plant).filter(Plant.id == copy.copying_plant_id).first()
        result.append({
            "plant_id": copy.copying_plant_id,
            "plant_name": plant.name if plant else "Unknown",
            "copied_date": copy.copied_date
        })
    
    return result


@router.get("/total-count")
async def get_total_benchmarked_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get total count of benchmarked practices."""
    count = db.query(func.count(BenchmarkedPractice.id)).scalar() or 0
    
    return {
        "success": True,
        "data": {
            "total_benchmarked": count
        }
    }


@router.get("/copy-spread", response_model=List[CopySpreadItem])
async def get_copy_spread(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get horizontal deployment status (copy spread).
    
    Shows which benchmarked practices have been copied and to which plants.
    """
    # Get all benchmarked practices
    benchmarked_practices = db.query(BenchmarkedPractice).join(
        BestPractice, BenchmarkedPractice.practice_id == BestPractice.id
    ).filter(BestPractice.is_deleted == False).offset(offset).limit(limit).all()
    
    result = []
    for bp in benchmarked_practices:
        practice = db.query(BestPractice).filter(BestPractice.id == bp.practice_id).first()
        origin_plant = db.query(Plant).filter(Plant.id == practice.plant_id).first()
        
        # Get all copies
        copies = db.query(CopiedPractice).filter(
            CopiedPractice.original_practice_id == bp.practice_id
        ).all()
        
        copy_details = []
        for copy in copies:
            plant = db.query(Plant).filter(Plant.id == copy.copying_plant_id).first()
            copy_details.append({
                "plant_id": copy.copying_plant_id,
                "plant_name": plant.name if plant else "Unknown",
                "copied_date": copy.copied_date
            })
        
        result.append({
            "bp_id": practice.id,
            "bp_title": practice.title,
            "origin_plant_id": practice.plant_id,
            "origin_plant_name": origin_plant.name if origin_plant else "Unknown",
            "copy_count": len(copy_details),
            "copies": copy_details
        })
    
    return result

