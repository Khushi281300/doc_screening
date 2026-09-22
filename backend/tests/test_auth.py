import pytest
import numpy as np
import cv2
import base64
from fastapi.testclient import TestClient
from app.main import app
from app.db.models import init_db, SessionLocal, DocumentScan
from app.models.officer import Officer

@pytest.fixture(autouse=True)
def setup_database():
    init_db()

def create_sample_doc_base64() -> str:
    img = np.full((400, 600, 3), 240, dtype=np.uint8)
    cv2.putText(img, "PASSPORT OF UTOPIA", (50, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (20, 20, 20), 2)
    cv2.putText(img, "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<", (20, 340), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1)
    cv2.putText(img, "L898902C36UTO7408122F1204159ZE184226B<<<<<10", (20, 370), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1)
    _, buffer = cv2.imencode('.jpg', img)
    return f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

# 1. Login with correct credentials returns a valid token
def test_login_success():
    with TestClient(app) as client:
        res = client.post("/api/v1/auth/login", json={"badge_id": "BC-1001", "password": "demo1234"})
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["officer"]["badge_id"] == "BC-1001"
        assert data["officer"]["name"] == "Officer A. Sharma"
        assert data["officer"]["role"] == "OFFICER"

# 2. Login with wrong password returns 401
def test_login_wrong_password():
    with TestClient(app) as client:
        res = client.post("/api/v1/auth/login", json={"badge_id": "BC-1001", "password": "incorrect_password"})
        assert res.status_code == 401
        data = res.json()
        assert data["detail"] == "Invalid badge ID or password"

# 3. Login with nonexistent badge_id returns 401 (same generic message as wrong password — verify no user enumeration leak)
def test_login_nonexistent_badge_generic_error():
    with TestClient(app) as client:
        res = client.post("/api/v1/auth/login", json={"badge_id": "FAKE-9999", "password": "demo1234"})
        assert res.status_code == 401
        data = res.json()
        assert data["detail"] == "Invalid badge ID or password"

# 4. Accessing a protected scan endpoint without a token returns 401
def test_protected_scan_without_token_unauthorized():
    with TestClient(app) as client:
        payload = {
            "document_image_base64": create_sample_doc_base64()
        }
        res = client.post("/api/v1/scan/inspect-full", json=payload)
        assert res.status_code == 401
        assert "detail" in res.json()

# 5. Accessing an admin-only endpoint as a non-admin officer returns 403
def test_admin_endpoint_forbidden_for_regular_officer():
    with TestClient(app) as client:
        # Login as regular officer BC-1001
        login_res = client.post("/api/v1/auth/login", json={"badge_id": "BC-1001", "password": "demo1234"})
        assert login_res.status_code == 200
        officer_token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {officer_token}"}

        # Try to access admin-only analytics or watchlist add
        res = client.get("/api/v1/analytics/checkpoint/metrics", headers=headers)
        assert res.status_code == 403
        assert "Administrative clearance required" in res.json()["detail"]

        # Confirm admin account ADM-001 CAN access it
        admin_login = client.post("/api/v1/auth/login", json={"badge_id": "ADM-001", "password": "demo1234"})
        assert admin_login.status_code == 200
        admin_token = admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        admin_res = client.get("/api/v1/analytics/checkpoint/metrics", headers=admin_headers)
        assert admin_res.status_code == 200

# 6. A valid token successfully authorizes a scan request, and the resulting scan record contains the correct officer badge_id
def test_authenticated_scan_records_officer_badge():
    with TestClient(app) as client:
        # Login as BC-1002
        login_res = client.post("/api/v1/auth/login", json={"badge_id": "BC-1002", "password": "demo1234"})
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        payload = {
            "document_image_base64": create_sample_doc_base64()
        }
        res = client.post("/api/v1/scan/inspect-full", json=payload, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "SUCCESS"
        scan_id = data["scan_id"]

        # Check DB scan record directly
        db = SessionLocal()
        scan = db.query(DocumentScan).filter(DocumentScan.scan_id == scan_id).first()
        assert scan is not None
        assert scan.officer_id == "BC-1002"
        assert scan.officer_name == "Officer R. Iyer"
        assert scan.checkpoint_id == "DEL-T3-GATE-4"
        db.close()
