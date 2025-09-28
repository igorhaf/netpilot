"""
NetPilot System Operations - API Routes
"""

from .nginx_routes import router as nginx_router
from .ssl_routes import router as ssl_router
from .user_routes import router as user_router
from .traffic_routes import router as traffic_router
from .system_routes import router as system_router

__all__ = [
    "nginx_router",
    "ssl_router",
    "user_router",
    "traffic_router",
    "system_router"
]