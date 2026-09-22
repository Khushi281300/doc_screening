import hashlib
import hmac
import json
import time
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

# =========================================================
# Document Forensics & Cryptographic Seal Helpers
# =========================================================

def hash_document_payload(payload: Dict[str, Any]) -> str:
    """Computes a deterministic SHA-256 hash of document metadata."""
    serialized = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

def generate_tamper_seal(doc_number: str, outcome: str, timestamp: float) -> str:
    """Generates an HMAC-SHA256 digital tamper seal for audit certificates."""
    message = f"{doc_number}:{outcome}:{timestamp}"
    return hmac.new(
        settings.SECRET_SALT.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

def mask_pii_string(value: Optional[str], visible_chars: int = 2) -> str:
    """Masks sensitive PII string for DPDP Act compliance (e.g. PASSPORT# -> PA*****45)."""
    if not value or len(value) <= (visible_chars * 2):
        return "****"
    return f"{value[:visible_chars]}{'*' * (len(value) - visible_chars * 2)}{value[-visible_chars:]}"

def anonymize_inspection_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """Produces a DPDP-compliant sanitized record for public analytics & logging."""
    sanitized = record.copy()
    if "document_number" in sanitized:
        sanitized["document_number_masked"] = mask_pii_string(sanitized["document_number"])
        del sanitized["document_number"]
    if "full_name" in sanitized:
        sanitized["full_name_masked"] = mask_pii_string(sanitized["full_name"], visible_chars=1)
        del sanitized["full_name"]
    return sanitized
