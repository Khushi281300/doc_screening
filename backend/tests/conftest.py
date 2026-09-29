import pytest
from app.db.models import Base, engine, SessionLocal
from app.db.seed import seed_demo_officers, seed_demo_cases


def _reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_officers(db)
        seed_demo_cases(db)
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def clean_test_database():
    _reset_database()
    yield
    _reset_database()
