from fastapi import APIRouter
import time
from ....core.config import settings

router = APIRouter()


@router.get("/health", tags=["System"])
async def get_health_status():
    return {
        "status": "ONLINE",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": time.time(),
        "services": {
            "encrypted_vault": "ACTIVE",
            "custody_chain": "ACTIVE",
            "forensic_screening": "ACTIVE",
            "bsa_certificates": "ACTIVE",
            "redaction_engine": "ACTIVE",
        },
    }
