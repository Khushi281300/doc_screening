import time
import base64
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from ....db.models import SessionLocal, DocumentScan
from ....models.officer import Officer
from ....core.dependencies import get_db, get_current_officer
from ....services.agent.border_agent import run_screening_agent
from ....services.ai.local_llm import copilot_chat, get_llm_health
from ....services.blockchain import audit_ledger
from ....utils.image_converter import base64_to_cv2

router = APIRouter()

class FullInspectionRequest(BaseModel):
    document_image_base64: str
    live_face_base64: Optional[str] = None
    mrz_lines: Optional[List[str]] = None
    officer_id: Optional[str] = None
    checkpoint_id: Optional[str] = None

class CopilotChatRequest(BaseModel):
    scan_data: Dict[str, Any]
    query: str
    history: Optional[List[Dict[str, str]]] = None

class HITLOverrideRequest(BaseModel):
    scan_id: str
    officer_id: Optional[str] = None
    badge_id: Optional[str] = None
    override_decision: str  # "OFFICER_APPROVED" or "OFFICER_REJECTED"
    justification: str
    physical_checklist: Dict[str, bool]

@router.post("/inspect-full", tags=["Screening Pipeline"])
async def run_full_document_inspection(
    req: FullInspectionRequest, 
    db: Session = Depends(get_db),
    officer: Officer = Depends(get_current_officer)
):
    """
    Executes autonomous ReAct border screening agent pipeline.
    Runs real OCR, classical signal forensics, facial biometrics, ICAO checksums,
    local GenAI dossier briefing, and Merkle blockchain recording.
    All scans are cryptographically anchored to the authenticated officer's badge_id.
    """
    try:
        # Decode document image
        doc_img = base64_to_cv2(req.document_image_base64)
        if doc_img is None:
            raise HTTPException(status_code=400, detail="Invalid document image payload")

        raw_b64 = req.document_image_base64.split(",")[1] if "," in req.document_image_base64 else req.document_image_base64
        raw_bytes = base64.b64decode(raw_b64)

        # Decode live camera face if present
        live_img = None
        if req.live_face_base64 and len(req.live_face_base64) > 100:
            live_img = base64_to_cv2(req.live_face_base64)

        # Execute Autonomous Screening Agent tied to authenticated officer session
        agent_result = run_screening_agent(
            doc_img=doc_img,
            live_face_img=live_img,
            raw_bytes=raw_bytes,
            mrz_override=req.mrz_lines,
            officer_id=officer.badge_id,
            checkpoint_id=officer.checkpoint_id,
            db=db,
            officer_name=officer.name
        )

        return agent_result

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/copilot-chat", tags=["Officer Copilot & HITL"])
async def copilot_chat_endpoint(
    req: CopilotChatRequest,
    officer: Officer = Depends(get_current_officer)
):
    """
    Interactive AI Border Officer Copilot.
    Answers technical inquiries regarding active scan forensic flags,
    ICAO math, biometric similarities, and physical inspection directives.
    """
    try:
        reply = copilot_chat(
            scan_data=req.scan_data,
            officer_query=req.query,
            history=req.history
        )
        return {
            "status": "SUCCESS",
            "reply": reply
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/llm-status", tags=["Officer Copilot & HITL"])
async def get_llm_status_endpoint():
    """
    Returns the real-time operational status of the local Ollama LLM service,
    installed models, and fallback mode.
    """
    health = get_llm_health()
    return {
        "status": "SUCCESS",
        "llm": health
    }

@router.post("/hitl-override", tags=["Officer Copilot & HITL"])
async def submit_hitl_override(
    req: HITLOverrideRequest, 
    db: Session = Depends(get_db),
    officer: Officer = Depends(get_current_officer)
):
    """
    Records Human-in-the-Loop officer override decision with physical countermeasure
    checklist (UV, tactile, watermark) and seals the decision into the blockchain ledger.
    Officer credentials are pulled directly from the authenticated session.
    """
    try:
        # Find scan in database
        scan = db.query(DocumentScan).filter(DocumentScan.scan_id == req.scan_id).first()
        if not scan:
            raise HTTPException(status_code=404, detail="Scan record not found")

        # Update scan record
        old_outcome = scan.outcome
        scan.outcome = "VERIFIED" if req.override_decision == "OFFICER_APPROVED" else "REJECTED"
        scan.officer_id = officer.badge_id
        scan.officer_name = officer.name

        # Record override event on blockchain with authenticated officer credentials
        audit_event = audit_ledger.record_verification_event(
            scan_id=req.scan_id,
            doc_number=scan.document_number,
            outcome=scan.outcome,
            risk_score=scan.overall_risk_score,
            officer_id=officer.badge_id,
            officer_name=officer.name,
            checkpoint_id=officer.checkpoint_id
        )

        db.commit()

        return {
            "status": "SUCCESS",
            "scan_id": req.scan_id,
            "previous_outcome": old_outcome,
            "final_outcome": scan.outcome,
            "officer_badge": officer.badge_id,
            "officer_name": officer.name,
            "checkpoint_id": officer.checkpoint_id,
            "justification": req.justification,
            "physical_checklist": req.physical_checklist,
            "blockchain_seal": {
                "block_index": audit_event["block_index"],
                "block_hash": audit_event["block_hash"],
                "merkle_root": audit_event["merkle_root"],
                "digital_signature": audit_event["digital_signature"]
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/review-queue", tags=["Officer Copilot & HITL"])
async def get_manual_review_queue(
    db: Session = Depends(get_db),
    officer: Officer = Depends(get_current_officer)
):
    """
    Fetches documents currently awaiting secondary inspection review.
    """
    try:
        pending_scans = db.query(DocumentScan).filter(
            DocumentScan.outcome == "MANUAL_REVIEW"
        ).order_by(DocumentScan.timestamp.desc()).limit(20).all()

        queue_items = [
            {
                "scan_id": s.scan_id,
                "timestamp": s.timestamp.isoformat() if s.timestamp else "",
                "officer_id": s.officer_id,
                "officer_name": s.officer_name,
                "document_number": s.document_number,
                "holder_name": s.holder_name,
                "nationality": s.nationality,
                "risk_score": s.overall_risk_score,
                "confidence_score": s.confidence_score,
                "outcome": s.outcome
            }
            for s in pending_scans
        ]
        return {
            "status": "SUCCESS",
            "count": len(queue_items),
            "queue": queue_items
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
