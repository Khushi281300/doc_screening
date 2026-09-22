from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime, timezone
import json
from ..core.config import settings

Base = declarative_base()
engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class DocumentScan(Base):
    __tablename__ = "document_scans"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(String, unique=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    officer_id = Column(String, default="OFFICER-742")
    officer_name = Column(String, nullable=True)
    checkpoint_id = Column(String, default="BOMBAY-INTL-T2-E4")
    
    # Document Fields
    doc_type = Column(String)  # PASSPORT, VISA, NATIONAL_ID
    issuing_country = Column(String)
    document_number = Column(String, index=True)
    holder_name = Column(String)
    date_of_birth = Column(String)
    expiry_date = Column(String)
    gender = Column(String)
    nationality = Column(String)
    
    # Decision Outcome
    outcome = Column(String)  # VERIFIED, MANUAL_REVIEW, REJECTED
    overall_risk_score = Column(Float)
    confidence_score = Column(Float)
    
    # Forensic Scores
    ela_score = Column(Float)
    srm_score = Column(Float)
    moire_score = Column(Float)
    copy_move_detected = Column(Boolean, default=False)
    mrz_valid = Column(Boolean, default=True)
    face_match_score = Column(Float)
    liveness_score = Column(Float)
    
    # Detailed Explainability Payload (JSON)
    explainability_json = Column(Text)
    blockchain_tx_hash = Column(String)
    merkle_root = Column(String)

class BlacklistEntry(Base):
    __tablename__ = "blacklist_entries"

    id = Column(Integer, primary_key=True, index=True)
    document_number = Column(String, unique=True, index=True)
    holder_name = Column(String)
    reason = Column(String)  # FRAUD, STOLEN_DOCUMENT, INTERPOL_RED_NOTICE, EXPIRED_VISA
    severity = Column(String)  # CRITICAL, HIGH, MEDIUM
    listed_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    active = Column(Boolean, default=True)

class AuditLedgerBlock(Base):
    __tablename__ = "audit_ledger_blocks"

    block_index = Column(Integer, primary_key=True, index=True)
    previous_hash = Column(String)
    merkle_root = Column(String)
    block_hash = Column(String, unique=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    event_type = Column(String)
    payload_hash = Column(String)
    digital_signature = Column(String)

def init_db():
    from ..models.officer import Officer  # noqa: F401 - registers Officer table with Base
    from .seed import seed_demo_officers
    from sqlalchemy import text
    Base.metadata.create_all(bind=engine)
    
    # Auto-migrate document_scans table if officer_name column is missing in existing sqlite DB
    with engine.connect() as conn:
        try:
            res = conn.execute(text("PRAGMA table_info(document_scans)"))
            columns = [row[1] for row in res.fetchall()]
            if columns and "officer_name" not in columns:
                conn.execute(text("ALTER TABLE document_scans ADD COLUMN officer_name VARCHAR"))
                conn.commit()
        except Exception:
            pass

    db = SessionLocal()
    # Seed sample blacklist if empty
    if db.query(BlacklistEntry).count() == 0:
        sample_entries = [
            BlacklistEntry(
                document_number="X99887766",
                holder_name="VIKTOR REZNIKOV",
                reason="INTERPOL_RED_NOTICE - Counterfeit Syndicate",
                severity="CRITICAL",
                active=True
            ),
            BlacklistEntry(
                document_number="P12345678",
                holder_name="MARCUS VANCE",
                reason="STOLEN_PASSPORT_DATABASE - Lost in Transit",
                severity="HIGH",
                active=True
            ),
            BlacklistEntry(
                document_number="N55443322",
                holder_name="ALEKSEI VOLKOV",
                reason="TRAVEL_BAN_FLAG - Visa Overstay & Identity Fraud",
                severity="CRITICAL",
                active=True
            ),
        ]
        db.add_all(sample_entries)
        db.commit()

    # Seed demo officers if empty
    seed_demo_officers(db)
    db.close()
