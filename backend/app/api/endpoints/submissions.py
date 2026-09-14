from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from app.database import get_db
from app.models.submission import Submission
from app.models.user import User
from app.models.activity import Activity

router = APIRouter()

class SubmissionCreate(BaseModel):
    student_id: int
    activity_id: int
    file_path: str

class SubmissionResponse(BaseModel):
    id: int
    student_id: int
    activity_id: int
    file_path: str
    score: Optional[float] = None
    feedback: Optional[str] = None

    class Config:
        from_attributes = True

@router.post("", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
def create_submission(payload: SubmissionCreate, db: Session = Depends(get_db)):
    """
    Registra una nueva entrega (Submission) de un alumno para una actividad.
    """
    sub = Submission(
        student_id=payload.student_id,
        activity_id=payload.activity_id,
        file_path=payload.file_path,
        score=None,
        feedback=None
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub

class GradeUpdate(BaseModel):
    score: float
    feedback: Optional[str] = None

@router.put("/{submission_id}/grade", response_model=SubmissionResponse)
def grade_submission(submission_id: int, grade: GradeUpdate, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Entrega no encontrada")
    
    sub.score = grade.score
    if grade.feedback is not None:
        sub.feedback = grade.feedback
        
    db.commit()
    db.refresh(sub)
    return sub

class RecentSubmissionResponse(BaseModel):
    id: int
    student_name: str
    activity_title: str
    score: Optional[float] = None
    submitted_at: Optional[str] = None
    status: str

@router.get("/recent", response_model=List[RecentSubmissionResponse])
def get_recent_submissions(db: Session = Depends(get_db)):
    subs = db.query(Submission, User.name, Activity.title).join(User, User.id == Submission.student_id).join(Activity, Activity.id == Submission.activity_id).order_by(Submission.submitted_at.desc()).limit(10).all()
    
    result = []
    for sub, user_name, act_title in subs:
        result.append(RecentSubmissionResponse(
            id=sub.id,
            student_name=user_name,
            activity_title=act_title,
            score=sub.score,
            submitted_at=sub.submitted_at.isoformat() if sub.submitted_at else None,
            status="Calificado" if sub.score is not None else "Pendiente"
        ))
    return result
