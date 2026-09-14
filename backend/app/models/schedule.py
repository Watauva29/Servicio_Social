from sqlalchemy import Column, Integer, String, Date, ForeignKey
from app.models.base import Base

class ScheduleItem(Base):
    __tablename__ = "schedule_items"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    type = Column(String, nullable=False)  # 'class' o 'meeting'
    day_of_week = Column(String, nullable=True)  # 'Lunes', 'Martes', etc. (para clases recurrentes)
    date = Column(Date, nullable=True)  # para juntas específicas
    start_time = Column(String, nullable=False)  # 'HH:MM'
    end_time = Column(String, nullable=False)  # 'HH:MM'
    location = Column(String, nullable=True)  # 'Aula 104', 'Zoom', etc.
