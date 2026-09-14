from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.database import get_db
from app.models.period import Period
from app.models.activity import Activity
from app.models.submission import Submission

router = APIRouter()

class PeriodResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    activities_count: int
    progress: int
    status: str

    class Config:
        from_attributes = True

@router.get("", response_model=List[PeriodResponse])
def get_periods(student_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    """
    Obtener todas las competencias (periodos) con el conteo de actividades y,
    si se proporciona student_id, el progreso porcentual y estado real del alumno.
    """
    periods = db.query(Period).order_by(Period.id).all()
    response = []
    
    for p in periods:
        # Contar total de actividades del periodo
        activities_count = db.query(Activity).filter(Activity.period_id == p.id).count()
        
        # Calcular progreso si hay student_id
        progress = 0
        if student_id is not None and activities_count > 0:
            # Obtener cantidad de actividades en este periodo que tienen submissions del estudiante
            submitted_count = db.query(Submission.activity_id).join(Activity).filter(
                Activity.period_id == p.id,
                Submission.student_id == student_id
            ).distinct().count()
            
            progress = int((submitted_count / activities_count) * 100)
            
        # Determinar estado
        if activities_count == 0:
            status = "Próximo"
        elif progress == 100:
            status = "Completado"
        elif progress > 0:
            status = "En curso"
        else:
            status = "Próximo"
            
        response.append(PeriodResponse(
            id=p.id,
            name=p.name,
            description=p.description,
            start_date=p.start_date.isoformat() if p.start_date else None,
            end_date=p.end_date.isoformat() if p.end_date else None,
            activities_count=activities_count,
            progress=progress,
            status=status
        ))
        
    return response
