from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User, UserRole
from app.models.attendance import AttendanceSession, AttendanceRecord

router = APIRouter()

# --- Pydantic Schemas ---
class AttendanceRecordCreate(BaseModel):
    student_id: int
    status: str  # 'presente', 'falta', 'retardo', 'justificado'

class AttendanceSessionCreate(BaseModel):
    group_name: str
    date: date
    records: List[AttendanceRecordCreate]

class StudentResponse(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True

class AttendanceRecordResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    status: str

    class Config:
        from_attributes = True

class AttendanceSessionResponse(BaseModel):
    id: int
    group_name: str
    date: date
    teacher_id: int

    class Config:
        from_attributes = True

class AttendanceSessionDetailResponse(BaseModel):
    id: int
    group_name: str
    date: date
    teacher_id: int
    records: List[AttendanceRecordResponse]

    class Config:
        from_attributes = True


# --- Endpoints ---

@router.get("/students", response_model=List[StudentResponse])
def get_students(db: Session = Depends(get_db)):
    """
    Obtiene la lista de todos los estudiantes registrados para pasar asistencia.
    """
    students = db.query(User).filter(User.role == UserRole.STUDENT).all()
    return students


@router.post("/session", response_model=AttendanceSessionResponse, status_code=status.HTTP_201_CREATED)
def create_attendance_session(
    payload: AttendanceSessionCreate, 
    db: Session = Depends(get_db)
):
    """
    Crea una sesión de asistencia con la fecha, grupo y el estado de cada estudiante.
    """
    # Usamos teacher_id = 1 por defecto (Dr. Alejandro Pérez)
    teacher = db.query(User).filter(User.role == UserRole.TEACHER).first()
    teacher_id = teacher.id if teacher else 1

    # Crear la sesión
    session = AttendanceSession(
        group_name=payload.group_name,
        date=payload.date,
        teacher_id=teacher_id
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Crear los registros de asistencia para cada estudiante
    for record_in in payload.records:
        # Verificar que el estudiante existe
        student_exists = db.query(User).filter(User.id == record_in.student_id, User.role == UserRole.STUDENT).first()
        if not student_exists:
            continue
        
        record = AttendanceRecord(
            session_id=session.id,
            student_id=record_in.student_id,
            status=record_in.status
        )
        db.add(record)
    
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions", response_model=List[AttendanceSessionResponse])
def get_attendance_sessions(db: Session = Depends(get_db)):
    """
    Retorna la lista de todas las sesiones de asistencia tomadas.
    """
    # Ordenar por fecha descendente
    return db.query(AttendanceSession).order_by(AttendanceSession.date.desc(), AttendanceSession.id.desc()).all()


@router.get("/session/{session_id}", response_model=AttendanceSessionDetailResponse)
def get_attendance_session_detail(session_id: int, db: Session = Depends(get_db)):
    """
    Obtiene el detalle de una sesión de asistencia específica y sus alumnos correspondientes.
    """
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sesión de asistencia con ID {session_id} no encontrada."
        )
    
    # Mapear los registros
    records_response = []
    for r in session.records:
        records_response.append(
            AttendanceRecordResponse(
                id=r.id,
                student_id=r.student_id,
                student_name=r.student.name if r.student else "Estudiante Desconocido",
                status=r.status
            )
        )
    
    return AttendanceSessionDetailResponse(
        id=session.id,
        group_name=session.group_name,
        date=session.date,
        teacher_id=session.teacher_id,
        records=records_response
    )
