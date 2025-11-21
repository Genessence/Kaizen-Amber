"""Questions & Answers endpoints."""

from typing import List
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.plant import Plant
from app.models.best_practice import BestPractice
from app.models.practice_question import PracticeQuestion
from app.models.notification import Notification
from app.schemas.question import (
    QuestionCreate,
    QuestionAnswer,
    QuestionResponse,
    QuestionWithPractice
)
from app.core.dependencies import get_current_active_user
from app.core.websocket_manager import websocket_manager

router = APIRouter()


@router.get("/practice/{practice_id}", response_model=List[QuestionResponse])
async def get_practice_questions(
    practice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all questions and answers for a best practice.
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
    
    # Get all questions for this practice
    questions = db.query(PracticeQuestion).filter(
        PracticeQuestion.practice_id == practice_id
    ).order_by(PracticeQuestion.created_at.desc()).all()
    
    # Build response with user names
    result = []
    for question in questions:
        asked_by = db.query(User).filter(User.id == question.asked_by_user_id).first()
        answered_by = None
        if question.answered_by_user_id:
            answered_by = db.query(User).filter(User.id == question.answered_by_user_id).first()
        
        result.append({
            "id": question.id,
            "practice_id": question.practice_id,
            "asked_by_user_id": question.asked_by_user_id,
            "asked_by_name": asked_by.full_name if asked_by else "Unknown",
            "question_text": question.question_text,
            "answer_text": question.answer_text,
            "answered_by_user_id": question.answered_by_user_id,
            "answered_by_name": answered_by.full_name if answered_by else None,
            "answered_at": question.answered_at,
            "created_at": question.created_at
        })
    
    return result


@router.post("/practice/{practice_id}", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def ask_question(
    practice_id: UUID,
    question_data: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Ask a question about a best practice.
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
    
    # Create question
    question = PracticeQuestion(
        practice_id=practice_id,
        asked_by_user_id=current_user.id,
        question_text=question_data.question_text
    )
    
    db.add(question)
    db.commit()
    db.refresh(question)
    
    # Create notification for practice author (plant user) when question is asked
    # This notification will be visible to plant users in their notification center
    # Only create if practice has an author (submitted_by_user_id is not None)
    # and the question asker is different from the practice author
    if practice.submitted_by_user_id and practice.submitted_by_user_id != current_user.id:
        notification = Notification(
            user_id=practice.submitted_by_user_id,  # Notify the plant user (practice author)
            type='question_asked',  # Plant users will see this notification type
            title=f"New question on '{practice.title}'",
            message=f"{current_user.full_name} asked a question on '{practice.title}'",
            related_practice_id=practice_id,
            related_question_id=question.id
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        
        # Broadcast notification via WebSocket
        try:
            await websocket_manager.send_to_user(
                practice.submitted_by_user_id,
                {
                    "type": "notification",
                    "data": {
                        "id": str(notification.id),
                        "user_id": str(notification.user_id),
                        "type": notification.type,
                        "title": notification.title,
                        "message": notification.message,
                        "related_practice_id": str(notification.related_practice_id),
                        "related_question_id": str(notification.related_question_id) if notification.related_question_id else None,
                        "practice_title": practice.title,
                        "is_read": notification.is_read,
                        "created_at": notification.created_at.isoformat(),
                        "updated_at": notification.updated_at.isoformat(),
                    },
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        except Exception as e:
            # Log error but don't fail the request
            print(f"Error broadcasting notification via WebSocket: {e}")
    
    # Build response
    asked_by = db.query(User).filter(User.id == current_user.id).first()
    
    return {
        "id": question.id,
        "practice_id": question.practice_id,
        "asked_by_user_id": question.asked_by_user_id,
        "asked_by_name": asked_by.full_name if asked_by else "Unknown",
        "question_text": question.question_text,
        "answer_text": question.answer_text,
        "answered_by_user_id": question.answered_by_user_id,
        "answered_by_name": None,
        "answered_at": question.answered_at,
        "created_at": question.created_at
    }



@router.patch("/{question_id}/answer", response_model=QuestionResponse)
async def answer_question(
    question_id: UUID,
    answer_data: QuestionAnswer,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Answer a question.
    
    Only practice owner or HQ admin can answer.
    """
    question = db.query(PracticeQuestion).filter(
        PracticeQuestion.id == question_id
    ).first()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Get practice to check ownership
    practice = db.query(BestPractice).filter(
        BestPractice.id == question.practice_id
    ).first()
    
    # Check authorization
    is_owner = practice.submitted_by_user_id == current_user.id
    is_hq_admin = current_user.role == "hq"
    
    if not (is_owner or is_hq_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only practice owner or HQ admin can answer questions"
        )
    
    # Update question with answer
    question.answer_text = answer_data.answer_text
    question.answered_by_user_id = current_user.id
    question.answered_at = datetime.utcnow()
    
    db.commit()
    db.refresh(question)
    
    # Create notification for question asker (admin) when question is answered
    # This notification will be visible to admins in their notification center
    # Only create if the answerer is different from the question asker
    if question.asked_by_user_id != current_user.id:
        notification = Notification(
            user_id=question.asked_by_user_id,  # Notify the admin (question asker)
            type='question_answered',  # Admins will see this notification type
            title=f"Your question on '{practice.title}' was answered",
            message=f"{current_user.full_name} answered your question on '{practice.title}'",
            related_practice_id=practice.id,
            related_question_id=question.id
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        
        # Broadcast notification via WebSocket
        await websocket_manager.send_to_user(
            question.asked_by_user_id,
            {
                "type": "notification",
                "data": {
                    "id": str(notification.id),
                    "user_id": str(notification.user_id),
                    "type": notification.type,
                    "title": notification.title,
                    "message": notification.message,
                    "related_practice_id": str(notification.related_practice_id),
                    "related_question_id": str(notification.related_question_id) if notification.related_question_id else None,
                    "practice_title": practice.title,
                    "is_read": notification.is_read,
                    "created_at": notification.created_at.isoformat(),
                    "updated_at": notification.updated_at.isoformat(),
                },
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    # Build response
    asked_by = db.query(User).filter(User.id == question.asked_by_user_id).first()
    answered_by = db.query(User).filter(User.id == current_user.id).first()
    
    return {
        "id": str(question.id),
        "practice_id": str(question.practice_id),
        "asked_by_user_id": str(question.asked_by_user_id),
        "asked_by_name": asked_by.full_name if asked_by else "Unknown",
        "question_text": question.question_text,
        "answer_text": question.answer_text,
        "answered_by_user_id": str(question.answered_by_user_id) if question.answered_by_user_id else None,
        "answered_by_name": answered_by.full_name if answered_by else "Unknown",
        "answered_at": question.answered_at.isoformat() if question.answered_at else None,
        "created_at": question.created_at.isoformat() if question.created_at else None
    }


@router.delete("/{question_id}")
async def delete_question(
    question_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a question.
    
    Only question asker or HQ admin can delete.
    """
    question = db.query(PracticeQuestion).filter(
        PracticeQuestion.id == question_id
    ).first()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Check authorization
    is_asker = question.asked_by_user_id == current_user.id
    is_hq_admin = current_user.role == "hq"
    
    if not (is_asker or is_hq_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this question"
        )
    
    db.delete(question)
    db.commit()
    
    return {"success": True, "message": "Question deleted successfully"}


async def _get_entry_breakdown(plant_id: UUID, year: int, db: Session) -> List[dict]:
    """
    Get breakdown entries for a plant.
    
    Internal helper function.
    """
    breakdown = []
    
    # Get copied practices (Copier entries)
    copied = db.query(CopiedPractice).filter(
        CopiedPractice.copying_plant_id == plant_id
    ).all()
    
    for copy in copied:
        original = db.query(BestPractice).filter(BestPractice.id == copy.original_practice_id).first()
        if original:
            breakdown.append({
                "type": "Copier",
                "points": 5,
                "date": copy.copied_date,
                "bp_title": original.title,
                "bp_id": original.id
            })
    
    # Get originated benchmarked practices (Origin entries)
    originated = db.query(BestPractice).join(
        BenchmarkedPractice, BenchmarkedPractice.practice_id == BestPractice.id
    ).filter(
        BestPractice.plant_id == plant_id,
        BestPractice.is_deleted == False
    ).all()
    
    for practice in originated:
        # Check if it has been copied (only then it gets points)
        copy_count = db.query(func.count(CopiedPractice.id)).filter(
            CopiedPractice.original_practice_id == practice.id
        ).scalar() or 0
        
        if copy_count > 0:
            benchmarked_record = db.query(BenchmarkedPractice).filter(
                BenchmarkedPractice.practice_id == practice.id
            ).first()
            
            breakdown.append({
                "type": "Origin",
                "points": 10,
                "date": benchmarked_record.benchmarked_date if benchmarked_record else practice.submitted_date,
                "bp_title": practice.title,
                "bp_id": practice.id
            })
    
    # Sort by date descending
    breakdown.sort(key=lambda x: x['date'], reverse=True)
    
    return breakdown

