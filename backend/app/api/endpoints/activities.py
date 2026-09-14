from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from pydantic import BaseModel
from typing import Optional, List
from datetime import date

from app.database import get_db
from app.models.activity import Activity
from app.models.submission import Submission
from app.models.period import Period

router = APIRouter()

class ActivityResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    max_score: float
    period_id: int
    due_date: Optional[str] = None
    submissions_count: int = 0

    class Config:
        from_attributes = True

class StudentActivityResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    max_score: float
    period_id: int
    period_name: str
    due_date: Optional[str] = None
    status: str  # "pending" | "submitted" | "graded"
    score: Optional[float] = None
    feedback: Optional[str] = None
    submitted_at: Optional[str] = None
    submissions_count: int = 0

    class Config:
        from_attributes = True

@router.get("", response_model=List[ActivityResponse])
def get_activities(period_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    """
    Obtener actividades. Opcionalmente filtrar por period_id.
    """
    query = db.query(
        Activity.id,
        Activity.title,
        Activity.description,
        Activity.max_score,
        Activity.period_id,
        Activity.due_date,
        func.count(Submission.id).label("submissions_count")
    ).outerjoin(Submission, Submission.activity_id == Activity.id)

    if period_id is not None:
        query = query.filter(Activity.period_id == period_id)

    query = query.group_by(Activity.id)
    results = query.all()

    return [
        ActivityResponse(
            id=r.id,
            title=r.title,
            description=r.description,
            max_score=r.max_score,
            period_id=r.period_id,
            due_date=r.due_date.isoformat() if r.due_date else None,
            submissions_count=r.submissions_count
        )
        for r in results
    ]


@router.get("/student/{student_id}", response_model=List[StudentActivityResponse])
def get_student_activities(student_id: int, period_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    """
    Obtener todas las actividades con el estado de entrega del alumno.
    Devuelve actividades pendientes y entregadas, ordenadas por prioridad
    (pendientes próximas a vencer primero, luego entregadas).
    """
    # Query all activities with their period name and the student's submission (if any)
    query = db.query(
        Activity,
        Period.name.label("period_name"),
        Submission
    ).join(
        Period, Period.id == Activity.period_id
    ).outerjoin(
        Submission, and_(
            Submission.activity_id == Activity.id,
            Submission.student_id == student_id
        )
    )

    if period_id is not None:
        query = query.filter(Activity.period_id == period_id)

    results = query.all()

    activities = []
    for activity, period_name, submission in results:
        if submission:
            status = "graded" if submission.score is not None else "submitted"
            score = submission.score
            feedback = submission.feedback
            submitted_at = submission.submitted_at.isoformat() if submission.submitted_at else None
        else:
            status = "pending"
            score = None
            feedback = None
            submitted_at = None

        activities.append(StudentActivityResponse(
            id=activity.id,
            title=activity.title,
            description=activity.description,
            max_score=activity.max_score,
            period_id=activity.period_id,
            period_name=period_name,
            due_date=activity.due_date.isoformat() if activity.due_date else None,
            status=status,
            score=score,
            feedback=feedback,
            submitted_at=submitted_at,
            submissions_count=len(activity.submissions)
        ))

    # Sort: pending first (sorted by due_date ascending, nulls last), then submitted/graded
    today = date.today()

    def sort_key(a):
        if a.status == "pending":
            if a.due_date:
                due = date.fromisoformat(a.due_date)
                days_left = (due - today).days
                return (0, days_left)  # Pending with due date: sort by urgency
            return (0, 9999)  # Pending without due date: after those with dates
        elif a.status == "submitted":
            return (1, 0)
        else:  # graded
            return (2, 0)

    activities.sort(key=sort_key)
    return activities

@router.get("/teacher-stats", response_model=dict)
def get_teacher_stats(db: Session = Depends(get_db)):
    """
    Retorna las estadísticas globales para el panel del docente.
    """
    periods_count = db.query(func.count(Period.id)).scalar()
    activities_count = db.query(func.count(Activity.id)).scalar()
    submissions_count = db.query(func.count(Submission.id)).scalar()
    
    avg_score = db.query(func.avg(Submission.score)).filter(Submission.score.isnot(None)).scalar()
    avg_score = float(avg_score) if avg_score else 0.0

    return {
        "periods_count": periods_count,
        "activities_count": activities_count,
        "submissions_count": submissions_count,
        "avg_score": round(avg_score, 1)
    }
