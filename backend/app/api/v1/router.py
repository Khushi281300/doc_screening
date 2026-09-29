from fastapi import APIRouter
from .endpoints.auth import router as auth_router
from .endpoints.health import router as health_router
from .endpoints.cases import router as cases_router
from .endpoints.audit import router as audit_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(health_router, prefix="", tags=["System"])
api_router.include_router(cases_router, prefix="/cases", tags=["Cases & Documents"])
api_router.include_router(audit_router, prefix="/audit", tags=["Audit Trail"])
