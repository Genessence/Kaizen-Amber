"""Categories endpoints."""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.category import Category
from app.models.best_practice import BestPractice
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse, CategoryWithCount
from app.core.dependencies import get_current_active_user, require_hq_admin

router = APIRouter()


@router.get("", response_model=List[CategoryWithCount])
async def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List all categories with practice counts.
    """
    categories = db.query(Category).order_by(Category.name).all()
    
    result = []
    for category in categories:
        # Count practices in this category
        practice_count = db.query(func.count(BestPractice.id)).filter(
            BestPractice.category_id == category.id,
            BestPractice.is_deleted == False
        ).scalar() or 0
        
        result.append({
            **category.__dict__,
            "practice_count": practice_count
        })
    
    return result


@router.get("/{category_id}", response_model=CategoryWithCount)
async def get_category(
    category_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get category details with practice count."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Count practices
    practice_count = db.query(func.count(BestPractice.id)).filter(
        BestPractice.category_id == category_id,
        BestPractice.is_deleted == False
    ).scalar() or 0
    
    return {
        **category.__dict__,
        "practice_count": practice_count
    }


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_hq_admin)
):
    """Create a new category (HQ only)."""
    # Check if slug already exists
    existing = db.query(Category).filter(Category.slug == category_in.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this slug already exists"
        )
    
    category = Category(**category_in.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return category


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: UUID,
    category_update: CategoryUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_hq_admin)
):
    """Update category (HQ only)."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Update fields
    update_data = category_update.model_dump(exclude_unset=True)
    
    # Check slug uniqueness if being updated
    if 'slug' in update_data:
        existing = db.query(Category).filter(
            Category.slug == update_data['slug'],
            Category.id != category_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this slug already exists"
            )
    
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    
    return category

