import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.models import init_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    init_db()


def login(badge, pwd="demo1234"):
    return client.post("/api/v1/auth/login", json={"badge_id": badge, "password": pwd})


def test_health_is_public():
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ONLINE"


@pytest.mark.parametrize("badge,role", [
    ("IO-1001", "INVESTIGATING_OFFICER"), ("SHO-001", "STATION_HOUSE_OFFICER"),
    ("FSL-008", "FSL_EXAMINER"), ("PP-021", "PUBLIC_PROSECUTOR"), ("MAG-004", "MAGISTRATE")])
def test_all_five_roles_can_login(badge, role):
    r = login(badge)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["officer"]["role"] == role
    assert body["officer"]["role_label"]
    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {body['access_token']}"})
    assert me.status_code == 200 and me.json()["badge_id"] == badge


def test_bad_password_and_unknown_badge_same_error():
    a = login("IO-1001", "wrong")
    b = login("NOBODY-1", "wrong")
    assert a.status_code == b.status_code == 401
    assert a.json()["detail"] == b.json()["detail"]


def test_protected_route_requires_token():
    assert client.get("/api/v1/cases").status_code == 401
    assert client.get("/api/v1/cases", headers={"Authorization": "Bearer garbage"}).status_code == 401
