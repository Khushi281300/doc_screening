import logging
from sqlalchemy.orm import Session
from ..models.officer import Officer, OfficerRole
from ..core.security import hash_password

logger = logging.getLogger("aegis.seed")

DEMO_PASSWORD = "demo1234"

DEMO_OFFICERS = [
    {
        "badge_id": "BC-1001",
        "name": "Officer A. Sharma",
        "role": OfficerRole.OFFICER,
        "checkpoint_id": "DEL-T3-GATE-4"
    },
    {
        "badge_id": "BC-1002",
        "name": "Officer R. Iyer",
        "role": OfficerRole.OFFICER,
        "checkpoint_id": "DEL-T3-GATE-4"
    },
    {
        "badge_id": "ADM-001",
        "name": "Supervisor K. Nair",
        "role": OfficerRole.ADMIN,
        "checkpoint_id": "DEL-T3-HQ"
    }
]

def seed_demo_officers(db: Session):
    """
    Inserts initial demo officers if the officers table is empty.
    Prints credentials to console on first run for demonstration convenience.
    """
    count = db.query(Officer).count()
    if count == 0:
        print("\n========================================================")
        print("  [AEGIS AUTH SEED] Seeding Default Offline Officers")
        print("========================================================")
        hashed_pwd = hash_password(DEMO_PASSWORD)

        for off_data in DEMO_OFFICERS:
            officer = Officer(
                badge_id=off_data["badge_id"],
                name=off_data["name"],
                role=off_data["role"],
                checkpoint_id=off_data["checkpoint_id"],
                password_hash=hashed_pwd
            )
            db.add(officer)
            role_title = off_data["role"].value if hasattr(off_data["role"], "value") else off_data["role"]
            print(f"  * Badge: {off_data['badge_id']} | Pass: {DEMO_PASSWORD} | Role: {role_title} | {off_data['name']}")

        db.commit()
        print("========================================================\n")
