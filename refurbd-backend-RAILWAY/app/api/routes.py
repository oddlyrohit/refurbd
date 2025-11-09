from fastapi import APIRouter
from app.api.routes.auth import router as auth_router
from app.api.routes.projects import router as projects_router
from app.api.routes.renderings import router as renderings_router
from app.api.routes.billing import router as billing_router
from app.api.routes.admin import router as admin_router
from app.api.routes.websockets import router as websockets_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(projects_router)
router.include_router(renderings_router)
router.include_router(billing_router)
router.include_router(admin_router)
router.include_router(websockets_router)
