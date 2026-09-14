from datetime import date as datetime_date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User, UserRole
from app.models.schedule import ScheduleItem

router = APIRouter()

# --- Pydantic Schemas ---
class ScheduleItemCreate(BaseModel):
    title: str
    type: str  # 'class' o 'meeting'
    day_of_week: Optional[str] = None  # 'Lunes', 'Martes', etc.
    date: Optional[datetime_date] = None
    start_time: str  # 'HH:MM'
    end_time: str  # 'HH:MM'
    location: Optional[str] = None

class ScheduleItemResponse(BaseModel):
    id: int
    teacher_id: int
    title: str
    type: str
    day_of_week: Optional[str] = None
    date: Optional[datetime_date] = None
    start_time: str
    end_time: str
    location: Optional[str] = None

    class Config:
        from_attributes = True


# --- Endpoints ---

@router.get("", response_model=List[ScheduleItemResponse])
def get_schedule(
    db: Session = Depends(get_db),
    current_user_id: Optional[int] = None
):
    """
    Obtiene todos los elementos del horario. Si es alumno, se filtran las clases de su grupo y se omiten juntas.
    """
    if current_user_id:
        user = db.query(User).filter(User.id == current_user_id).first()
        if user and user.role == UserRole.STUDENT:
            if not user.group_name:
                return []
            # Alumnos solo ven clases que coinciden con su grupo y no ven juntas
            return db.query(ScheduleItem).filter(
                ScheduleItem.type == "class",
                ScheduleItem.title.ilike(f"%{user.group_name}%")
            ).all()

    # Administradores, Docentes y Asistentes ven todo el horario
    return db.query(ScheduleItem).all()


@router.post("", response_model=ScheduleItemResponse, status_code=status.HTTP_201_CREATED)
def create_schedule_item(
    payload: ScheduleItemCreate, 
    db: Session = Depends(get_db)
):
    """
    Registra una nueva clase recurrente o una junta en el horario.
    """
    # Validaciones básicas
    if payload.type not in ["class", "meeting"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El tipo de evento debe ser 'class' o 'meeting'."
        )
    
    if payload.type == "class" and not payload.day_of_week:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Para clases recurrentes, se requiere especificar el día de la semana ('day_of_week')."
        )
        
    if payload.type == "meeting" and not payload.date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Para juntas o eventos específicos, se requiere definir la fecha ('date')."
        )

    # Buscar el docente por defecto (id=1 o Dr. Alejandro Pérez)
    teacher = db.query(User).filter(User.role == UserRole.TEACHER).first()
    teacher_id = teacher.id if teacher else 1

    item = ScheduleItem(
        teacher_id=teacher_id,
        title=payload.title,
        type=payload.type,
        day_of_week=payload.day_of_week if payload.type == "class" else None,
        date=payload.date if payload.type == "meeting" else None,
        start_time=payload.start_time,
        end_time=payload.end_time,
        location=payload.location
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule_item(item_id: int, db: Session = Depends(get_db)):
    """
    Elimina un elemento específico de los horarios del docente.
    """
    item = db.query(ScheduleItem).filter(ScheduleItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Elemento del horario con ID {item_id} no encontrado."
        )
    db.delete(item)
    db.commit()
    return
