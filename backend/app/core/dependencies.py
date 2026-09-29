from typing import Optional, Iterable
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .config import settings
from .security import decode_access_token
from ..db.models import SessionLocal
from ..models.officer import Officer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_current_officer(token: Optional[str] = Depends(oauth2_scheme),
                              db: Session = Depends(get_db)) -> Officer:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    payload = decode_access_token(token)
    if payload is None or not payload.get("sub"):
        raise credentials_exception
    officer = db.query(Officer).filter(Officer.badge_id == payload["sub"]).first()
    if officer is None:
        raise credentials_exception
    return officer


def require_roles(*roles: str):
    """Dependency factory: only the listed roles may call the endpoint."""
    allowed = set(roles)

    async def _guard(officer: Officer = Depends(get_current_officer)) -> Officer:
        if officer.role_value not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail=f"Requires role: {', '.join(sorted(allowed))}")
        return officer
    return _guard
