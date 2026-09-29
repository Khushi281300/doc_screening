"""
Tamper-evident chain of custody.

Each entry commits to the previous root:
    root_n = SHA256( root_{n-1} : action : document_id : payload_hash : actor : timestamp )
and carries an HMAC-SHA256 signature over the same material keyed with SECRET_SALT,
so an entry cannot be edited or re-ordered in the database without breaking
either the chain or the signature. verify_case_chain() recomputes everything.
"""
import hashlib
import hmac
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from sqlalchemy.orm import Session

from ..core.config import settings
from ..db.models import Case, ChainOfCustodyLog, LegalDocument
from ..models.officer import Officer


def genesis_root(case_id: str, fir_number: str) -> str:
    return hashlib.sha256(f"GENESIS:{case_id}:{fir_number}".encode()).hexdigest()


def _entry_material(prev_root: str, action: str, document_id: Optional[str],
                    payload_hash: Optional[str], actor_id: str, ts_iso: str) -> str:
    return f"{prev_root}:{action}:{document_id or '-'}:{payload_hash or '-'}:{actor_id}:{ts_iso}"


def _sign(material: str) -> str:
    return hmac.new(settings.SECRET_SALT.encode(), material.encode(), hashlib.sha256).hexdigest()


def append_custody_entry(db: Session, case: Case, action: str, officer: Officer, details: str,
                         document_id: Optional[str] = None, payload_hash: Optional[str] = None,
                         when: Optional[datetime] = None) -> ChainOfCustodyLog:
    ts = when or datetime.now(timezone.utc)
    ts_iso = ts.replace(tzinfo=None).isoformat(timespec="microseconds")
    prev_root = case.current_merkle_root or genesis_root(case.case_id, case.fir_number)
    material = _entry_material(prev_root, action, document_id, payload_hash, officer.badge_id, ts_iso)
    new_root = hashlib.sha256(material.encode()).hexdigest()

    entry = ChainOfCustodyLog(
        case_id=case.case_id,
        document_id=document_id,
        action=action,
        performed_by_id=officer.badge_id,
        performed_by_name=officer.name,
        performed_by_role=officer.role_value,
        ip_or_device_id=officer.station_id,
        details=details,
        payload_hash=payload_hash,
        previous_merkle_root=prev_root,
        current_merkle_root=new_root,
        digital_signature=_sign(material),
        timestamp=ts.replace(tzinfo=None),
    )
    case.current_merkle_root = new_root
    db.add(entry)
    db.flush()
    return entry


def verify_case_chain(db: Session, case: Case, vault) -> Dict[str, Any]:
    """Recomputes the whole chain and re-hashes every stored file."""
    entries: List[ChainOfCustodyLog] = (
        db.query(ChainOfCustodyLog).filter(ChainOfCustodyLog.case_id == case.case_id)
        .order_by(ChainOfCustodyLog.id.asc()).all()
    )
    problems = []
    expected_prev = genesis_root(case.case_id, case.fir_number)
    for e in entries:
        ts_iso = e.timestamp.isoformat(timespec="microseconds")
        material = _entry_material(e.previous_merkle_root, e.action, e.document_id, e.payload_hash,
                                   e.performed_by_id, ts_iso)
        if e.previous_merkle_root != expected_prev:
            problems.append({"entry_id": e.id, "issue": "CHAIN_BREAK", "detail": "previous root does not match"})
        if hashlib.sha256(material.encode()).hexdigest() != e.current_merkle_root:
            problems.append({"entry_id": e.id, "issue": "ROOT_MISMATCH", "detail": "entry was altered"})
        if not hmac.compare_digest(_sign(material), e.digital_signature):
            problems.append({"entry_id": e.id, "issue": "BAD_SIGNATURE", "detail": "HMAC signature invalid"})
        expected_prev = e.current_merkle_root

    if entries and case.current_merkle_root != entries[-1].current_merkle_root:
        problems.append({"entry_id": None, "issue": "HEAD_MISMATCH", "detail": "case root != last entry root"})

    docs = db.query(LegalDocument).filter(LegalDocument.case_id == case.case_id).all()
    doc_results = []
    for d in docs:
        status = "OK"
        actual = None
        try:
            data = vault.load(d.file_path, d.document_id)
            actual = vault.sha256(data)
            if actual != d.file_hash_sha256:
                status = "HASH_MISMATCH"
        except FileNotFoundError:
            status = "FILE_MISSING"
        except Exception:
            status = "DECRYPT_FAILED"
        doc_results.append({"document_id": d.document_id, "title": d.title, "version": d.version,
                            "stored_sha256": d.file_hash_sha256, "recomputed_sha256": actual, "status": status})
        if status != "OK":
            problems.append({"entry_id": None, "issue": status, "detail": d.document_id})

    return {
        "case_id": case.case_id,
        "chain_valid": len(problems) == 0,
        "entries_checked": len(entries),
        "documents_checked": len(docs),
        "head_root": case.current_merkle_root,
        "problems": problems,
        "documents": doc_results,
    }
