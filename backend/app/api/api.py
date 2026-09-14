from fastapi import APIRouter
from app.api.endpoints import portfolio, attendance, schedule, auth, submissions, users, activities, periods, messages, settings

api_router = APIRouter()
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["Portfolio"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
api_router.include_router(schedule.router, prefix="/schedule", tags=["Schedule"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(submissions.router, prefix="/submissions", tags=["Submissions"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(activities.router, prefix="/activities", tags=["Activities"])
api_router.include_router(periods.router, prefix="/periods", tags=["Periods"])
api_router.include_router(messages.router, prefix="/messages", tags=["Messages"])
api_router.include_router(settings.router, prefix="/settings", tags=["Settings"])
