from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database import get_db
from app.models.user import User
from app.api.endpoints.auth import UserResponse
from app.services.storage import storage_service

router = APIRouter()

@router.get("", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    """
    Retorna la lista de todos los usuarios (administradores, docentes, asistentes y alumnos).
    """
    return db.query(User).all()

@router.post("/{user_id}/photo", response_model=UserResponse)
def upload_photo(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Sube y actualiza la fotografía de perfil del usuario.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")

    # Generar un nombre único para la imagen
    extension = file.filename.split(".")[-1]
    unique_filename = f"user_{user_id}_{uuid.uuid4().hex[:8]}.{extension}"
    
    # Usar el servicio de almacenamiento (MVP local, preparado para S3)
    file_url = storage_service.save_file(file, unique_filename)
    
    # Actualizar la base de datos
    user.photo_url = file_url
    db.commit()
    db.refresh(user)
    
    return user

from pydantic import BaseModel

class UserUpdate(BaseModel):
    role: str
    group_name: str = None

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user.role = user_update.role
    user.group_name = user_update.group_name
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    db.delete(user)
    db.commit()
    return {"detail": "Usuario eliminado correctamente"}
