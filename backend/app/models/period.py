from sqlalchemy import Column, Integer, String, Text, Date
from sqlalchemy.orm import relationship
from app.models.base import Base

class Period(Base):
    __tablename__ = "periods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # ej. "Periodo 1", "Competencia A"
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)

    # Relación de un periodo con sus actividades
    activities = relationship("Activity", back_populates="period", cascade="all, delete-orphan")
