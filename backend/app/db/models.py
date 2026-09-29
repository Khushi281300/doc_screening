from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime, timezone
from ..core.config import settings

Base = declarative_base()
engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def utcnow():
    return datetime.now(timezone.utc)


class Case(Base):
    """Law-enforcement case record (FIR + investigation dossier)."""
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String, unique=True, index=True, nullable=False)   # CASE-2026-DL-00104
    fir_number = Column(String, index=True, nullable=False)              # FIR 104/2026
    police_station = Column(String, nullable=False)
    state = Column(String, default="Delhi")
    district = Column(String, default="Central")
    incident_date = Column(String, nullable=True)
    registration_date = Column(DateTime, default=utcnow)
    complainant_name = Column(String, nullable=True)
    victim_name_masked = Column(String, nullable=True)                   # Sec 72 BNS
    accused_names = Column(Text, nullable=True)                          # JSON list
    acts_sections = Column(String, nullable=False)
    investigating_officer_id = Column(String, nullable=False)
    investigating_officer_name = Column(String, nullable=True)
    sho_id = Column(String, nullable=True)
    # UNDER_INVESTIGATION, FSL_PENDING, CHARGE_SHEET_DRAFTED, CHARGE_SHEET_FILED, IN_TRIAL, DISPOSED
    case_status = Column(String, default="UNDER_INVESTIGATION")
    statutory_deadline_days = Column(Integer, default=60)               # Sec 193 BNSS
    statutory_deadline_date = Column(DateTime, nullable=True)
    is_women_safety_case = Column(Boolean, default=True)
    is_pocso_case = Column(Boolean, default=False)
    # Which agencies currently have access (JSON list of roles)
    shared_with_roles = Column(Text, default='["INVESTIGATING_OFFICER","STATION_HOUSE_OFFICER"]')
    is_locked = Column(Boolean, default=False)                          # SHO lock: no new versions
    current_merkle_root = Column(String, nullable=True)
    created_at = Column(DateTime, default=utcnow)


class LegalDocument(Base):
    """A versioned case document: FIR, case diary, statement, FSL report, charge sheet, exhibit, court order."""
    __tablename__ = "legal_documents"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String, unique=True, index=True, nullable=False)
    case_id = Column(String, index=True, nullable=False)
    doc_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String, nullable=False)          # encrypted-at-rest file in the vault
    original_filename = Column(String, nullable=True)
    mime_type = Column(String, nullable=True)
    file_size = Column(Integer, default=0)
    file_hash_sha256 = Column(String, index=True, nullable=False)
    version = Column(Integer, default=1)
    supersedes_document_id = Column(String, nullable=True)  # previous version
    is_current_version = Column(Boolean, default=True)
    extracted_text = Column(Text, nullable=True)           # for full-text search + redaction

    is_redacted = Column(Boolean, default=False)
    redacted_text = Column(Text, nullable=True)
    redaction_summary = Column(Text, nullable=True)        # JSON

    is_forensic_screened = Column(Boolean, default=False)
    forensic_tamper_score = Column(Float, default=0.0)
    forensic_status = Column(String, default="NOT_APPLICABLE")  # CLEAN, SUSPICIOUS, TAMPER_DETECTED, NOT_APPLICABLE
    forensic_report_json = Column(Text, nullable=True)

    uploaded_by_id = Column(String, nullable=False)
    uploaded_by_name = Column(String, nullable=True)
    uploaded_by_role = Column(String, default="INVESTIGATING_OFFICER")
    created_at = Column(DateTime, default=utcnow)


class ChainOfCustodyLog(Base):
    """Tamper-evident SHA-256 hash chain. Each entry's root = SHA256(previous_root : action : payload)."""
    __tablename__ = "chain_of_custody_logs"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String, index=True, nullable=False)
    document_id = Column(String, index=True, nullable=True)
    action = Column(String, nullable=False)
    performed_by_id = Column(String, nullable=False)
    performed_by_name = Column(String, nullable=True)
    performed_by_role = Column(String, nullable=False)
    ip_or_device_id = Column(String, default="POLICE-TERMINAL-01")
    details = Column(Text, nullable=True)
    payload_hash = Column(String, nullable=True)
    previous_merkle_root = Column(String, nullable=True)
    current_merkle_root = Column(String, nullable=False)
    digital_signature = Column(String, nullable=False)   # HMAC-SHA256 over the entry
    timestamp = Column(DateTime, default=utcnow)


class BSACertificate(Base):
    """Bharatiya Sakshya Adhiniyam 2023 - Section 63 electronic evidence certificate."""
    __tablename__ = "bsa_certificates"

    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String, unique=True, index=True, nullable=False)
    case_id = Column(String, index=True, nullable=False)
    document_id = Column(String, index=True, nullable=False)
    statutory_clause = Column(String, default="Bharatiya Sakshya Adhiniyam, 2023 - Section 63(4)")
    certifying_officer_id = Column(String, nullable=False)
    certifying_officer_name = Column(String, nullable=False)
    certifying_officer_designation = Column(String, default="Inspector / Station House Officer")
    police_station = Column(String, nullable=False)
    document_title = Column(String, nullable=False)
    document_sha256 = Column(String, nullable=False)
    terminal_hardware_hash = Column(String, nullable=False)
    merkle_root = Column(String, nullable=False)
    digital_signature = Column(String, nullable=False)
    legal_declaration = Column(Text, nullable=True)
    qr_payload = Column(Text, nullable=False)
    issued_at = Column(DateTime, default=utcnow)


def init_db():
    from ..models.officer import Officer  # noqa: F401 - registers table
    from .seed import seed_demo_officers, seed_demo_cases
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_officers(db)
        seed_demo_cases(db)
    finally:
        db.close()
