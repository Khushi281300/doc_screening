from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from ....db.models import SessionLocal, BlacklistEntry
from ....db.vector_store import face_vector_store
from ....models.officer import Officer
from ....core.dependencies import get_db, get_current_officer, require_admin

router = APIRouter()

class BlacklistAddRequest(BaseModel):
    document_number: str
    holder_name: str
    reason: str
    severity: str = "HIGH"

@router.get("/watchlist", tags=["Watchlist"])
async def get_watchlist(
    db: Session = Depends(get_db),
    officer: Officer = Depends(get_current_officer)
):
    entries = db.query(BlacklistEntry).filter(BlacklistEntry.active == True).all()
    return {
        "status": "SUCCESS",
        "total": len(entries),
        "watchlist": [
            {
                "id": e.id,
                "document_number": e.document_number,
                "holder_name": e.holder_name,
                "reason": e.reason,
                "severity": e.severity,
                "listed_date": e.listed_date.isoformat() if e.listed_date else None
            }
            for e in entries
        ]
    }

@router.post("/watchlist/add", tags=["Watchlist"])
async def add_to_watchlist(
    req: BlacklistAddRequest, 
    db: Session = Depends(get_db),
    admin: Officer = Depends(require_admin)
):
    """Admin-only endpoint to register a new identity on the watchlist."""
    existing = db.query(BlacklistEntry).filter(BlacklistEntry.document_number == req.document_number.upper()).first()
    if existing:
        existing.reason = req.reason
        existing.severity = req.severity
        existing.active = True
        db.commit()
        return {"status": "SUCCESS", "message": "Updated existing watchlist entry"}
    
    new_entry = BlacklistEntry(
        document_number=req.document_number.upper(),
        holder_name=req.holder_name.upper(),
        reason=req.reason,
        severity=req.severity,
        active=True
    )
    db.add(new_entry)
    db.commit()
    return {"status": "SUCCESS", "message": "Added to watchlist"}

@router.delete("/watchlist/{document_number}", tags=["Watchlist"])
async def remove_from_watchlist(
    document_number: str, 
    db: Session = Depends(get_db),
    admin: Officer = Depends(require_admin)
):
    """Admin-only endpoint to deactivate a watchlist entry."""
    entry = db.query(BlacklistEntry).filter(BlacklistEntry.document_number == document_number.upper()).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    entry.active = False
    db.commit()
    return {"status": "SUCCESS", "message": "Deactivated entry"}
