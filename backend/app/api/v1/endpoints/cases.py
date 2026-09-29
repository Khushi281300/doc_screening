import io
import json
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ....core.config import settings
from ....core.dependencies import get_current_officer, get_db, require_roles
from ....models.officer import Officer
from ....db.models import Case, LegalDocument, ChainOfCustodyLog, BSACertificate
from ....services.vault import vault
from ....services.custody import append_custody_entry, verify_case_chain, genesis_root
from ....services.text_extract import extract_text
from ....services.forensics import screen_evidence_image
from ....services.forensics.screening import is_image
from ....services.privacy.redaction import victim_redactor
from ....services.compliance.bsa_certificate import bsa_generator

router = APIRouter()

IO, SHO, FSL, PP, MAG = ("INVESTIGATING_OFFICER", "STATION_HOUSE_OFFICER", "FSL_EXAMINER",
                         "PUBLIC_PROSECUTOR", "MAGISTRATE")
POLICE = (IO, SHO)

DOC_TYPES = ["FIR", "CASE_DIARY", "WITNESS_STATEMENT", "SEIZURE_MEMO", "EVIDENCE_EXHIBIT",
             "FORENSIC_REPORT", "CHARGE_SHEET", "LEGAL_NOTICE", "COURT_ORDER", "JUDGMENT"]

# Which roles may upload which document types
UPLOAD_RIGHTS = {
    IO:  {"FIR", "CASE_DIARY", "WITNESS_STATEMENT", "SEIZURE_MEMO", "EVIDENCE_EXHIBIT", "CHARGE_SHEET"},
    SHO: {"FIR", "CASE_DIARY", "WITNESS_STATEMENT", "SEIZURE_MEMO", "EVIDENCE_EXHIBIT", "CHARGE_SHEET", "LEGAL_NOTICE"},
    FSL: {"FORENSIC_REPORT"},
    PP:  {"CHARGE_SHEET", "LEGAL_NOTICE"},
    MAG: {"COURT_ORDER", "JUDGMENT"},
}

ROLE_NAMES = {IO: "Investigating Officer", SHO: "Station House Officer", FSL: "Forensic Lab (FSL)",
              PP: "Public Prosecutor", MAG: "Court (Magistrate)"}
STATUS_NAMES = {"UNDER_INVESTIGATION": "Under investigation", "FSL_PENDING": "With forensic lab",
                "CHARGE_SHEET_DRAFTED": "Charge sheet in draft", "CHARGE_SHEET_FILED": "Filed in court",
                "IN_TRIAL": "Trial ongoing", "DISPOSED": "Closed"}

STATUSES = ["UNDER_INVESTIGATION", "FSL_PENDING", "CHARGE_SHEET_DRAFTED", "CHARGE_SHEET_FILED", "IN_TRIAL", "DISPOSED"]

# Transfer target -> (custody action, resulting status)
TRANSFERS = {
    FSL: ("TRANSFERRED_FSL", "FSL_PENDING"),
    PP:  ("TRANSFERRED_PROSECUTOR", "CHARGE_SHEET_DRAFTED"),
    MAG: ("FILED_COURT", "CHARGE_SHEET_FILED"),
}


# --------------------------------------------------------------------------- schemas
class CreateCaseRequest(BaseModel):
    fir_number: str
    police_station: str
    state: str = "Delhi"
    district: str = "Central"
    incident_date: Optional[str] = None
    complainant_name: Optional[str] = None
    victim_name: Optional[str] = None
    accused_names: List[str] = []
    acts_sections: str
    statutory_deadline_days: int = 60
    is_women_safety_case: bool = True
    is_pocso_case: bool = False


class RedactionRequest(BaseModel):
    victim_name: Optional[str] = None
    extra_names: List[str] = []
    document_text: Optional[str] = None   # override; defaults to the stored extracted text


class TransferRequest(BaseModel):
    target_role: str
    note: Optional[str] = None


class StatusRequest(BaseModel):
    case_status: str
    note: Optional[str] = None


# --------------------------------------------------------------------------- helpers
def _now():
    return datetime.now(timezone.utc)


def _shared_roles(case: Case) -> List[str]:
    try:
        return json.loads(case.shared_with_roles or "[]")
    except Exception:
        return []


def _can_access(case: Case, officer: Officer) -> bool:
    return officer.role_value in POLICE or officer.role_value in _shared_roles(case)


def _get_case_or_403(db: Session, case_id: str, officer: Officer) -> Case:
    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case record not found")
    if not _can_access(case, officer):
        raise HTTPException(status_code=403, detail="This case has not been shared with your agency")
    return case


def _clock(case: Case):
    days_remaining = None
    at_risk = False
    if case.statutory_deadline_date:
        diff = (case.statutory_deadline_date.replace(tzinfo=timezone.utc) - _now()).days
        days_remaining = max(0, diff)
        if days_remaining <= settings.DEADLINE_WARNING_DAYS and case.case_status in (
                "UNDER_INVESTIGATION", "FSL_PENDING", "CHARGE_SHEET_DRAFTED"):
            at_risk = True
    return days_remaining, at_risk


def _case_summary(db: Session, case: Case) -> dict:
    days_remaining, at_risk = _clock(case)
    doc_count = db.query(LegalDocument).filter(LegalDocument.case_id == case.case_id,
                                              LegalDocument.is_current_version == True).count()
    return {
        "case_id": case.case_id,
        "fir_number": case.fir_number,
        "police_station": case.police_station,
        "state": case.state,
        "district": case.district,
        "incident_date": case.incident_date,
        "registration_date": case.registration_date.isoformat() if case.registration_date else None,
        "acts_sections": case.acts_sections,
        "case_status": case.case_status,
        "is_women_safety_case": case.is_women_safety_case,
        "is_pocso_case": case.is_pocso_case,
        "is_locked": case.is_locked,
        "investigating_officer_id": case.investigating_officer_id,
        "investigating_officer_name": case.investigating_officer_name,
        "accused_names": json.loads(case.accused_names) if case.accused_names else [],
        "victim_name_masked": case.victim_name_masked,
        "complainant_name": case.complainant_name,
        "shared_with_roles": _shared_roles(case),
        "statutory_deadline_days": case.statutory_deadline_days,
        "statutory_deadline_date": case.statutory_deadline_date.isoformat() if case.statutory_deadline_date else None,
        "days_remaining_for_chargesheet": days_remaining,
        "is_default_bail_risk": at_risk,
        "document_count": doc_count,
        "current_merkle_root": case.current_merkle_root,
    }


def _doc_dict(d: LegalDocument, include_report: bool = False) -> dict:
    out = {
        "document_id": d.document_id,
        "case_id": d.case_id,
        "doc_type": d.doc_type,
        "title": d.title,
        "description": d.description,
        "original_filename": d.original_filename,
        "mime_type": d.mime_type,
        "file_size": d.file_size,
        "file_hash_sha256": d.file_hash_sha256,
        "version": d.version,
        "supersedes_document_id": d.supersedes_document_id,
        "is_current_version": d.is_current_version,
        "has_text": bool(d.extracted_text),
        "is_redacted": d.is_redacted,
        "redaction_summary": json.loads(d.redaction_summary) if d.redaction_summary else None,
        "is_forensic_screened": d.is_forensic_screened,
        "forensic_status": d.forensic_status,
        "forensic_tamper_score": d.forensic_tamper_score,
        "uploaded_by_id": d.uploaded_by_id,
        "uploaded_by_name": d.uploaded_by_name,
        "uploaded_by_role": d.uploaded_by_role,
        "created_at": d.created_at.isoformat() if d.created_at else None,
    }
    if include_report:
        out["forensic_report"] = json.loads(d.forensic_report_json) if d.forensic_report_json else None
        out["extracted_text"] = d.extracted_text
        out["redacted_text"] = d.redacted_text
    return out


def _log_dict(log: ChainOfCustodyLog) -> dict:
    return {
        "id": log.id,
        "case_id": log.case_id,
        "action": log.action,
        "document_id": log.document_id,
        "performed_by_id": log.performed_by_id,
        "performed_by_name": log.performed_by_name,
        "performed_by_role": log.performed_by_role,
        "ip_or_device_id": log.ip_or_device_id,
        "details": log.details,
        "payload_hash": log.payload_hash,
        "previous_merkle_root": log.previous_merkle_root,
        "current_merkle_root": log.current_merkle_root,
        "digital_signature": log.digital_signature,
        "timestamp": log.timestamp.isoformat() + "Z" if log.timestamp else None,
    }


def _cert_dict(c: BSACertificate) -> dict:
    return {
        "certificate_id": c.certificate_id,
        "case_id": c.case_id,
        "document_id": c.document_id,
        "document_title": c.document_title,
        "document_sha256": c.document_sha256,
        "statutory_clause": c.statutory_clause,
        "certifying_officer_id": c.certifying_officer_id,
        "certifying_officer_name": c.certifying_officer_name,
        "certifying_officer_designation": c.certifying_officer_designation,
        "police_station": c.police_station,
        "terminal_hardware_hash": c.terminal_hardware_hash,
        "merkle_root": c.merkle_root,
        "digital_signature": c.digital_signature,
        "legal_declaration": c.legal_declaration,
        "issued_at": c.issued_at.isoformat() + "Z" if c.issued_at else None,
    }


def _next_document_id(db: Session, case: Case, doc_type: str) -> str:
    prefix = {"FIR": "FIR", "CASE_DIARY": "CD", "WITNESS_STATEMENT": "WS", "SEIZURE_MEMO": "SM",
              "EVIDENCE_EXHIBIT": "EX", "FORENSIC_REPORT": "FSL", "CHARGE_SHEET": "CS",
              "LEGAL_NOTICE": "LN", "COURT_ORDER": "CO", "JUDGMENT": "JDG"}.get(doc_type, "DOC")
    n = db.query(LegalDocument).filter(LegalDocument.case_id == case.case_id).count() + 1
    fir_short = "".join(ch for ch in case.fir_number.split("/")[0] if ch.isdigit()) or case.case_id[-5:]
    return f"DOC-{prefix}-{fir_short}-{n:02d}"


async def _ingest(db: Session, case: Case, officer: Officer, file: UploadFile, doc_type: str,
                  title: str, description: Optional[str], supersedes: Optional[LegalDocument] = None) -> LegalDocument:
    if case.is_locked and officer.role_value not in (SHO, MAG):
        raise HTTPException(status_code=423, detail="Case is locked by the SHO; no further changes allowed")
    if doc_type not in DOC_TYPES:
        raise HTTPException(status_code=400, detail=f"doc_type must be one of {DOC_TYPES}")
    if doc_type not in UPLOAD_RIGHTS.get(officer.role_value, set()):
        raise HTTPException(status_code=403, detail=f"{officer.role_value} may not upload {doc_type}")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File exceeds {settings.MAX_UPLOAD_MB} MB")

    sha = vault.sha256(data)
    dup = db.query(LegalDocument).filter(LegalDocument.file_hash_sha256 == sha,
                                        LegalDocument.case_id == case.case_id).first()
    if dup and not supersedes:
        raise HTTPException(status_code=409, detail=f"Identical file already in this case as {dup.document_id}")

    if supersedes:
        document_id = f"{supersedes.document_id.rsplit('-v', 1)[0]}-v{supersedes.version + 1}"
        version = supersedes.version + 1
        supersedes.is_current_version = False
    else:
        document_id = _next_document_id(db, case, doc_type)
        version = 1

    stored = vault.store(case.case_id, document_id, data)
    text = extract_text(data, file.content_type, file.filename)

    forensic = None
    if is_image(file.content_type, file.filename):
        forensic = screen_evidence_image(data)

    doc = LegalDocument(
        document_id=document_id, case_id=case.case_id, doc_type=doc_type, title=title,
        description=description, file_path=stored["path"], original_filename=file.filename,
        mime_type=file.content_type, file_size=len(data), file_hash_sha256=sha, version=version,
        supersedes_document_id=supersedes.document_id if supersedes else None, is_current_version=True,
        extracted_text=text,
        is_forensic_screened=forensic is not None,
        forensic_status=forensic["status"] if forensic else "NOT_APPLICABLE",
        forensic_tamper_score=forensic["tamper_score"] if forensic else 0.0,
        forensic_report_json=json.dumps(forensic) if forensic else None,
        uploaded_by_id=officer.badge_id, uploaded_by_name=officer.name, uploaded_by_role=officer.role_value,
    )
    db.add(doc)
    db.flush()

    if supersedes:
        action, details = "REVISED", f"New version ({version}) of {title} added"
    elif doc_type == "FORENSIC_REPORT":
        action, details = "FSL_REPORT_ATTACHED", f"Lab report added: {title}"
    else:
        action, details = "UPLOADED", f"File added: {title} ({file.filename})"
    if forensic and forensic["status"] != "CLEAN":
        details += " — photo shows possible signs of editing"
    append_custody_entry(db, case, action, officer, details, document_id=document_id, payload_hash=sha)
    if forensic and forensic["status"] != "CLEAN":
        append_custody_entry(db, case, "FORENSIC_FLAG", officer,
                             "Photo check: " + ("; ".join(forensic["findings"]) or "possible editing"),
                             document_id=document_id, payload_hash=sha)
    db.commit()
    db.refresh(doc)
    return doc


# --------------------------------------------------------------------------- collection endpoints
@router.get("/meta", summary="Enumerations used by the UI")
def get_meta(current_officer: Officer = Depends(get_current_officer)):
    return {
        "doc_types": DOC_TYPES,
        "statuses": STATUSES,
        "upload_rights": {k: sorted(v) for k, v in UPLOAD_RIGHTS.items()},
        "my_upload_types": sorted(UPLOAD_RIGHTS.get(current_officer.role_value, set())),
        "transfer_targets": list(TRANSFERS.keys()),
    }


@router.get("/stats", summary="Dashboard counters")
def get_stats(db: Session = Depends(get_db), current_officer: Officer = Depends(get_current_officer)):
    cases = [c for c in db.query(Case).all() if _can_access(c, current_officer)]
    ids = [c.case_id for c in cases]
    docs = db.query(LegalDocument).filter(LegalDocument.case_id.in_(ids)).all() if ids else []
    flagged = [d for d in docs if d.forensic_status in ("SUSPICIOUS", "TAMPER_DETECTED")]
    at_risk = [c for c in cases if _clock(c)[1]]
    by_status = {}
    for c in cases:
        by_status[c.case_status] = by_status.get(c.case_status, 0) + 1
    return {
        "cases_total": len(cases),
        "women_safety_cases": sum(1 for c in cases if c.is_women_safety_case),
        "deadline_at_risk": len(at_risk),
        "deadline_at_risk_cases": [_case_summary(db, c) for c in at_risk],
        "documents_total": len(docs),
        "documents_flagged": len(flagged),
        "certificates_total": db.query(BSACertificate).filter(BSACertificate.case_id.in_(ids)).count() if ids else 0,
        "custody_entries_total": db.query(ChainOfCustodyLog).filter(ChainOfCustodyLog.case_id.in_(ids)).count() if ids else 0,
        "by_status": by_status,
    }


@router.get("/search", summary="Full-text search across cases and document contents")
def search(q: str = Query(..., min_length=2), db: Session = Depends(get_db),
           current_officer: Officer = Depends(get_current_officer)):
    like = f"%{q}%"
    cases = [c for c in db.query(Case).filter(or_(
        Case.fir_number.ilike(like), Case.case_id.ilike(like), Case.police_station.ilike(like),
        Case.acts_sections.ilike(like), Case.accused_names.ilike(like), Case.district.ilike(like))).all()
        if _can_access(c, current_officer)]

    docs = db.query(LegalDocument).filter(LegalDocument.is_current_version == True, or_(
        LegalDocument.title.ilike(like), LegalDocument.description.ilike(like),
        LegalDocument.extracted_text.ilike(like), LegalDocument.document_id.ilike(like),
        LegalDocument.file_hash_sha256.ilike(like))).all()

    doc_hits = []
    for d in docs:
        case = db.query(Case).filter(Case.case_id == d.case_id).first()
        if not case or not _can_access(case, current_officer):
            continue
        snippet = None
        # Non-police agencies only ever see redacted text of women-safety cases
        text = d.extracted_text or ""
        if case.is_women_safety_case and current_officer.role_value not in POLICE + (MAG,):
            text = d.redacted_text or ""
        idx = text.lower().find(q.lower())
        if idx >= 0:
            start, end = max(0, idx - 80), min(len(text), idx + len(q) + 80)
            snippet = ("…" if start > 0 else "") + text[start:end].replace("\n", " ") + ("…" if end < len(text) else "")
        doc_hits.append({**_doc_dict(d), "fir_number": case.fir_number, "snippet": snippet})

    return {"query": q, "cases": [_case_summary(db, c) for c in cases], "documents": doc_hits}


@router.get("", summary="List cases visible to the caller, with statutory clocks")
def list_cases(status: Optional[str] = None, women_safety_only: bool = False, q: Optional[str] = None,
               db: Session = Depends(get_db), current_officer: Officer = Depends(get_current_officer)):
    query = db.query(Case)
    if status:
        query = query.filter(Case.case_status == status)
    if women_safety_only:
        query = query.filter(Case.is_women_safety_case == True)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Case.fir_number.ilike(like), Case.police_station.ilike(like),
                                 Case.acts_sections.ilike(like), Case.case_id.ilike(like)))
    cases = [c for c in query.order_by(Case.registration_date.desc()).all() if _can_access(c, current_officer)]
    return {"total": len(cases), "cases": [_case_summary(db, c) for c in cases]}


@router.post("", summary="Register a new case (FIR)")
def create_case(payload: CreateCaseRequest, db: Session = Depends(get_db),
                current_officer: Officer = Depends(require_roles(IO, SHO))):
    if db.query(Case).filter(Case.fir_number == payload.fir_number,
                             Case.police_station == payload.police_station).first():
        raise HTTPException(status_code=409, detail="A case with this FIR number already exists at this station")
    now = _now()
    seq = db.query(Case).count() + 105
    state_code = (payload.state or "XX")[:2].upper()
    case_id = f"CASE-{now.year}-{state_code}-{seq:05d}"
    from datetime import timedelta
    case = Case(
        case_id=case_id, fir_number=payload.fir_number.strip(), police_station=payload.police_station.strip(),
        state=payload.state, district=payload.district, incident_date=payload.incident_date, registration_date=now,
        complainant_name=payload.complainant_name,
        victim_name_masked="[REDACTED - SEC 72 BNS PROTECTED]" if payload.victim_name else None,
        accused_names=json.dumps(payload.accused_names), acts_sections=payload.acts_sections,
        investigating_officer_id=current_officer.badge_id, investigating_officer_name=current_officer.name,
        case_status="UNDER_INVESTIGATION", statutory_deadline_days=payload.statutory_deadline_days,
        statutory_deadline_date=now + timedelta(days=payload.statutory_deadline_days),
        is_women_safety_case=payload.is_women_safety_case, is_pocso_case=payload.is_pocso_case,
        shared_with_roles=json.dumps([IO, SHO]),
        current_merkle_root=genesis_root(case_id, payload.fir_number.strip()),
    )
    db.add(case)
    db.flush()
    append_custody_entry(db, case, "CREATED", current_officer,
                         f"Case opened for {payload.fir_number}")
    db.commit()
    return {"success": True, **_case_summary(db, case)}


# --------------------------------------------------------------------------- single case
@router.get("/{case_id}", summary="Full dossier: case, documents, custody chain, certificates")
def get_case_dossier(case_id: str, db: Session = Depends(get_db),
                     current_officer: Officer = Depends(get_current_officer)):
    case = _get_case_or_403(db, case_id, current_officer)
    documents = db.query(LegalDocument).filter(LegalDocument.case_id == case_id).order_by(
        LegalDocument.created_at.asc()).all()
    logs = db.query(ChainOfCustodyLog).filter(ChainOfCustodyLog.case_id == case_id).order_by(
        ChainOfCustodyLog.id.desc()).all()
    certs = db.query(BSACertificate).filter(BSACertificate.case_id == case_id).order_by(
        BSACertificate.issued_at.desc()).all()

    # Log the view once per officer per 15 minutes (refreshes inside the UI do not spam the chain)
    cutoff_dt = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=15)
    recently_viewed = any(l.action == "VIEWED" and l.performed_by_id == current_officer.badge_id
                          and (l.timestamp.replace(tzinfo=None) if l.timestamp else datetime.min) > cutoff_dt
                          for l in logs[:25])
    if not recently_viewed:
        entry = append_custody_entry(db, case, "VIEWED", current_officer, f"Case opened by {current_officer.name}")
        logs.insert(0, entry)
        db.commit()

    return {
        "case": _case_summary(db, case),
        "documents": [_doc_dict(d) for d in documents],
        "chain_of_custody": [_log_dict(l) for l in logs],
        "bsa_certificates": [_cert_dict(c) for c in certs],
    }


@router.get("/{case_id}/verify", summary="Recompute custody chain + re-hash every stored file")
def verify_case(case_id: str, db: Session = Depends(get_db),
                current_officer: Officer = Depends(get_current_officer)):
    case = _get_case_or_403(db, case_id, current_officer)
    result = verify_case_chain(db, case, vault)
    append_custody_entry(db, case, "VERIFIED", current_officer,
                         "Tamper check " + ("passed — no changes found" if result["chain_valid"] else f"FAILED — {len(result['problems'])} problem(s) found"))
    db.commit()
    result["head_root"] = case.current_merkle_root
    return result


@router.post("/{case_id}/transfer", summary="Share the case with FSL / Prosecutor / Court")
def transfer_case(case_id: str, payload: TransferRequest, db: Session = Depends(get_db),
                  current_officer: Officer = Depends(require_roles(IO, SHO))):
    case = _get_case_or_403(db, case_id, current_officer)
    if payload.target_role not in TRANSFERS:
        raise HTTPException(status_code=400, detail=f"target_role must be one of {list(TRANSFERS)}")
    if payload.target_role == MAG and current_officer.role_value != SHO:
        raise HTTPException(status_code=403, detail="Only the SHO can file a case before the Court")
    roles = _shared_roles(case)
    if payload.target_role not in roles:
        roles.append(payload.target_role)
    case.shared_with_roles = json.dumps(roles)
    action, new_status = TRANSFERS[payload.target_role]
    case.case_status = new_status
    if payload.target_role == MAG:
        case.is_locked = True
    append_custody_entry(db, case, action, current_officer,
                         payload.note or f"Case sent to {ROLE_NAMES[payload.target_role]}")
    db.commit()
    return {"success": True, **_case_summary(db, case)}


@router.post("/{case_id}/status", summary="Change case status (SHO; Magistrate for trial/disposal)")
def set_status(case_id: str, payload: StatusRequest, db: Session = Depends(get_db),
               current_officer: Officer = Depends(require_roles(SHO, MAG))):
    case = _get_case_or_403(db, case_id, current_officer)
    if payload.case_status not in STATUSES:
        raise HTTPException(status_code=400, detail=f"case_status must be one of {STATUSES}")
    if current_officer.role_value == MAG and payload.case_status not in ("IN_TRIAL", "DISPOSED"):
        raise HTTPException(status_code=403, detail="Court may only set IN_TRIAL or DISPOSED")
    old = case.case_status
    case.case_status = payload.case_status
    append_custody_entry(db, case, "STATUS_CHANGED", current_officer,
                         payload.note or f"Stage changed from {STATUS_NAMES.get(old, old)} to {STATUS_NAMES.get(payload.case_status, payload.case_status)}")
    db.commit()
    return {"success": True, **_case_summary(db, case)}


@router.post("/{case_id}/lock", summary="SHO locks / unlocks the case record")
def toggle_lock(case_id: str, db: Session = Depends(get_db),
                current_officer: Officer = Depends(require_roles(SHO))):
    case = _get_case_or_403(db, case_id, current_officer)
    case.is_locked = not case.is_locked
    append_custody_entry(db, case, "LOCKED" if case.is_locked else "UNLOCKED", current_officer,
                         "Case locked — no more files can be added" if case.is_locked else "Case unlocked")
    db.commit()
    return {"success": True, "is_locked": case.is_locked, "current_merkle_root": case.current_merkle_root}


# --------------------------------------------------------------------------- documents
@router.post("/{case_id}/documents", summary="Upload a document (hashed, encrypted, screened, chained)")
async def upload_document(case_id: str, file: UploadFile = File(...), doc_type: str = Form(...),
                          title: str = Form(...), description: Optional[str] = Form(None),
                          db: Session = Depends(get_db), current_officer: Officer = Depends(get_current_officer)):
    case = _get_case_or_403(db, case_id, current_officer)
    doc = await _ingest(db, case, current_officer, file, doc_type, title.strip(), description)
    return {"success": True, "document": _doc_dict(doc, include_report=True),
            "current_merkle_root": case.current_merkle_root}


@router.post("/{case_id}/documents/{document_id}/versions", summary="Upload a new version of a document")
async def upload_new_version(case_id: str, document_id: str, file: UploadFile = File(...),
                             description: Optional[str] = Form(None), db: Session = Depends(get_db),
                             current_officer: Officer = Depends(get_current_officer)):
    case = _get_case_or_403(db, case_id, current_officer)
    prev = db.query(LegalDocument).filter(LegalDocument.document_id == document_id,
                                         LegalDocument.case_id == case_id).first()
    if not prev:
        raise HTTPException(status_code=404, detail="Document not found in this case")
    if not prev.is_current_version:
        raise HTTPException(status_code=409, detail="Only the current version can be revised")
    doc = await _ingest(db, case, current_officer, file, prev.doc_type, prev.title,
                        description or prev.description, supersedes=prev)
    return {"success": True, "document": _doc_dict(doc, include_report=True),
            "current_merkle_root": case.current_merkle_root}


@router.get("/{case_id}/documents/{document_id}", summary="Document detail incl. forensic report and versions")
def get_document(case_id: str, document_id: str, db: Session = Depends(get_db),
                 current_officer: Officer = Depends(get_current_officer)):
    case = _get_case_or_403(db, case_id, current_officer)
    doc = db.query(LegalDocument).filter(LegalDocument.document_id == document_id,
                                        LegalDocument.case_id == case_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found in this case")
    out = _doc_dict(doc, include_report=True)
    # Non-police, non-court roles see only the redacted text of women-safety cases
    if case.is_women_safety_case and current_officer.role_value not in POLICE + (MAG,):
        out["extracted_text"] = doc.redacted_text or ("[Text withheld — redacted copy not yet generated]" if doc.extracted_text else None)
    # version history (walk both directions)
    base = document_id.rsplit("-v", 1)[0]
    versions = db.query(LegalDocument).filter(LegalDocument.case_id == case_id, or_(
        LegalDocument.document_id == base, LegalDocument.document_id.like(f"{base}-v%"))).order_by(
        LegalDocument.version.asc()).all()
    out["versions"] = [{"document_id": v.document_id, "version": v.version, "file_hash_sha256": v.file_hash_sha256,
                        "created_at": v.created_at.isoformat() if v.created_at else None,
                        "uploaded_by_name": v.uploaded_by_name, "is_current_version": v.is_current_version}
                       for v in versions]
    out["custody"] = [_log_dict(l) for l in db.query(ChainOfCustodyLog).filter(
        ChainOfCustodyLog.document_id == document_id).order_by(ChainOfCustodyLog.id.desc()).all()]
    return out


@router.get("/{case_id}/documents/{document_id}/download", summary="Download (decrypts from vault; logged)")
def download_document(case_id: str, document_id: str, redacted: bool = False, db: Session = Depends(get_db),
                      current_officer: Officer = Depends(get_current_officer)):
    case = _get_case_or_403(db, case_id, current_officer)
    doc = db.query(LegalDocument).filter(LegalDocument.document_id == document_id,
                                        LegalDocument.case_id == case_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found in this case")

    must_redact = case.is_women_safety_case and current_officer.role_value not in POLICE + (MAG,)
    if redacted or must_redact:
        if not doc.redacted_text:
            raise HTTPException(status_code=409, detail="No redacted copy exists yet; ask the IO/SHO to run redaction")
        data = doc.redacted_text.encode("utf-8")
        filename = f"{document_id}_REDACTED.txt"
        media = "text/plain"
        what = "protected copy"
    else:
        try:
            data = vault.load(doc.file_path, doc.document_id)
        except FileNotFoundError:
            raise HTTPException(status_code=410, detail="Stored file is missing from the vault")
        if vault.sha256(data) != doc.file_hash_sha256:
            append_custody_entry(db, case, "INTEGRITY_ALERT", current_officer,
                                 f"Stored file no longer matches its fingerprint: {document_id}", document_id=document_id)
            db.commit()
            raise HTTPException(status_code=409, detail="Stored file hash does not match the custody record")
        filename = doc.original_filename or f"{document_id}.bin"
        media = doc.mime_type or "application/octet-stream"
        what = "original"

    append_custody_entry(db, case, "DOWNLOADED", current_officer, f"Downloaded {doc.title} ({what})",
                         document_id=document_id, payload_hash=doc.file_hash_sha256)
    db.commit()
    headers = {"Content-Disposition": f'attachment; filename="{filename}"',
               "X-Document-SHA256": doc.file_hash_sha256}
    return StreamingResponse(io.BytesIO(data), media_type=media, headers=headers)


@router.post("/{case_id}/documents/{document_id}/redact", summary="Generate Sec 72 BNS redacted copy")
def redact_document(case_id: str, document_id: str, payload: RedactionRequest, db: Session = Depends(get_db),
                    current_officer: Officer = Depends(require_roles(IO, SHO))):
    case = _get_case_or_403(db, case_id, current_officer)
    doc = db.query(LegalDocument).filter(LegalDocument.document_id == document_id,
                                        LegalDocument.case_id == case_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found in this case")
    source = payload.document_text or doc.extracted_text
    if not source:
        raise HTTPException(status_code=422, detail="No text available for this document (image/scan without OCR)")

    masked, summary = victim_redactor.redact_text(source, payload.victim_name, payload.extra_names)
    doc.is_redacted = True
    doc.redacted_text = masked
    doc.redaction_summary = json.dumps(summary)
    if payload.document_text and not doc.extracted_text:
        doc.extracted_text = payload.document_text
    redacted_hash = vault.sha256(masked.encode("utf-8"))
    append_custody_entry(db, case, "REDACTED", current_officer,
                         f"Protected copy of {doc.title} created — {summary['total_redactions']} victim details hidden (Sec 72 BNS)",
                         document_id=document_id, payload_hash=redacted_hash)
    db.commit()
    return {"success": True, "document_id": document_id, "redacted_text": masked,
            "redacted_sha256": redacted_hash, "redaction_summary": summary,
            "current_merkle_root": case.current_merkle_root}


@router.post("/{case_id}/documents/{document_id}/certificate", summary="Issue BSA 2023 Sec 63 certificate")
def issue_certificate(case_id: str, document_id: str, db: Session = Depends(get_db),
                      current_officer: Officer = Depends(require_roles(IO, SHO, FSL))):
    case = _get_case_or_403(db, case_id, current_officer)
    doc = db.query(LegalDocument).filter(LegalDocument.document_id == document_id,
                                        LegalDocument.case_id == case_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found in this case")
    if current_officer.role_value == FSL and doc.doc_type != "FORENSIC_REPORT":
        raise HTTPException(status_code=403, detail="FSL may certify only forensic reports")

    # Certificate must attest to the bytes actually in the vault
    try:
        data = vault.load(doc.file_path, doc.document_id)
    except FileNotFoundError:
        raise HTTPException(status_code=410, detail="Stored file is missing from the vault")
    if vault.sha256(data) != doc.file_hash_sha256:
        raise HTTPException(status_code=409, detail="Stored file hash mismatch — certificate refused")

    designation = {IO: "Investigating Officer", SHO: "Station House Officer",
                   FSL: "Scientific Officer, FSL"}.get(current_officer.role_value, current_officer.role_value)
    cert = bsa_generator.generate_certificate_payload(
        case_id=case.case_id, fir_number=case.fir_number, police_station=case.police_station,
        document_id=doc.document_id, document_title=doc.title, document_sha256=doc.file_hash_sha256,
        merkle_root=case.current_merkle_root, officer_id=current_officer.badge_id,
        officer_name=current_officer.name, officer_designation=designation)

    db.add(BSACertificate(
        certificate_id=cert["certificate_id"], case_id=case_id, document_id=document_id,
        statutory_clause=f"{cert['statutory_act']} - {cert['statutory_section']}",
        certifying_officer_id=current_officer.badge_id, certifying_officer_name=current_officer.name,
        certifying_officer_designation=designation, police_station=case.police_station,
        document_title=doc.title, document_sha256=doc.file_hash_sha256,
        terminal_hardware_hash=cert["terminal_hardware_hash"], merkle_root=cert["merkle_root"],
        digital_signature=cert["digital_signature"], legal_declaration=cert["legal_declaration"],
        qr_payload=cert["qr_verification_url"], issued_at=datetime.fromisoformat(cert["issued_at"]).replace(tzinfo=None),
    ))
    append_custody_entry(db, case, "CERTIFIED", current_officer,
                         f"Court certificate issued for {doc.title} (Sec 63 BSA, {cert['certificate_id']})",
                         document_id=document_id, payload_hash=doc.file_hash_sha256)
    db.commit()
    return {"success": True, "certificate": cert, "current_merkle_root": case.current_merkle_root}


@router.get("/{case_id}/certificates/{certificate_id}/verify", summary="Re-verify a certificate's signature")
def verify_certificate(case_id: str, certificate_id: str, db: Session = Depends(get_db),
                       current_officer: Officer = Depends(get_current_officer)):
    case = _get_case_or_403(db, case_id, current_officer)
    cert = db.query(BSACertificate).filter(BSACertificate.certificate_id == certificate_id,
                                          BSACertificate.case_id == case_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    iso_time = cert.issued_at.replace(tzinfo=timezone.utc).isoformat()
    expected = bsa_generator.sign(cert.certificate_id, cert.case_id, cert.document_sha256, cert.merkle_root,
                                  cert.terminal_hardware_hash, iso_time)
    sig_ok = expected == cert.digital_signature
    doc = db.query(LegalDocument).filter(LegalDocument.document_id == cert.document_id).first()
    file_ok = None
    if doc:
        try:
            file_ok = vault.sha256(vault.load(doc.file_path, doc.document_id)) == cert.document_sha256
        except Exception:
            file_ok = False
    root_in_chain = db.query(ChainOfCustodyLog).filter(ChainOfCustodyLog.case_id == case_id,
                                                       ChainOfCustodyLog.current_merkle_root == cert.merkle_root).first() is not None
    return {"certificate": _cert_dict(cert), "signature_valid": sig_ok, "file_hash_matches": file_ok,
            "merkle_root_in_chain": root_in_chain, "valid": bool(sig_ok and file_ok and root_in_chain)}
