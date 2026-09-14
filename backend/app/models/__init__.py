from app.models.base import Base
from app.models.user import User, UserRole
from app.models.period import Period
from app.models.activity import Activity
from app.models.submission import Submission
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.models.schedule import ScheduleItem
from app.models.message import Message
from app.models.settings import GlobalSettings

# Esto expone todos los modelos bajo app.models
__all__ = [
    "Base", 
    "User", 
    "UserRole", 
    "Period", 
    "Activity", 
    "Submission", 
    "AttendanceSession", 
    "AttendanceRecord", 
    "ScheduleItem",
    "Message",
    "GlobalSettings"
]
