from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .config import settings
from .security import decode_access_token
from ..db.models import SessionLocal
from ..models.officer import Officer, OfficerRole

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_officer(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Officer:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    badge_id: Optional[str] = payload.get("sub")
    if not badge_id:
        raise credentials_exception

    officer = db.query(Officer).filter(Officer.badge_id == badge_id).first()
    if officer is None:
        raise credentials_exception

    return officer

async def require_admin(
    officer: Officer = Depends(get_current_officer)
) -> Officer:
    role_val = officer.role.value if hasattr(officer.role, "value") else str(officer.role)
    if role_val != "ADMIN" and role_val != OfficerRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative clearance required"
        )
    return officer
