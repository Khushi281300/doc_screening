import cv2
import numpy as np
import base64
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.models import init_db

@pytest.fixture(autouse=True)
def setup_database():
    init_db()

def get_auth_headers(client: TestClient, badge_id: str = "BC-1001") -> dict:
    login_res = client.post("/api/v1/auth/login", json={"badge_id": badge_id, "password": "demo1234"})
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def create_sample_doc_base64() -> str:
    img = np.full((400, 600, 3), 240, dtype=np.uint8)
    cv2.putText(img, "PASSPORT OF UTOPIA", (50, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (20, 20, 20), 2)
    cv2.putText(img, "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<", (20, 340), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1)
    cv2.putText(img, "L898902C36UTO7408122F1204159ZE184226B<<<<<10", (20, 370), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1)
    _, buffer = cv2.imencode('.jpg', img)
    return f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

def test_health_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ONLINE"
        assert "services" in data

def test_watchlist_endpoint():
    with TestClient(app) as client:
        headers = get_auth_headers(client)
        response = client.get("/api/v1/blacklist/watchlist", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "SUCCESS"
        assert len(data["watchlist"]) >= 1

def test_blockchain_ledger_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/v1/blockchain/ledger/blocks")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "SUCCESS"
        assert data["chain_valid"] is True

def test_agentic_screening_endpoint():
    with TestClient(app) as client:
        headers = get_auth_headers(client)
        doc_b64 = create_sample_doc_base64()
        payload = {
            "document_image_base64": doc_b64,
            "checkpoint_id": "AIRPORT-E1"
        }
        response = client.post("/api/v1/scan/inspect-full", json=payload, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "SUCCESS"
        assert "agent_trace" in data
        assert len(data["agent_trace"]) >= 8  # 9 steps with Document Classifier module
        assert "officer_dossier" in data
        assert len(data["officer_dossier"]) > 50

def test_copilot_chat_endpoint():
    with TestClient(app) as client:
        headers = get_auth_headers(client)
        payload = {
            "scan_data": {
                "risk_evaluation": {
                    "outcome": "MANUAL_REVIEW",
                    "overall_risk_score": 65.0,
                    "critical_failures": [],
                    "warning_flags": ["Secondary review required"]
                },
                "document_fields": {"document_number": "P12345678", "full_name": "JOHN DOE"},
                "forensics_metrics": {"ela": {"is_spliced": False}},
                "biometrics": {"verdict": "MATCH", "similarity_percentage": 88.0, "is_live": True},
                "database_check": {"is_blacklisted": False}
            },
            "query": "What physical features should I check?"
        }
        response = client.post("/api/v1/scan/copilot-chat", json=payload, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "SUCCESS"
        assert "reply" in data
        assert len(data["reply"]) > 20

def test_review_queue_endpoint():
    with TestClient(app) as client:
        headers = get_auth_headers(client)
        response = client.get("/api/v1/scan/review-queue", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "SUCCESS"
        assert "queue" in data

def test_llm_status_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/v1/scan/llm-status")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "SUCCESS"
        assert "llm" in data
        assert "online" in data["llm"]
        assert "active_model" in data["llm"]

