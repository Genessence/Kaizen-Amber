"""Copy & Implement endpoints."""

from typing import List
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.plant import Plant
from app.models.best_practice import BestPractice
from app.models.benchmarked_practice import BenchmarkedPractice
from app.models.copied_practice import CopiedPractice
from app.schemas.copy import (
    CopyImplementRequest,
    CopiedPracticeResponse,
    CopyImplementResponse
)
from app.schemas.best_practice import BestPracticeResponse
from app.core.dependencies import get_current_active_user, require_plant_user
from app.services.leaderboard_service import LeaderboardService

router = APIRouter()


@router.post("/implement", response_model=dict, status_code=status.HTTP_201_CREATED)
async def copy_and_implement(
    request: CopyImplementRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_plant_user)
):
    """
    Copy and implement a benchmarked best practice.
    
    This creates a new best practice for the current user's plant based on a benchmarked practice.
    Awards points to both origin and copying plants.
    """
    # Verify original practice exists and is benchmarked
    original_practice = db.query(BestPractice).filter(
        BestPractice.id == request.original_practice_id,
        BestPractice.is_deleted == False
    ).first()
    
    if not original_practice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Original practice not found"
        )
    
    # Verify it's benchmarked
    benchmarked = db.query(BenchmarkedPractice).filter(
        BenchmarkedPractice.practice_id == request.original_practice_id
    ).first()
    
    if not benchmarked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Practice must be benchmarked before it can be copied"
        )
    
    # Prevent copying from same plant
    if original_practice.plant_id == current_user.plant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot copy a practice from your own plant"
        )
    
    # Check if already copied by this plant
    existing_copy = db.query(CopiedPractice).filter(
        CopiedPractice.original_practice_id == request.original_practice_id,
        CopiedPractice.copying_plant_id == current_user.plant_id
    ).first()
    
    if existing_copy:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your plant has already copied this practice"
        )
    
    # Create new practice based on original
    copied_practice = BestPractice(
        title=request.customized_title or original_practice.title,
        description=original_practice.description,
        category_id=original_practice.category_id,
        submitted_by_user_id=current_user.id,
        plant_id=current_user.plant_id,
        problem_statement=original_practice.problem_statement,
        solution=request.customized_solution or original_practice.solution,
        benefits=original_practice.benefits,
        metrics=original_practice.metrics,
        implementation=original_practice.implementation,
        investment=original_practice.investment,
        savings_amount=original_practice.savings_amount,
        savings_currency=original_practice.savings_currency,
        savings_period=original_practice.savings_period,
        area_implemented=original_practice.area_implemented,
        status='submitted',  # Copied practices start as submitted
        submitted_date=datetime.utcnow().date()
    )
    
    db.add(copied_practice)
    db.flush()  # Get ID without committing
    
    # Create copied_practice record
    copy_record = CopiedPractice(
        original_practice_id=request.original_practice_id,
        copied_practice_id=copied_practice.id,
        copying_plant_id=current_user.plant_id,
        copied_date=datetime.utcnow().date(),
        implementation_status=request.implementation_status
    )
    
    db.add(copy_record)
    db.flush()
    
    # Update leaderboard
    leaderboard_service = LeaderboardService(db)
    points_awarded = await leaderboard_service.update_on_copy(
        request.original_practice_id,
        current_user.plant_id
    )
    
    db.commit()
    db.refresh(copied_practice)
    db.refresh(copy_record)
    
    # Build response
    from app.api.v1.endpoints.best_practices import get_best_practice
    copied_practice_response = await get_best_practice(copied_practice.id, db, current_user)
    
    return {
        "success": True,
        "data": {
            "copied_practice": copied_practice_response,
            "copy_record": copy_record,
            "points_awarded": points_awarded
        },
        "message": "Practice copied successfully"
    }


@router.get("/my-implementations", response_model=List[CopiedPracticeResponse])
async def get_my_implementations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_plant_user)
):
    """
    Get all practices copied by current user's plant.
    """
    copies = db.query(CopiedPractice).filter(
        CopiedPractice.copying_plant_id == current_user.plant_id
    ).order_by(CopiedPractice.copied_date.desc()).all()
    
    return copies


@router.get("/deployment-status", response_model=dict)
async def get_deployment_status(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get horizontal deployment status.
    
    Shows which benchmarked practices have been deployed across plants.
    """
    # Get benchmarked practices with copy counts
    benchmarked_query = db.query(
        BestPractice.id,
        BestPractice.title,
        BestPractice.plant_id,
        func.count(CopiedPractice.id).label('copy_count')
    ).join(
        BenchmarkedPractice, BenchmarkedPractice.practice_id == BestPractice.id
    ).outerjoin(
        CopiedPractice, CopiedPractice.original_practice_id == BestPractice.id
    ).filter(
        BestPractice.is_deleted == False
    ).group_by(
        BestPractice.id
    ).order_by(
        func.count(CopiedPractice.id).desc()
    ).offset(offset).limit(limit).all()
    
    result = []
    for row in benchmarked_query:
        plant = db.query(Plant).filter(Plant.id == row.plant_id).first()
        
        # Get copy details
        copies = db.query(CopiedPractice).filter(
            CopiedPractice.original_practice_id == row.id
        ).all()
        
        copy_plants = []
        for copy in copies:
            copy_plant = db.query(Plant).filter(Plant.id == copy.copying_plant_id).first()
            copy_plants.append({
                "plant_id": copy.copying_plant_id,
                "plant_name": copy_plant.name if copy_plant else "Unknown",
                "copied_date": copy.copied_date
            })
        
        result.append({
            "bp_id": row.id,
            "bp_title": row.title,
            "origin_plant_id": row.plant_id,
            "origin_plant_name": plant.name if plant else "Unknown",
            "copy_count": row.copy_count,
            "copies": copy_plants
        })
    
    return {
        "success": True,
        "data": result
    }


@router.get("/{original_id}/copies", response_model=List[CopiedPracticeResponse])
async def get_practice_copies(
    original_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all copies of a specific practice.
    """
    copies = db.query(CopiedPractice).filter(
        CopiedPractice.original_practice_id == original_id
    ).order_by(CopiedPractice.copied_date.desc()).all()
    
    return copies

