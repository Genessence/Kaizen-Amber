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
from app.schemas.question import (
    QuestionCreate,
    QuestionAnswer,
    QuestionResponse,
    QuestionWithPractice
)
from app.core.dependencies import get_current_active_user

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
    
    # Build response
    asked_by = db.query(User).filter(User.id == question.asked_by_user_id).first()
    answered_by = db.query(User).filter(User.id == current_user.id).first()
    
    return {
        "id": question.id,
        "practice_id": question.practice_id,
        "asked_by_user_id": question.asked_by_user_id,
        "asked_by_name": asked_by.full_name if asked_by else "Unknown",
        "question_text": question.question_text,
        "answer_text": question.answer_text,
        "answered_by_user_id": question.answered_by_user_id,
        "answered_by_name": answered_by.full_name if answered_by else "Unknown",
        "answered_at": question.answered_at,
        "created_at": question.created_at
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

