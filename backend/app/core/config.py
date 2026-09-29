import os
import warnings
from typing import List
from pydantic import BaseModel

DEFAULT_DEV_SECRET = "DEV_ONLY_INSECURE_SECRET_KEY_CHANGE_IN_PRODUCTION_2026"


class Settings(BaseModel):
    PROJECT_NAME: str = "CHRONICLE - Secure Digital Document Management System (NCRB / MHA)"
    VERSION: str = "3.0.0"
    API_V1_STR: str = "/api/v1"

    CORS_ORIGINS: List[str] = [
        o.strip()
        for o in os.getenv(
            "CORS_ORIGINS",
            "*"
        ).split(",")
        if o.strip()
    ]

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./chronicle.db")
    VAULT_DIR: str = os.getenv("VAULT_DIR", "./case_vault")
    MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "25"))

    SECRET_KEY: str = os.getenv("SECRET_KEY", DEFAULT_DEV_SECRET)
    SECRET_SALT: str = os.getenv("SECRET_SALT", "CHRONICLE_CUSTODY_HMAC_SALT_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

    # Statutory clock (Sec 193 BNSS): warn when this many days remain
    DEADLINE_WARNING_DAYS: int = 10


settings = Settings()

if settings.SECRET_KEY == DEFAULT_DEV_SECRET:
    warnings.warn("Using default dev-only SECRET_KEY. Set SECRET_KEY in backend/.env for real deployments.",
                  UserWarning, stacklevel=2)
