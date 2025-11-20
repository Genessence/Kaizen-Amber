"""Best Practices endpoints."""

from typing import List, Optional
from datetime import date, datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile, Form
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_

from app.database import get_db
from app.models.user import User
from app.models.plant import Plant
from app.models.category import Category
from app.models.best_practice import BestPractice
from app.models.practice_image import PracticeImage
from app.models.practice_document import PracticeDocument
from app.models.benchmarked_practice import BenchmarkedPractice
from app.models.copied_practice import CopiedPractice
from app.models.practice_question import PracticeQuestion
from app.schemas.best_practice import (
    BestPracticeCreate,
    BestPracticeUpdate,
    BestPracticeResponse,
    BestPracticeListItem,
    PracticeImageCreate,
    PracticeImageResponse,
    PracticeDocumentCreate,
    PracticeDocumentResponse,
    PresignedUrlRequest,
    PresignedUrlResponse
)
from app.core.dependencies import get_current_active_user, require_hq_admin, require_plant_user
from app.core.azure_storage import get_azure_storage, AzureStorageClient
from app.config import settings

router = APIRouter()


@router.get("", response_model=dict)
async def list_best_practices(
    category_id: Optional[UUID] = Query(None),
    plant_id: Optional[UUID] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    is_benchmarked: Optional[bool] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sort_by: str = Query("submitted_date", regex="^(submitted_date|title|created_at)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List best practices with filters and pagination.
    
    Plant users see all practices.
    HQ admins see all practices.
    """
    # Base query
    query = db.query(BestPractice).filter(BestPractice.is_deleted == False)
    
    # Apply filters
    if category_id:
        query = query.filter(BestPractice.category_id == category_id)
    
    if plant_id:
        query = query.filter(BestPractice.plant_id == plant_id)
    
    if status:
        query = query.filter(BestPractice.status == status)
    
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                func.lower(BestPractice.title).like(search_term),
                func.lower(BestPractice.description).like(search_term)
            )
        )
    
    if start_date:
        query = query.filter(BestPractice.submitted_date >= start_date)
    
    if end_date:
        query = query.filter(BestPractice.submitted_date <= end_date)
    
    if is_benchmarked is not None:
        if is_benchmarked:
            query = query.join(BenchmarkedPractice)
        else:
            query = query.outerjoin(BenchmarkedPractice).filter(BenchmarkedPractice.id == None)
    
    # Get total count before pagination
    total = query.count()
    
    # Apply sorting
    if sort_by == "title":
        order_column = BestPractice.title
    elif sort_by == "created_at":
        order_column = BestPractice.created_at
    else:  # submitted_date
        order_column = BestPractice.submitted_date
    
    if sort_order == "asc":
        query = query.order_by(order_column.asc())
    else:
        query = query.order_by(order_column.desc())
    
    # Apply pagination
    practices = query.offset(offset).limit(limit).all()
    
    # Build response with additional data
    result = []
    for practice in practices:
        # Get category name
        category = db.query(Category).filter(Category.id == practice.category_id).first()
        
        # Get plant name
        plant = db.query(Plant).filter(Plant.id == practice.plant_id).first()
        
        # Get submitted by user name
        user = db.query(User).filter(User.id == practice.submitted_by_user_id).first()
        
        # Check if benchmarked
        is_benchmarked_val = db.query(BenchmarkedPractice).filter(
            BenchmarkedPractice.practice_id == practice.id
        ).first() is not None
        
        # Count questions
        question_count = db.query(func.count(PracticeQuestion.id)).filter(
            PracticeQuestion.practice_id == practice.id
        ).scalar() or 0
        
        # Check if has images
        has_images = db.query(PracticeImage).filter(
            PracticeImage.practice_id == practice.id
        ).first() is not None
        
        result.append({
            "id": practice.id,
            "title": practice.title,
            "description": practice.description,
            "category_id": practice.category_id,
            "category_name": category.name if category else "Unknown",
            "plant_id": practice.plant_id,
            "plant_name": plant.name if plant else "Unknown",
            "submitted_by_name": user.full_name if user else "Unknown",
            "submitted_date": practice.submitted_date,
            "status": practice.status,
            "savings_amount": practice.savings_amount,
            "savings_currency": practice.savings_currency,
            "is_benchmarked": is_benchmarked_val,
            "question_count": question_count,
            "has_images": has_images,
            "created_at": practice.created_at
        })
    
    return {
        "success": True,
        "data": result,
        "pagination": {
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total
        }
    }


@router.get("/my-practices", response_model=List[BestPracticeListItem])
async def get_my_practices(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_plant_user)
):
    """
    Get best practices for current user's plant.
    """
    practices = db.query(BestPractice).filter(
        BestPractice.plant_id == current_user.plant_id,
        BestPractice.is_deleted == False
    ).order_by(BestPractice.submitted_date.desc()).all()
    
    # Build response
    result = []
    for practice in practices:
        category = db.query(Category).filter(Category.id == practice.category_id).first()
        plant = db.query(Plant).filter(Plant.id == practice.plant_id).first()
        user = db.query(User).filter(User.id == practice.submitted_by_user_id).first()
        
        is_benchmarked_val = db.query(BenchmarkedPractice).filter(
            BenchmarkedPractice.practice_id == practice.id
        ).first() is not None
        
        question_count = db.query(func.count(PracticeQuestion.id)).filter(
            PracticeQuestion.practice_id == practice.id
        ).scalar() or 0
        
        has_images = db.query(PracticeImage).filter(
            PracticeImage.practice_id == practice.id
        ).first() is not None
        
        result.append({
            "id": practice.id,
            "title": practice.title,
            "description": practice.description,
            "category_id": practice.category_id,
            "category_name": category.name if category else "Unknown",
            "plant_id": practice.plant_id,
            "plant_name": plant.name if plant else "Unknown",
            "submitted_by_name": user.full_name if user else "Unknown",
            "submitted_date": practice.submitted_date,
            "status": practice.status,
            "savings_amount": practice.savings_amount,
            "savings_currency": practice.savings_currency,
            "is_benchmarked": is_benchmarked_val,
            "question_count": question_count,
            "has_images": has_images,
            "created_at": practice.created_at
        })
    
    return result


@router.get("/recent", response_model=List[BestPracticeListItem])
async def get_recent_practices(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get recent best practices."""
    practices = db.query(BestPractice).filter(
        BestPractice.is_deleted == False
    ).order_by(BestPractice.created_at.desc()).limit(limit).all()
    
    result = []
    for practice in practices:
        category = db.query(Category).filter(Category.id == practice.category_id).first()
        plant = db.query(Plant).filter(Plant.id == practice.plant_id).first()
        user = db.query(User).filter(User.id == practice.submitted_by_user_id).first()
        
        is_benchmarked_val = db.query(BenchmarkedPractice).filter(
            BenchmarkedPractice.practice_id == practice.id
        ).first() is not None
        
        question_count = db.query(func.count(PracticeQuestion.id)).filter(
            PracticeQuestion.practice_id == practice.id
        ).scalar() or 0
        
        has_images = db.query(PracticeImage).filter(
            PracticeImage.practice_id == practice.id
        ).first() is not None
        
        result.append({
            "id": practice.id,
            "title": practice.title,
            "description": practice.description,
            "category_id": practice.category_id,
            "category_name": category.name if category else "Unknown",
            "plant_id": practice.plant_id,
            "plant_name": plant.name if plant else "Unknown",
            "submitted_by_name": user.full_name if user else "Unknown",
            "submitted_date": practice.submitted_date,
            "status": practice.status,
            "savings_amount": practice.savings_amount,
            "savings_currency": practice.savings_currency,
            "is_benchmarked": is_benchmarked_val,
            "question_count": question_count,
            "has_images": has_images,
            "created_at": practice.created_at
        })
    
    return result


@router.get("/{practice_id}", response_model=BestPracticeResponse)
async def get_best_practice(
    practice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get best practice details."""
    practice = db.query(BestPractice).filter(
        BestPractice.id == practice_id,
        BestPractice.is_deleted == False
    ).first()
    
    if not practice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Best practice not found"
        )
    
    # Get related data
    category = db.query(Category).filter(Category.id == practice.category_id).first()
    plant = db.query(Plant).filter(Plant.id == practice.plant_id).first()
    user = db.query(User).filter(User.id == practice.submitted_by_user_id).first()
    
    is_benchmarked_val = db.query(BenchmarkedPractice).filter(
        BenchmarkedPractice.practice_id == practice.id
    ).first() is not None
    
    question_count = db.query(func.count(PracticeQuestion.id)).filter(
        PracticeQuestion.practice_id == practice.id
    ).scalar() or 0
    
    copy_count = db.query(func.count(CopiedPractice.id)).filter(
        CopiedPractice.original_practice_id == practice.id
    ).scalar() or 0
    
    # Get images
    images = db.query(PracticeImage).filter(
        PracticeImage.practice_id == practice.id
    ).all()
    
    # Get documents
    documents = db.query(PracticeDocument).filter(
        PracticeDocument.practice_id == practice.id
    ).all()
    
    return {
        **practice.__dict__,
        "category_name": category.name if category else None,
        "plant_name": plant.name if plant else None,
        "submitted_by_name": user.full_name if user else None,
        "is_benchmarked": is_benchmarked_val,
        "question_count": question_count,
        "copy_count": copy_count,
        "images": images,
        "documents": documents
    }


@router.post("", response_model=BestPracticeResponse, status_code=status.HTTP_201_CREATED)
async def create_best_practice(
    practice_in: BestPracticeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new best practice.
    
    Plant users can only create for their plant.
    HQ admins can create for any plant.
    """
    # Validate category exists
    category = db.query(Category).filter(Category.id == practice_in.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Determine plant_id
    if practice_in.plant_id:
        # Verify plant exists
        plant = db.query(Plant).filter(Plant.id == practice_in.plant_id).first()
        if not plant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plant not found"
            )
        
        # Plant users can only create for their plant
        if current_user.role == "plant" and practice_in.plant_id != current_user.plant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot create practice for another plant"
            )
        
        plant_id = practice_in.plant_id
    else:
        # Default to user's plant for plant users
        if current_user.role == "plant":
            plant_id = current_user.plant_id
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="plant_id is required"
            )
    
    # Set submitted_date if status is submitted
    submitted_date = practice_in.submitted_date
    if practice_in.status == "submitted" and not submitted_date:
        submitted_date = datetime.utcnow().date()
    
    # Create practice
    practice = BestPractice(
        **practice_in.model_dump(exclude={'plant_id', 'submitted_date'}),
        plant_id=plant_id,
        submitted_by_user_id=current_user.id,
        submitted_date=submitted_date
    )
    
    db.add(practice)
    db.commit()
    db.refresh(practice)
    
    # Return full response
    return await get_best_practice(practice.id, db, current_user)


@router.patch("/{practice_id}", response_model=BestPracticeResponse)
async def update_best_practice(
    practice_id: UUID,
    practice_update: BestPracticeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update best practice.
    
    Owner or HQ admin can update.
    """
    practice = db.query(BestPractice).filter(
        BestPractice.id == practice_id,
        BestPractice.is_deleted == False
    ).first()
    
    if not practice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Best practice not found"
        )
    
    # Check authorization
    is_owner = practice.submitted_by_user_id == current_user.id
    is_hq_admin = current_user.role == "hq"
    
    if not (is_owner or is_hq_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this practice"
        )
    
    # Validate category if being updated
    if practice_update.category_id:
        category = db.query(Category).filter(Category.id == practice_update.category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
    
    # Update fields
    update_data = practice_update.model_dump(exclude_unset=True)
    
    # Set submitted_date if status changes to submitted
    if update_data.get('status') == 'submitted' and practice.submitted_date is None:
        practice.submitted_date = datetime.utcnow().date()
    
    for field, value in update_data.items():
        setattr(practice, field, value)
    
    db.commit()
    db.refresh(practice)
    
    return await get_best_practice(practice.id, db, current_user)


@router.delete("/{practice_id}")
async def delete_best_practice(
    practice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Soft delete best practice.
    
    Owner or HQ admin can delete.
    """
    practice = db.query(BestPractice).filter(
        BestPractice.id == practice_id,
        BestPractice.is_deleted == False
    ).first()
    
    if not practice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Best practice not found"
        )
    
    # Check authorization
    is_owner = practice.submitted_by_user_id == current_user.id
    is_hq_admin = current_user.role == "hq"
    
    if not (is_owner or is_hq_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this practice"
        )
    
    # Soft delete
    practice.is_deleted = True
    db.commit()
    
    return {"success": True, "message": "Best practice deleted successfully"}


@router.get("/{practice_id}/statistics")
async def get_practice_statistics(
    practice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get statistics for a best practice."""
    practice = db.query(BestPractice).filter(
        BestPractice.id == practice_id,
        BestPractice.is_deleted == False
    ).first()
    
    if not practice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Best practice not found"
        )
    
    # Count copies
    copy_count = db.query(func.count(CopiedPractice.id)).filter(
        CopiedPractice.original_practice_id == practice_id
    ).scalar() or 0
    
    # Count questions
    question_count = db.query(func.count(PracticeQuestion.id)).filter(
        PracticeQuestion.practice_id == practice_id
    ).scalar() or 0
    
    # Check if benchmarked
    is_benchmarked_val = db.query(BenchmarkedPractice).filter(
        BenchmarkedPractice.practice_id == practice_id
    ).first() is not None
    
    return {
        "success": True,
        "data": {
            "practice_id": practice_id,
            "copy_count": copy_count,
            "question_count": question_count,
            "is_benchmarked": is_benchmarked_val
        }
    }


# Image and document endpoints
@router.get("/{practice_id}/images", response_model=List[PracticeImageResponse])
async def list_practice_images(
    practice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all images for a practice."""
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
    
    images = db.query(PracticeImage).filter(
        PracticeImage.practice_id == practice_id
    ).all()
    
    return images


@router.post("/{practice_id}/images", response_model=PracticeImageResponse, status_code=status.HTTP_201_CREATED)
async def confirm_image_upload(
    practice_id: UUID,
    image_data: PracticeImageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Confirm image upload (after client uploads to Azure)."""
    # Verify practice exists and user has permission
    practice = db.query(BestPractice).filter(
        BestPractice.id == practice_id,
        BestPractice.is_deleted == False
    ).first()
    
    if not practice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Best practice not found"
        )
    
    # Check authorization
    is_owner = practice.submitted_by_user_id == current_user.id
    is_hq_admin = current_user.role == "hq"
    
    if not (is_owner or is_hq_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload images for this practice"
        )
    
    # Check if image of this type already exists
    existing = db.query(PracticeImage).filter(
        PracticeImage.practice_id == practice_id,
        PracticeImage.image_type == image_data.image_type
    ).first()
    
    if existing:
        # Delete old image from Azure
        azure_storage = get_azure_storage()
        await azure_storage.delete_blob(existing.blob_container, existing.blob_name)
        db.delete(existing)
    
    # Create new image record
    image = PracticeImage(**image_data.model_dump())
    db.add(image)
    db.commit()
    db.refresh(image)
    
    return image


@router.delete("/{practice_id}/images/{image_id}")
async def delete_practice_image(
    practice_id: UUID,
    image_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete practice image."""
    practice = db.query(BestPractice).filter(
        BestPractice.id == practice_id,
        BestPractice.is_deleted == False
    ).first()
    
    if not practice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Best practice not found"
        )
    
    # Check authorization
    is_owner = practice.submitted_by_user_id == current_user.id
    is_hq_admin = current_user.role == "hq"
    
    if not (is_owner or is_hq_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    image = db.query(PracticeImage).filter(
        PracticeImage.id == image_id,
        PracticeImage.practice_id == practice_id
    ).first()
    
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    # Delete from Azure
    azure_storage = get_azure_storage()
    await azure_storage.delete_blob(image.blob_container, image.blob_name)
    
    # Delete from database
    db.delete(image)
    db.commit()
    
    return {"success": True, "message": "Image deleted successfully"}


@router.get("/{practice_id}/documents", response_model=List[PracticeDocumentResponse])
async def list_practice_documents(
    practice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all documents for a practice."""
    practice = db.query(BestPractice).filter(
        BestPractice.id == practice_id,
        BestPractice.is_deleted == False
    ).first()
    
    if not practice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Best practice not found"
        )
    
    documents = db.query(PracticeDocument).filter(
        PracticeDocument.practice_id == practice_id
    ).all()
    
    return documents


@router.post("/{practice_id}/documents", response_model=PracticeDocumentResponse, status_code=status.HTTP_201_CREATED)
async def confirm_document_upload(
    practice_id: UUID,
    document_data: PracticeDocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Confirm document upload."""
    practice = db.query(BestPractice).filter(
        BestPractice.id == practice_id,
        BestPractice.is_deleted == False
    ).first()
    
    if not practice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Best practice not found"
        )
    
    # Check authorization
    is_owner = practice.submitted_by_user_id == current_user.id
    is_hq_admin = current_user.role == "hq"
    
    if not (is_owner or is_hq_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    document = PracticeDocument(**document_data.model_dump())
    db.add(document)
    db.commit()
    db.refresh(document)
    
    return document


@router.delete("/{practice_id}/documents/{document_id}")
async def delete_practice_document(
    practice_id: UUID,
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete practice document."""
    practice = db.query(BestPractice).filter(
        BestPractice.id == practice_id,
        BestPractice.is_deleted == False
    ).first()
    
    if not practice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Best practice not found"
        )
    
    # Check authorization
    is_owner = practice.submitted_by_user_id == current_user.id
    is_hq_admin = current_user.role == "hq"
    
    if not (is_owner or is_hq_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    document = db.query(PracticeDocument).filter(
        PracticeDocument.id == document_id,
        PracticeDocument.practice_id == practice_id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Delete from Azure
    azure_storage = get_azure_storage()
    await azure_storage.delete_blob(document.blob_container, document.blob_name)
    
    # Delete from database
    db.delete(document)
    db.commit()
    
    return {"success": True, "message": "Document deleted successfully"}


# Upload endpoints
@router.post("/upload/presigned-url", response_model=PresignedUrlResponse)
async def get_presigned_upload_url(
    request: PresignedUrlRequest,
    azure_storage: AzureStorageClient = Depends(get_azure_storage),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get presigned URL for direct upload to Azure Blob Storage.
    """
    # Verify practice exists
    practice = db.query(BestPractice).filter(
        BestPractice.id == request.practice_id,
        BestPractice.is_deleted == False
    ).first()
    
    if not practice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Best practice not found"
        )
    
    # Check authorization
    is_owner = practice.submitted_by_user_id == current_user.id
    is_hq_admin = current_user.role == "hq"
    
    if not (is_owner or is_hq_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Validate file size
    if request.file_type == "image":
        max_size = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
        if request.file_size > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image size exceeds maximum of {settings.MAX_IMAGE_SIZE_MB}MB"
            )
        
        if request.content_type not in settings.ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid image type. Allowed: {settings.ALLOWED_IMAGE_TYPES}"
            )
    else:  # document
        max_size = settings.MAX_DOCUMENT_SIZE_MB * 1024 * 1024
        if request.file_size > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Document size exceeds maximum of {settings.MAX_DOCUMENT_SIZE_MB}MB"
            )
    
    # Determine container
    if request.file_type == "image":
        container = azure_storage.container_practices
        blob_name = azure_storage.generate_blob_name(
            str(request.practice_id),
            request.image_type,
            request.filename
        )
    else:
        container = azure_storage.container_documents
        blob_name = azure_storage.generate_blob_name(
            str(request.practice_id),
            "document",
            request.filename
        )
    
    # Generate presigned URL
    upload_url, expiry = azure_storage.generate_upload_sas_url(container, blob_name)
    
    return PresignedUrlResponse(
        upload_url=upload_url,
        blob_name=blob_name,
        container=container,
        expiry=expiry
    )

