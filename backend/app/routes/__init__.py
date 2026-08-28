"""
Routes package - exports all route modules.
"""

from app.routes.admin import router as admin_router
from app.routes.auth import router as auth_router
from app.routes.faculty import router as faculty_router
from app.routes.requests import router as requests_router
from app.routes.student import router as student_router

__all__ = [
    "auth_router",
    "student_router",
    "faculty_router",
    "requests_router",
    "admin_router",
]