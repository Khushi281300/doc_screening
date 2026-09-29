import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Enum
from ..db.models import Base


class OfficerRole(str, enum.Enum):
    INVESTIGATING_OFFICER = "INVESTIGATING_OFFICER"
    STATION_HOUSE_OFFICER = "STATION_HOUSE_OFFICER"
    FSL_EXAMINER = "FSL_EXAMINER"
    PUBLIC_PROSECUTOR = "PUBLIC_PROSECUTOR"
    MAGISTRATE = "MAGISTRATE"


ROLE_LABELS = {
    "INVESTIGATING_OFFICER": "Investigating Officer (IO)",
    "STATION_HOUSE_OFFICER": "Station House Officer (SHO)",
    "FSL_EXAMINER": "FSL Examiner",
    "PUBLIC_PROSECUTOR": "Public Prosecutor",
    "MAGISTRATE": "Magistrate / Court",
}


class Officer(Base):
    __tablename__ = "officers"

    id = Column(Integer, primary_key=True, index=True)
    badge_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(Enum(OfficerRole), default=OfficerRole.INVESTIGATING_OFFICER, nullable=False)
    # Agency / terminal identifier used in the custody log (e.g. PS Crime Branch, FSL Rohini, Saket Court)
    station_id = Column(String, default="POLICE-TERMINAL-01", nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def role_value(self) -> str:
        return self.role.value if hasattr(self.role, "value") else str(self.role)
