import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Enum
from ..db.models import Base

class OfficerRole(str, enum.Enum):
    OFFICER = "OFFICER"
    ADMIN = "ADMIN"

class Officer(Base):
    __tablename__ = "officers"

    id = Column(Integer, primary_key=True, index=True)
    badge_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(Enum(OfficerRole), default=OfficerRole.OFFICER, nullable=False)
    checkpoint_id = Column(String, default="DEL-T3-GATE-4", nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
