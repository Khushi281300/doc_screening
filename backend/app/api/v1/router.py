from fastapi import APIRouter
from .endpoints.auth import router as auth_router
from .endpoints.health import router as health_router
from .endpoints.preprocess import router as preprocess_router
from .endpoints.forensics import router as forensics_router
from .endpoints.mrz import router as mrz_router
from .endpoints.biometrics import router as biometrics_router
from .endpoints.screening import router as screening_router
from .endpoints.blacklist import router as blacklist_router
from .endpoints.analytics import router as analytics_router
from .endpoints.blockchain import router as blockchain_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(health_router, prefix="", tags=["System"])
api_router.include_router(screening_router, prefix="/scan", tags=["Screening Pipeline"])
api_router.include_router(preprocess_router, prefix="/preprocess", tags=["Preprocessing"])
api_router.include_router(forensics_router, prefix="/forensics", tags=["Forensics"])
api_router.include_router(mrz_router, prefix="/mrz", tags=["MRZ & OCR"])
api_router.include_router(biometrics_router, prefix="/biometrics", tags=["Biometrics"])
api_router.include_router(blacklist_router, prefix="/blacklist", tags=["Watchlist"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(blockchain_router, prefix="/blockchain", tags=["Blockchain & Ledger"])
