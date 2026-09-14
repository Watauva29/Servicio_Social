from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String, nullable=False)  # Ruta al archivo PDF
    score = Column(Float, nullable=True)         # Calificación numérica
    feedback = Column(Text, nullable=True)       # Retroalimentación del docente
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relaciones
    student = relationship("User", back_populates="submissions")
    activity = relationship("Activity", back_populates="submissions")
