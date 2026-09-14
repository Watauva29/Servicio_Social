from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.models.base import Base

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    max_score = Column(Float, nullable=False, default=10.0)
    due_date = Column(Date, nullable=True)
    period_id = Column(Integer, ForeignKey("periods.id", ondelete="CASCADE"), nullable=False)

    # Relaciones
    period = relationship("Period", back_populates="activities")
    submissions = relationship("Submission", back_populates="activity", cascade="all, delete-orphan")

