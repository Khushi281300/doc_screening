import io
import hashlib
import pytest
import numpy as np
import cv2
from fastapi.testclient import TestClient

from app.main import app
from app.db.models import init_db, SessionLocal, ChainOfCustodyLog

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    init_db()


def hdr(badge):
    r = client.post("/api/v1/auth/login", json={"badge_id": badge, "password": "demo1234"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture
def io_h():
    return hdr("IO-1001")


@pytest.fixture
def sho_h():
    return hdr("SHO-001")


@pytest.fixture
def fsl_h():
    return hdr("FSL-008")


@pytest.fixture
def pp_h():
    return hdr("PP-021")


@pytest.fixture
def mag_h():
    return hdr("MAG-004")


CASE = "CASE-2026-DL-00104"


# ------------------------------------------------------------------ cases & clock
def test_list_cases_has_statutory_clock(io_h):
    data = client.get("/api/v1/cases", headers=io_h).json()
    assert data["total"] >= 2
    c = next(c for c in data["cases"] if c["fir_number"] == "FIR 104/2026")
    assert c["is_women_safety_case"] is True
    assert c["statutory_deadline_days"] == 60
    assert isinstance(c["days_remaining_for_chargesheet"], int)
    assert c["document_count"] >= 4


def test_create_case_and_duplicate_rejected(io_h):
    payload = {"fir_number": "FIR 999/2026", "police_station": "Hauz Khas PS", "acts_sections": "BNS 64(1)",
               "victim_name": "Pooja Sharma", "accused_names": ["Karan Malhotra"]}
    r = client.post("/api/v1/cases", json=payload, headers=io_h)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["case_id"].startswith("CASE-")
    assert body["victim_name_masked"] == "[REDACTED - SEC 72 BNS PROTECTED]"
    assert body["current_merkle_root"]
    assert client.post("/api/v1/cases", json=payload, headers=io_h).status_code == 409


def test_fsl_cannot_create_case(fsl_h):
    r = client.post("/api/v1/cases", json={"fir_number": "FIR 1/2026", "police_station": "X", "acts_sections": "Y"},
                    headers=fsl_h)
    assert r.status_code == 403


# ------------------------------------------------------------------ access control
def test_prosecutor_blocked_until_transferred(io_h, pp_h, sho_h):
    r = client.post("/api/v1/cases", json={"fir_number": "FIR 500/2026", "police_station": "Saket PS",
                                           "acts_sections": "BNS 303"}, headers=io_h)
    cid = r.json()["case_id"]
    assert client.get(f"/api/v1/cases/{cid}", headers=pp_h).status_code == 403
    t = client.post(f"/api/v1/cases/{cid}/transfer", json={"target_role": "PUBLIC_PROSECUTOR"}, headers=io_h)
    assert t.status_code == 200 and t.json()["case_status"] == "CHARGE_SHEET_DRAFTED"
    assert client.get(f"/api/v1/cases/{cid}", headers=pp_h).status_code == 200
    # only SHO may file before the court, and filing locks the record
    assert client.post(f"/api/v1/cases/{cid}/transfer", json={"target_role": "MAGISTRATE"}, headers=io_h).status_code == 403
    f = client.post(f"/api/v1/cases/{cid}/transfer", json={"target_role": "MAGISTRATE"}, headers=sho_h)
    assert f.status_code == 200 and f.json()["is_locked"] is True and f.json()["case_status"] == "CHARGE_SHEET_FILED"


def test_magistrate_status_rules(mag_h, sho_h):
    cid = client.post("/api/v1/cases", json={"fir_number": "FIR 501/2026", "police_station": "Saket PS",
                                             "acts_sections": "BNS 303"}, headers=sho_h).json()["case_id"]
    client.post(f"/api/v1/cases/{cid}/transfer", json={"target_role": "MAGISTRATE"}, headers=sho_h)
    assert client.post(f"/api/v1/cases/{cid}/status", json={"case_status": "UNDER_INVESTIGATION"}, headers=mag_h).status_code == 403
    r = client.post(f"/api/v1/cases/{cid}/status", json={"case_status": "IN_TRIAL"}, headers=mag_h)
    assert r.status_code == 200 and r.json()["case_status"] == "IN_TRIAL"


# ------------------------------------------------------------------ documents
def _upload(headers, case_id, filename, content, mime, doc_type, title="Test doc"):
    return client.post(f"/api/v1/cases/{case_id}/documents",
                       files={"file": (filename, content, mime)},
                       data={"doc_type": doc_type, "title": title, "description": "d"},
                       headers=headers)


def test_upload_hash_search_download_roundtrip(io_h):
    content = b"Panchnama: seized one laptop, serial ZX-771-Q, from accused premises."
    r = _upload(io_h, CASE, "seizure.txt", content, "text/plain", "SEIZURE_MEMO", "Seizure Memo")
    assert r.status_code == 200, r.text
    doc = r.json()["document"]
    assert doc["file_hash_sha256"] == hashlib.sha256(content).hexdigest()
    assert doc["forensic_status"] == "NOT_APPLICABLE"
    assert doc["has_text"] is True

    # duplicate bytes rejected
    assert _upload(io_h, CASE, "again.txt", content, "text/plain", "SEIZURE_MEMO").status_code == 409

    # searchable by content
    s = client.get("/api/v1/cases/search", params={"q": "ZX-771-Q"}, headers=io_h).json()
    assert any(d["document_id"] == doc["document_id"] for d in s["documents"])
    assert s["documents"][0]["snippet"] and "ZX-771-Q" in s["documents"][0]["snippet"]

    # download returns the exact bytes and is logged
    d = client.get(f"/api/v1/cases/{CASE}/documents/{doc['document_id']}/download", headers=io_h)
    assert d.status_code == 200 and d.content == content
    assert d.headers["X-Document-SHA256"] == doc["file_hash_sha256"]
    det = client.get(f"/api/v1/cases/{CASE}/documents/{doc['document_id']}", headers=io_h).json()
    assert any(l["action"] == "DOWNLOADED" for l in det["custody"])


def test_upload_rights_per_role(fsl_h, pp_h, io_h):
    assert _upload(fsl_h, CASE, "r.txt", b"report", "text/plain", "FIR").status_code == 403
    assert _upload(fsl_h, CASE, "r.txt", b"FSL report body", "text/plain", "FORENSIC_REPORT").status_code == 200
    assert _upload(io_h, CASE, "x.txt", b"court order", "text/plain", "COURT_ORDER").status_code == 403
    # prosecutor has no access to case 104 (not shared) -> 403 before upload rules apply
    assert _upload(pp_h, CASE, "x.txt", b"charge", "text/plain", "CHARGE_SHEET").status_code == 403


def test_versioning(io_h):
    r1 = _upload(io_h, CASE, "cd.txt", b"Case diary entry 15.1", "text/plain", "CASE_DIARY", "Case Diary Vol 15")
    d1 = r1.json()["document"]
    r2 = client.post(f"/api/v1/cases/{CASE}/documents/{d1['document_id']}/versions",
                     files={"file": ("cd.txt", b"Case diary entry 15.1 + 15.2", "text/plain")}, headers=io_h)
    assert r2.status_code == 200, r2.text
    d2 = r2.json()["document"]
    assert d2["version"] == 2 and d2["supersedes_document_id"] == d1["document_id"]
    det = client.get(f"/api/v1/cases/{CASE}/documents/{d2['document_id']}", headers=io_h).json()
    assert [v["version"] for v in det["versions"]] == [1, 2]
    assert det["versions"][0]["is_current_version"] is False
    # cannot revise a superseded version
    r3 = client.post(f"/api/v1/cases/{CASE}/documents/{d1['document_id']}/versions",
                     files={"file": ("cd.txt", b"x", "text/plain")}, headers=io_h)
    assert r3.status_code == 409


def test_image_upload_is_forensically_screened(io_h):
    img = np.full((240, 320, 3), 200, dtype=np.uint8)
    cv2.putText(img, "EXHIBIT 7", (20, 120), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (20, 20, 20), 3)
    ok, buf = cv2.imencode(".jpg", img, [int(cv2.IMWRITE_JPEG_QUALITY), 92])
    r = _upload(io_h, CASE, "exhibit.jpg", buf.tobytes(), "image/jpeg", "EVIDENCE_EXHIBIT", "Photo exhibit")
    assert r.status_code == 200, r.text
    doc = r.json()["document"]
    assert doc["is_forensic_screened"] is True
    assert doc["forensic_status"] in ("CLEAN", "SUSPICIOUS", "TAMPER_DETECTED")
    assert doc["forensic_report"]["ela_heatmap_base64"].startswith("data:image/jpeg;base64,")
    assert "exif" in doc["forensic_report"] and "copy_move" in doc["forensic_report"]


# ------------------------------------------------------------------ redaction
def test_sec72_redaction_on_stored_fir(io_h, fsl_h):
    r = client.post(f"/api/v1/cases/{CASE}/documents/DOC-FIR-104-01/redact",
                    json={"victim_name": "Pooja Sharma"}, headers=io_h)
    assert r.status_code == 200, r.text
    out = r.json()
    red = out["redacted_text"]
    for leaked in ("Pooja Sharma", "9876543210", "4321 8765 1098", "pooja.s@example.com", "H.No 42"):
        assert leaked not in red
    assert "[REDACTED - IDENTITY PROTECTED U/S 72 BNS]" in red
    assert out["redaction_summary"]["total_redactions"] >= 5

    # FSL (non-police) only ever receives the redacted copy of a women-safety document
    d = client.get(f"/api/v1/cases/{CASE}/documents/DOC-FIR-104-01/download", headers=fsl_h)
    assert d.status_code == 200 and b"Pooja Sharma" not in d.content and b"REDACTED" in d.content
    det = client.get(f"/api/v1/cases/{CASE}/documents/DOC-FIR-104-01", headers=fsl_h).json()
    assert "Pooja Sharma" not in (det["extracted_text"] or "")


def test_fsl_cannot_redact(fsl_h):
    r = client.post(f"/api/v1/cases/{CASE}/documents/DOC-FIR-104-01/redact", json={}, headers=fsl_h)
    assert r.status_code == 403


# ------------------------------------------------------------------ certificates
def test_bsa63_certificate_issue_and_verify(io_h, fsl_h):
    r = client.post(f"/api/v1/cases/{CASE}/documents/DOC-FIR-104-01/certificate", headers=io_h)
    assert r.status_code == 200, r.text
    cert = r.json()["certificate"]
    assert cert["statutory_section"] == "Section 63 (Sub-section 4)"
    assert cert["document_sha256"] and len(cert["digital_signature"]) == 64
    v = client.get(f"/api/v1/cases/{CASE}/certificates/{cert['certificate_id']}/verify", headers=io_h).json()
    assert v["signature_valid"] and v["file_hash_matches"] and v["merkle_root_in_chain"] and v["valid"]
    # FSL may only certify forensic reports
    assert client.post(f"/api/v1/cases/{CASE}/documents/DOC-FIR-104-01/certificate", headers=fsl_h).status_code == 403
    assert client.post(f"/api/v1/cases/{CASE}/documents/DOC-FSL-104-01/certificate", headers=fsl_h).status_code == 200


# ------------------------------------------------------------------ chain integrity
def test_chain_verifies_and_detects_tampering(io_h):
    v = client.get(f"/api/v1/cases/{CASE}/verify", headers=io_h).json()
    assert v["chain_valid"] is True and v["entries_checked"] > 0 and v["documents_checked"] >= 4
    assert all(d["status"] == "OK" for d in v["documents"])

    # Tamper with a log row directly in the DB (what a rogue DBA would do)
    db = SessionLocal()
    row = db.query(ChainOfCustodyLog).filter(ChainOfCustodyLog.case_id == CASE,
                                            ChainOfCustodyLog.action == "UPLOADED").first()
    orig_details = row.details
    orig_performed_by = row.performed_by_id
    row.details = "backdated / altered"
    row.performed_by_id = "IO-9999"
    db.commit()
    db.close()

    v2 = client.get(f"/api/v1/cases/{CASE}/verify", headers=io_h).json()
    assert v2["chain_valid"] is False
    issues = {p["issue"] for p in v2["problems"]}
    assert "ROOT_MISMATCH" in issues or "BAD_SIGNATURE" in issues

    # restore so other tests are unaffected
    db = SessionLocal()
    row = db.query(ChainOfCustodyLog).filter(ChainOfCustodyLog.case_id == CASE,
                                            ChainOfCustodyLog.action == "UPLOADED").first()
    row.performed_by_id = orig_performed_by
    row.details = orig_details
    db.commit()
    db.close()


# ------------------------------------------------------------------ audit & stats
def test_audit_trail_and_stats(io_h, pp_h):
    a = client.get("/api/v1/audit", headers=io_h).json()
    assert a["total"] > 0
    assert {"action", "performed_by_name", "current_merkle_root", "digital_signature"} <= set(a["entries"][0])
    s = client.get("/api/v1/audit/summary", headers=io_h).json()
    assert "CREATED" in s["by_action"]
    st = client.get("/api/v1/cases/stats", headers=io_h).json()
    assert st["cases_total"] >= 2 and st["documents_total"] >= 5
    # prosecutor sees only shared cases in the audit trail
    ap = client.get("/api/v1/audit", headers=pp_h).json()
    assert all(e["case_id"] != "CASE-2026-DL-00088" for e in ap["entries"])
