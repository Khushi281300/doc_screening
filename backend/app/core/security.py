from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from passlib.context import CryptContext
from jose import jwt, JWTError
from .config import settings

# Password hashing with bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(plain: str) -> str:
    """Hashes plain-text password using bcrypt (max 72 bytes safe truncate)."""
    if not plain:
        raise ValueError("Password cannot be empty")
    return pwd_context.hash(plain[:72])

def verify_password(plain: str, hashed: str) -> bool:
    """Verifies a plain-text password against a bcrypt hash."""
    if not plain or not hashed:
        return False
    try:
        return pwd_context.verify(plain[:72], hashed)
    except Exception:
        return False

def create_access_token(data: dict, expires_minutes: Optional[int] = None) -> str:
    """
    Creates an offline JWT access token with 8-hour shift expiry by default.
    """
    to_encode = data.copy()
    expire_delta = expires_minutes if expires_minutes is not None else settings.ACCESS_TOKEN_EXPIRE_MINUTES
    expire = datetime.now(timezone.utc) + timedelta(minutes=expire_delta)
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    })
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and verifies a JWT token. Returns payload dict or None if invalid/expired.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
