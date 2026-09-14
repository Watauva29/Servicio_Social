from sqlalchemy import Column, Integer, String, Text
from app.models.base import Base

class GlobalSettings(Base):
    __tablename__ = "global_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(String, nullable=False)
    description = Column(Text, nullable=True)
