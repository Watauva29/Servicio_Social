import enum
from sqlalchemy import Column, Integer, String, Enum
from sqlalchemy.orm import relationship
from app.models.base import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    ASSISTANT = "assistant"
    STUDENT = "student"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    group_name = Column(String, nullable=True)  # Asociado sólo a Alumnos (ej. 'Grupo A', 'Grupo B')
    photo_url = Column(String, nullable=True)   # Foto de perfil
    reset_token = Column(String, nullable=True) # Token para recuperar contraseña

    # Relación de un estudiante con sus entregas
    submissions = relationship("Submission", back_populates="student", cascade="all, delete-orphan")
