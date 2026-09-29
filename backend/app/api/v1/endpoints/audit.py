import json
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ....core.dependencies import get_current_officer, get_db
from ....models.officer import Officer
from ....db.models import Case, ChainOfCustodyLog
from .cases import _log_dict, _can_access

router = APIRouter()


def _visible_case_ids(db: Session, officer: Officer):
    return [c.case_id for c in db.query(Case).all() if _can_access(c, officer)]


@router.get("", summary="Cross-case audit trail (who / what / when / where)")
def list_audit(case_id: Optional[str] = None, action: Optional[str] = None, actor: Optional[str] = None,
               limit: int = Query(200, le=1000), db: Session = Depends(get_db),
               current_officer: Officer = Depends(get_current_officer)):
    ids = _visible_case_ids(db, current_officer)
    if not ids:
        return {"total": 0, "entries": []}
    q = db.query(ChainOfCustodyLog).filter(ChainOfCustodyLog.case_id.in_(ids))
    if case_id:
        q = q.filter(ChainOfCustodyLog.case_id == case_id)
    if action:
        q = q.filter(ChainOfCustodyLog.action == action)
    if actor:
        q = q.filter(ChainOfCustodyLog.performed_by_id == actor)
    total = q.count()
    entries = q.order_by(ChainOfCustodyLog.id.desc()).limit(limit).all()
    fir_by_case = {c.case_id: c.fir_number for c in db.query(Case).filter(Case.case_id.in_(ids)).all()}
    return {"total": total, "entries": [{**_log_dict(e), "fir_number": fir_by_case.get(e.case_id)} for e in entries]}


@router.get("/summary", summary="Counts by action and by actor")
def audit_summary(db: Session = Depends(get_db), current_officer: Officer = Depends(get_current_officer)):
    ids = _visible_case_ids(db, current_officer)
    if not ids:
        return {"by_action": {}, "by_actor": {}, "alerts": 0}
    by_action = dict(db.query(ChainOfCustodyLog.action, func.count()).filter(
        ChainOfCustodyLog.case_id.in_(ids)).group_by(ChainOfCustodyLog.action).all())
    by_actor = {}
    for badge, name, role, n in db.query(ChainOfCustodyLog.performed_by_id, ChainOfCustodyLog.performed_by_name,
                                         ChainOfCustodyLog.performed_by_role, func.count()).filter(
            ChainOfCustodyLog.case_id.in_(ids)).group_by(
            ChainOfCustodyLog.performed_by_id, ChainOfCustodyLog.performed_by_name,
            ChainOfCustodyLog.performed_by_role).all():
        by_actor[badge] = {"name": name, "role": role, "count": n}
    alerts = by_action.get("FORENSIC_FLAG", 0) + by_action.get("INTEGRITY_ALERT", 0)
    return {"by_action": by_action, "by_actor": by_actor, "alerts": alerts}
