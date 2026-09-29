"""
Demo seed data: five agency roles and two sample cases whose documents are
real files written into the encrypted vault, so hashing / verification /
redaction / certificates operate on actual bytes rather than placeholders.
"""
import json
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from ..models.officer import Officer, OfficerRole
from ..core.security import hash_password
from ..core.config import settings

logger = logging.getLogger("chronicle.seed")

DEMO_PASSWORD = "demo1234"

DEMO_OFFICERS = [
    {"badge_id": "IO-1001",  "name": "Insp. A. Sharma",            "role": OfficerRole.INVESTIGATING_OFFICER, "station_id": "PS-CRIME-BRANCH-DELHI"},
    {"badge_id": "SHO-001",  "name": "SHO K. Nair",                "role": OfficerRole.STATION_HOUSE_OFFICER, "station_id": "PS-CRIME-BRANCH-DELHI"},
    {"badge_id": "FSL-008",  "name": "Dr. S. Mukherjee (Sr. SO)",  "role": OfficerRole.FSL_EXAMINER,          "station_id": "FSL-ROHINI-CYBER"},
    {"badge_id": "PP-021",   "name": "Adv. R. Iyer (APP)",         "role": OfficerRole.PUBLIC_PROSECUTOR,     "station_id": "PROSECUTION-DIR-DELHI"},
    {"badge_id": "MAG-004",  "name": "Hon. M. Verma (MM)",         "role": OfficerRole.MAGISTRATE,            "station_id": "SAKET-COURT-ROOM-04"},
]


def seed_demo_officers(db: Session):
    if db.query(Officer).count() > 0:
        return
    hashed = hash_password(DEMO_PASSWORD)
    print("\n==================== CHRONICLE DEMO LOGINS ====================")
    for o in DEMO_OFFICERS:
        db.add(Officer(badge_id=o["badge_id"], name=o["name"], role=o["role"],
                       station_id=o["station_id"], password_hash=hashed))
        print(f"  {o['badge_id']:<9} / {DEMO_PASSWORD}   {o['role'].value:<24} {o['name']}")
    print("===============================================================\n")
    db.commit()


# ---------------------------------------------------------------------------
# Demo case documents (plain text so redaction + search have something real)
# ---------------------------------------------------------------------------
FIR_104_TEXT = """FIRST INFORMATION REPORT (u/s 173 BNSS)
FIR No. 104/2026        Police Station: Crime Branch Cyber Cell, Delhi
Date of Registration: 10-09-2026     District: New Delhi
Sections: 64 BNS, 70(1) BNS, 351(2) BNS, 66E IT Act

Complainant: Smt. K. Devi
Victim: Pooja Sharma, aged 24, residing at H.No 42, Sector 15, Rohini, Delhi, PIN: 110085
Mobile: 9876543210   Email: pooja.s@example.com   Aadhaar: 4321 8765 1098

Brief facts: The complainant states that on the night of 08-09-2026 the accused
Vikram Sethi and Rajesh Tanwar forcibly entered the residence of the victim and
committed the offence. Intimate images were captured on a mobile device and later
circulated online. Digital devices were seized under Panchnama.
"""

WITNESS_104_TEXT = """STATEMENT OF WITNESS u/s 180 BNSS
Case: FIR 104/2026   Recorded by: Insp. A. Sharma on 12-09-2026

I, Ramesh Kumar, security guard, state that on 08-09-2026 at about 23:15 hrs I saw
a white Maruti Swift bearing registration DL 8C AB 4421 parked outside the building.
Two men came out around 23:50 hrs. I can identify them. My contact number is 9811122233.
"""

FSL_104_TEXT = """FORENSIC SCIENCE LABORATORY, ROHINI - CYBER DIVISION
Report No. FSL/CYB/2026/441     Ref: FIR 104/2026
Exhibit: One Samsung Galaxy A54 (IMEI ending 8821), one SanDisk 64GB card.

Findings: 37 image files recovered from the deleted partition. EXIF data confirms
capture on the seized handset between 23:20 and 23:48 hrs on 08-09-2026.
Hash values of recovered media are enclosed in Annexure-A.
"""

CASE_DIARY_104_TEXT = """CASE DIARY - Volume 14   FIR 104/2026
Entry 14.1 (20-09-2026): Accused Vikram Sethi interrogated. Denies presence; alibi
claims to be at Gurugram. CDR requested from service provider.
Entry 14.2 (22-09-2026): CDR received. Tower dump places accused mobile within 300 m of
the scene at 23:30 hrs. Alibi disproved.
"""

FIR_088_TEXT = """FIRST INFORMATION REPORT
FIR No. 88/2026       Police Station: Special Cell, Lodhi Colony
Sections: 111(2) BNS, 318(4) BNS, 25 Arms Act
Accused: Aleksei Volkov, Harpreet Singh
Brief facts: Organised syndicate operating a counterfeit-document racket. Recovery
of 3 pistols and forged stamps on 28-08-2026.
"""


def seed_demo_cases(db: Session):
    from .models import Case, LegalDocument, ChainOfCustodyLog, BSACertificate
    from ..services.vault import vault
    from ..services.custody import append_custody_entry, genesis_root
    from ..services.compliance.bsa_certificate import bsa_generator

    if db.query(Case).count() > 0:
        return

    now = datetime.now(timezone.utc)
    io = db.query(Officer).filter(Officer.badge_id == "IO-1001").first()
    fsl = db.query(Officer).filter(Officer.badge_id == "FSL-008").first()

    # ---- Case 104 (women-safety, 60-day clock) --------------------------
    c1 = Case(
        case_id="CASE-2026-DL-00104", fir_number="FIR 104/2026",
        police_station="Crime Branch Cyber Cell, Delhi", state="Delhi", district="New Delhi",
        incident_date="2026-09-08", registration_date=now - timedelta(days=18),
        complainant_name="Smt. K. Devi", victim_name_masked="[REDACTED - SEC 72 BNS PROTECTED]",
        accused_names=json.dumps(["Vikram Sethi", "Rajesh Tanwar"]),
        acts_sections="BNS 64, 70(1), 351(2) & IT Act 66E",
        investigating_officer_id=io.badge_id, investigating_officer_name=io.name, sho_id="SHO-001",
        case_status="FSL_PENDING", statutory_deadline_days=60,
        statutory_deadline_date=now - timedelta(days=18) + timedelta(days=60),
        is_women_safety_case=True, is_pocso_case=False,
        shared_with_roles=json.dumps(["INVESTIGATING_OFFICER", "STATION_HOUSE_OFFICER", "FSL_EXAMINER"]),
        current_merkle_root=genesis_root("CASE-2026-DL-00104", "FIR 104/2026"),
    )
    db.add(c1)
    db.flush()
    append_custody_entry(db, c1, "CREATED", io, "Case opened",
                         when=now - timedelta(days=18))

    docs1 = [
        ("DOC-FIR-104-01", "FIR", "First Information Report (Certified Copy)",
         "Original FIR u/s 64, 70(1) BNS and 66E IT Act", FIR_104_TEXT, io, 18),
        ("DOC-WS-104-01", "WITNESS_STATEMENT", "Statement of Eye-Witness u/s 180 BNSS",
         "Recorded statement regarding vehicle and timeline", WITNESS_104_TEXT, io, 16),
        ("DOC-CD-104-14", "CASE_DIARY", "Case Diary Volume 14",
         "Interrogation notes and CDR verification", CASE_DIARY_104_TEXT, io, 6),
        ("DOC-FSL-104-01", "FORENSIC_REPORT", "FSL Cyber & Digital Forensics Report",
         "Examination of seized handset and memory card", FSL_104_TEXT, fsl, 5),
    ]
    for doc_id, dtype, title, desc, text, officer, days_ago in docs1:
        data = text.encode("utf-8")
        stored = vault.store(c1.case_id, doc_id, data)
        d = LegalDocument(
            document_id=doc_id, case_id=c1.case_id, doc_type=dtype, title=title, description=desc,
            file_path=stored["path"], original_filename=f"{doc_id.lower()}.txt", mime_type="text/plain",
            file_size=len(data), file_hash_sha256=stored["sha256"], version=1,
            extracted_text=text, forensic_status="NOT_APPLICABLE",
            uploaded_by_id=officer.badge_id, uploaded_by_name=officer.name, uploaded_by_role=officer.role_value,
            created_at=now - timedelta(days=days_ago),
        )
        db.add(d)
        db.flush()
        action = "UPLOADED" if dtype != "FORENSIC_REPORT" else "FSL_REPORT_ATTACHED"
        append_custody_entry(db, c1, action, officer, (f"Lab report added: {title}" if dtype == "FORENSIC_REPORT" else f"File added: {title}"),
                             document_id=doc_id, payload_hash=stored["sha256"], when=now - timedelta(days=days_ago))

    append_custody_entry(db, c1, "TRANSFERRED_FSL", io, "Case sent to Forensic Lab (FSL Rohini, Cyber division) for analysis of seized devices",
                         when=now - timedelta(days=7))

    # ---- Case 88 (90-day clock, only IO/SHO) ---------------------------
    c2 = Case(
        case_id="CASE-2026-DL-00088", fir_number="FIR 88/2026",
        police_station="Special Cell, Lodhi Colony", state="Delhi", district="South Delhi",
        incident_date="2026-08-28", registration_date=now - timedelta(days=31),
        complainant_name="State", victim_name_masked=None,
        accused_names=json.dumps(["Aleksei Volkov", "Harpreet Singh"]),
        acts_sections="BNS 111(2), 318(4) & Arms Act 25",
        investigating_officer_id=io.badge_id, investigating_officer_name=io.name, sho_id="SHO-001",
        case_status="UNDER_INVESTIGATION", statutory_deadline_days=90,
        statutory_deadline_date=now - timedelta(days=31) + timedelta(days=90),
        is_women_safety_case=False, is_pocso_case=False,
        current_merkle_root=genesis_root("CASE-2026-DL-00088", "FIR 88/2026"),
    )
    db.add(c2)
    db.flush()
    append_custody_entry(db, c2, "CREATED", io, "Case opened",
                         when=now - timedelta(days=31))
    data = FIR_088_TEXT.encode("utf-8")
    stored = vault.store(c2.case_id, "DOC-FIR-088-01", data)
    db.add(LegalDocument(
        document_id="DOC-FIR-088-01", case_id=c2.case_id, doc_type="FIR", title="First Information Report",
        description="FIR u/s 111(2), 318(4) BNS & 25 Arms Act", file_path=stored["path"],
        original_filename="fir_088.txt", mime_type="text/plain", file_size=len(data),
        file_hash_sha256=stored["sha256"], extracted_text=FIR_088_TEXT, forensic_status="NOT_APPLICABLE",
        uploaded_by_id=io.badge_id, uploaded_by_name=io.name, uploaded_by_role=io.role_value,
        created_at=now - timedelta(days=31),
    ))
    db.flush()
    append_custody_entry(db, c2, "UPLOADED", io, "File added: First Information Report", document_id="DOC-FIR-088-01",
                         payload_hash=stored["sha256"], when=now - timedelta(days=31))
    db.commit()
    logger.info("Seeded demo cases")
