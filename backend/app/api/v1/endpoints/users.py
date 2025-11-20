"""Users endpoints (admin management)."""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.plant import Plant
from app.schemas.user import UserResponse, UserWithPlant, UserUpdate
from app.core.dependencies import require_hq_admin

router = APIRouter()


@router.get("", response_model=List[UserWithPlant])
async def list_users(
    is_active: Optional[bool] = Query(None),
    role: Optional[str] = Query(None),
    plant_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_hq_admin)
):
    """
    List all users (HQ only).
    
    Query params:
    - is_active: Filter by active status
    - role: Filter by role ('plant' or 'hq')
    - plant_id: Filter by plant
    """
    query = db.query(User)
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    if role:
        query = query.filter(User.role == role)
    
    if plant_id:
        query = query.filter(User.plant_id == plant_id)
    
    users = query.order_by(User.full_name).all()
    
    # Add plant info
    result = []
    for user in users:
        user_data = {
            **user.__dict__,
            "plant_name": None,
            "plant_short_name": None
        }
        
        if user.plant_id:
            plant = db.query(Plant).filter(Plant.id == user.plant_id).first()
            if plant:
                user_data["plant_name"] = plant.name
                user_data["plant_short_name"] = plant.short_name
        
        result.append(user_data)
    
    return result


@router.get("/{user_id}", response_model=UserWithPlant)
async def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_hq_admin)
):
    """Get user details (HQ only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user_data = {
        **user.__dict__,
        "plant_name": None,
        "plant_short_name": None
    }
    
    if user.plant_id:
        plant = db.query(Plant).filter(Plant.id == user.plant_id).first()
        if plant:
            user_data["plant_name"] = plant.name
            user_data["plant_short_name"] = plant.short_name
    
    return user_data


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_hq_admin)
):
    """Update user (HQ only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validate plant_id if provided
    if user_update.plant_id is not None:
        plant = db.query(Plant).filter(Plant.id == user_update.plant_id).first()
        if not plant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plant not found"
            )
    
    # Update fields
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return user


@router.patch("/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_hq_admin)
):
    """Activate user (HQ only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = True
    db.commit()
    db.refresh(user)
    
    return user


@router.patch("/{user_id}/deactivate", response_model=UserResponse)
async def deactivate_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_hq_admin)
):
    """Deactivate user (HQ only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = False
    db.commit()
    db.refresh(user)
    
    return user

