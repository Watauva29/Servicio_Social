from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid

from app.database import get_db
from app.models.user import User, UserRole

router = APIRouter()

# --- Schemas ---
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole
    group_name: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    group_name: Optional[str] = None
    photo_url: Optional[str] = None

    class Config:
        from_attributes = True


# --- Endpoints ---
@router.post("/login", response_model=UserResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Verifica las credenciales del usuario y retorna su perfil con rol y grupo asignado.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    
    if not user or user.password_hash != payload.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos."
        )
    
    return user

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """
    Registra un nuevo usuario en la plataforma.
    """
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado."
        )
    
    new_user = User(
        name=payload.name,
        email=payload.email,
        password_hash=payload.password, # Hash should be done in real app
        role=payload.role,
        group_name=payload.group_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Genera un token temporal para recuperar la contraseña y lo envía por email (simulado).
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Prevent email enumeration
        return {"message": "Si el correo está registrado, se han enviado las instrucciones de recuperación."}
    
    # Generate token
    token = str(uuid.uuid4())
    user.reset_token = token
    db.commit()
    
    # Simulate sending email
    print(f"\n{'='*50}\n[EMAIL SIMULADO] Recuperación de contraseña\nPara: {user.email}\nToken: {token}\n{'='*50}\n")
    
    return {"message": "Si el correo está registrado, se han enviado las instrucciones de recuperación."}

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Actualiza la contraseña de un usuario usando un token de recuperación.
    """
    user = db.query(User).filter(User.reset_token == payload.token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido o expirado."
        )
    
    user.password_hash = payload.new_password
    user.reset_token = None
    db.commit()
    
    return {"message": "Contraseña actualizada exitosamente."}
