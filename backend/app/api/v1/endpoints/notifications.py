"""Notification endpoints."""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.models.best_practice import BestPractice
from app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse
)
from app.core.dependencies import get_current_active_user

router = APIRouter()


@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    limit: int = Query(15, ge=1, le=50),
    offset: int = Query(0, ge=0),
    is_read: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get user's notifications.
    
    Filters notifications based on user role:
    - Plant users: See questions asked on their practices and benchmark notifications
    - HQ Admins: See answers to their questions and benchmark notifications (if applicable)
    """
    # Build query
    query = db.query(Notification).filter(
        Notification.user_id == current_user.id
    )
    
    # Filter by read status if provided
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    
    # Role-based filtering
    if current_user.role == "hq":
        # HQ Admins should only see:
        # - question_answered (when plant users answer their questions)
        # - practice_benchmarked (if they created practices, though unlikely)
        # NOTE: Admins do NOT see question_asked notifications (when they ask questions)
        query = query.filter(
            Notification.type.in_(['question_answered', 'practice_benchmarked'])
        )
    elif current_user.role == "plant":
        # Plant users should see:
        # - question_asked (when admins ask questions on their practices)
        # - practice_benchmarked (their practices being benchmarked)
        # NOTE: Plant users do NOT see question_answered notifications (when they answer)
        query = query.filter(
            Notification.type.in_(['question_asked', 'practice_benchmarked'])
        )
    
    # Get total count
    total = query.count()
    
    # Get paginated results, ordered by created_at descending
    notifications = query.order_by(
        Notification.created_at.desc()
    ).offset(offset).limit(limit).all()
    
    # Build response with practice titles
    result = []
    for notification in notifications:
        practice = db.query(BestPractice).filter(
            BestPractice.id == notification.related_practice_id
        ).first()
        
        result.append({
            "id": str(notification.id),
            "user_id": str(notification.user_id),
            "type": notification.type,
            "title": notification.title,
            "message": notification.message,
            "related_practice_id": str(notification.related_practice_id) if notification.related_practice_id else None,
            "related_question_id": str(notification.related_question_id) if notification.related_question_id else None,
            "practice_title": practice.title if practice else None,
            "is_read": notification.is_read,
            "created_at": notification.created_at.isoformat() if notification.created_at else None,
            "updated_at": notification.updated_at.isoformat() if notification.updated_at else None
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


@router.get("/unread-count")
async def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get unread notification count for current user.
    Filters by role same as list endpoint.
    """
    query = db.query(func.count(Notification.id)).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    )
    
    # Role-based filtering (same as list endpoint)
    if current_user.role == "hq":
        query = query.filter(
            Notification.type.in_(['question_answered', 'practice_benchmarked'])
        )
    elif current_user.role == "plant":
        query = query.filter(
            Notification.type.in_(['question_asked', 'practice_benchmarked'])
        )
    
    count = query.scalar() or 0
    
    return {"unread_count": count}


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_as_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Mark a notification as read.
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    
    # Get practice title
    practice = db.query(BestPractice).filter(
        BestPractice.id == notification.related_practice_id
    ).first()
    
    return {
        "id": str(notification.id),
        "user_id": str(notification.user_id),
        "type": notification.type,
        "title": notification.title,
        "message": notification.message,
        "related_practice_id": str(notification.related_practice_id) if notification.related_practice_id else None,
        "related_question_id": str(notification.related_question_id) if notification.related_question_id else None,
        "practice_title": practice.title if practice else None,
        "is_read": notification.is_read,
        "created_at": notification.created_at.isoformat() if notification.created_at else None,
        "updated_at": notification.updated_at.isoformat() if notification.updated_at else None
    }


@router.patch("/read-all")
async def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Mark all notifications as read for current user.
    """
    updated = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Marked {updated} notifications as read"
    }

