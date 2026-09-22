from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any
from sqlalchemy.orm import Session

from ....core.security import verify_password, create_access_token
from ....core.dependencies import get_db, get_current_officer
from ....models.officer import Officer

router = APIRouter()

class LoginRequest(BaseModel):
    badge_id: str
    password: str

class OfficerProfileResponse(BaseModel):
    badge_id: str
    name: str
    role: str
    checkpoint_id: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    officer: OfficerProfileResponse

@router.post("/login", response_model=LoginResponse, tags=["Authentication"])
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates an officer via badge ID and password.
    Returns an offline JWT access token and officer profile.
    Generic 401 error message prevents badge ID enumeration.
    """
    cleaned_badge = req.badge_id.strip().upper()
    officer = db.query(Officer).filter(Officer.badge_id == cleaned_badge).first()

    # Generic error message to prevent account/badge enumeration
    generic_auth_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid badge ID or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not officer:
        raise generic_auth_error

    if not verify_password(req.password, officer.password_hash):
        raise generic_auth_error

    role_str = officer.role.value if hasattr(officer.role, "value") else str(officer.role)
    token_data = {
        "sub": officer.badge_id,
        "name": officer.name,
        "role": role_str,
        "checkpoint_id": officer.checkpoint_id
    }
    access_token = create_access_token(data=token_data)

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        officer=OfficerProfileResponse(
            badge_id=officer.badge_id,
            name=officer.name,
            role=role_str,
            checkpoint_id=officer.checkpoint_id
        )
    )

@router.get("/me", response_model=OfficerProfileResponse, tags=["Authentication"])
async def get_my_profile(officer: Officer = Depends(get_current_officer)):
    """
    Returns the authenticated officer's profile extracted from the validated JWT session.
    """
    role_str = officer.role.value if hasattr(officer.role, "value") else str(officer.role)
    return OfficerProfileResponse(
        badge_id=officer.badge_id,
        name=officer.name,
        role=role_str,
        checkpoint_id=officer.checkpoint_id
    )

@router.post("/logout", tags=["Authentication"])
async def logout():
    """
    Stateless JWT Logout Endpoint.
    Since authentication uses self-contained stateless JSON Web Tokens without a
    centralized session store or cloud provider, token invalidation occurs on the
    client side by purging the stored token from memory/localStorage. This endpoint
    provides a consistent handshake for frontend state cleanup.
    """
    return {
        "status": "SUCCESS",
        "message": "Session terminated successfully. Purge token from client storage."
    }
