"""Questions & Answers endpoints."""

from typing import List
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
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


# --------------------------------------------------------------------
# GET QUESTIONS
# --------------------------------------------------------------------
@router.get("/practice/{practice_id}", response_model=List[QuestionResponse])
async def get_practice_questions(
    practice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):

    practice = db.query(BestPractice).filter(
        BestPractice.id == practice_id,
        BestPractice.is_deleted == False
    ).first()

    if not practice:
        raise HTTPException(status_code=404, detail="Best practice not found")

    questions = db.query(PracticeQuestion).filter(
        PracticeQuestion.practice_id == practice_id
    ).order_by(PracticeQuestion.created_at.desc()).all()

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


# --------------------------------------------------------------------
# ASK QUESTION
# --------------------------------------------------------------------
@router.post("/practice/{practice_id}", response_model=QuestionResponse, status_code=201)
async def ask_question(
    practice_id: UUID,
    question_data: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):

    practice = db.query(BestPractice).filter(
        BestPractice.id == practice_id,
        BestPractice.is_deleted == False
    ).first()

    if not practice:
        raise HTTPException(status_code=404, detail="Best practice not found")

    question = PracticeQuestion(
        practice_id=practice_id,
        asked_by_user_id=current_user.id,
        question_text=question_data.question_text
    )

    db.add(question)
    db.commit()
    db.refresh(question)

    # Notify practice owner
    if practice.submitted_by_user_id and practice.submitted_by_user_id != current_user.id:
        notification = Notification(
            user_id=practice.submitted_by_user_id,
            type='question_asked',
            title=f"New question on '{practice.title}'",
            message=f"{current_user.full_name} asked a question on '{practice.title}'",
            related_practice_id=practice_id,
            related_question_id=question.id
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)

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
                        "related_question_id": str(notification.related_question_id),
                        "practice_title": practice.title,
                        "is_read": notification.is_read,
                        "created_at": notification.created_at.isoformat(),
                        "updated_at": notification.updated_at.isoformat(),
                    },
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        except Exception as e:
            print("WebSocket error:", e)

    asked_by = db.query(User).filter(User.id == current_user.id).first()

    return {
        "id": question.id,
        "practice_id": question.practice_id,
        "asked_by_user_id": question.asked_by_user_id,
        "asked_by_name": asked_by.full_name if asked_by else "Unknown",
        "question_text": question.question_text,
        "answer_text": question.answer_text,
        "answered_by_user_id": None,
        "answered_by_name": None,
        "answered_at": None,
        "created_at": question.created_at
    }


# --------------------------------------------------------------------
# CORS FIX – OPTIONS for PATCH /answer
# -------------------------------------------------------------------


# --------------------------------------------------------------------
# ANSWER QUESTION
# --------------------------------------------------------------------
@router.patch("/{question_id}/answer", response_model=QuestionResponse)
async def answer_question(
    question_id: UUID,
    answer_data: QuestionAnswer,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):

    question = db.query(PracticeQuestion).filter(
        PracticeQuestion.id == question_id
    ).first()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    practice = db.query(BestPractice).filter(
        BestPractice.id == question.practice_id
    ).first()

    is_owner = practice.submitted_by_user_id == current_user.id
    is_hq = current_user.role == "hq"

    if not (is_owner or is_hq):
        raise HTTPException(status_code=403, detail="Not authorized to answer")

    question.answer_text = answer_data.answer_text
    question.answered_by_user_id = current_user.id
    question.answered_at = datetime.utcnow()

    db.commit()
    db.refresh(question)

    # Notify asker
    if question.asked_by_user_id != current_user.id:
        notification = Notification(
            user_id=question.asked_by_user_id,
            type='question_answered',
            title=f"Your question on '{practice.title}' was answered",
            message=f"{current_user.full_name} answered your question",
            related_practice_id=practice.id,
            related_question_id=question.id
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)

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
                    "related_question_id": str(notification.related_question_id),
                    "practice_title": practice.title,
                    "is_read": notification.is_read,
                    "created_at": notification.created_at.isoformat(),
                    "updated_at": notification.updated_at.isoformat(),
                },
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    asked_by = db.query(User).filter(User.id == question.asked_by_user_id).first()
    answered_by = current_user

    return {
        "id": str(question.id),
        "practice_id": str(question.practice_id),
        "asked_by_user_id": str(question.asked_by_user_id),
        "asked_by_name": asked_by.full_name if asked_by else "Unknown",
        "question_text": question.question_text,
        "answer_text": question.answer_text,
        "answered_by_user_id": str(question.answered_by_user_id),
        "answered_by_name": answered_by.full_name,
        "answered_at": question.answered_at.isoformat(),
        "created_at": question.created_at.isoformat(),
    }


# --------------------------------------------------------------------
# DELETE QUESTION
# --------------------------------------------------------------------
@router.delete("/{question_id}")
async def delete_question(
    question_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):

    question = db.query(PracticeQuestion).filter(
        PracticeQuestion.id == question_id
    ).first()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    is_asker = question.asked_by_user_id == current_user.id
    is_hq = current_user.role == "hq"

    if not (is_asker or is_hq):
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(question)
    db.commit()

    return {"success": True, "message": "Question deleted successfully"}
