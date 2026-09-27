"""
ARGUS Module 2 — Dedicated Document Validation Engine
Validates document structure, chronological integrity, and format adherence 
independently of MRZ checksums.

Checks:
1. Chronological Logic: DOB < Issue Date < Expiry Date, age sanity
2. Field Formats: ISO 3166-1 alpha-3 country codes, gender codes, regex patterns
3. Document Layout Structure: Spatial placement of photo, header, details, and MRZ
"""

import re
import datetime
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

logger = logging.getLogger("argus.validation")

# Standard ISO 3166-1 Alpha-3 codes + Official ICAO test codes (UTO = Utopia, D<< = Germany, etc.)
VALID_ISO_COUNTRY_CODES = {
    "AFG", "ALB", "DZA", "AND", "AGO", "ATG", "ARG", "ARM", "AUS", "AUT", "AZE",
    "BHS", "BHR", "BGD", "BRB", "BLR", "BEL", "BLZ", "BEN", "BTN", "BOL", "BIH",
    "BWA", "BRA", "BRN", "BGR", "BFA", "BDI", "KHM", "CMR", "CAN", "CPV", "CAF",
    "TCD", "CHL", "CHN", "COL", "COM", "COG", "CRI", "CIV", "HRV", "CUB", "CYP",
    "CZE", "DNK", "DJI", "DMA", "DOM", "ECU", "EGY", "SLV", "GNQ", "ERI", "EST",
    "ETH", "FJI", "FIN", "FRA", "GAB", "GMB", "GEO", "DEU", "GHA", "GRC", "GRD",
    "GTM", "GIN", "GNB", "GUY", "HTI", "HND", "HUN", "ISL", "IND", "IDN", "IRN",
    "IRQ", "IRL", "ISR", "ITA", "JAM", "JPN", "JOR", "KAZ", "KEN", "KIR", "PRK",
    "KOR", "KWT", "KGZ", "LAO", "LVA", "LBN", "LSO", "LBR", "LBY", "LIE", "LTU",
    "LUX", "MDG", "MWI", "MYS", "MDV", "MLI", "MLT", "MHL", "MRT", "MUS", "MEX",
    "FSM", "MDA", "MCO", "MNG", "MNE", "MAR", "MOZ", "MMR", "NAM", "NRU", "NPL",
    "NLD", "NZL", "NIC", "NER", "NGA", "MKD", "NOR", "OMN", "PAK", "PLW", "PAN",
    "PNG", "PRY", "PER", "PHL", "POL", "PRT", "QAT", "ROU", "RUS", "RWA", "KNA",
    "LCA", "VCT", "WSM", "SMR", "STP", "SAU", "SEN", "SRB", "SYC", "SLE", "SGP",
    "SVK", "SVN", "SLB", "SOM", "ZAF", "SSD", "ESP", "LKA", "SDN", "SUR", "SWE",
    "CHE", "SYR", "TWN", "TJK", "TZA", "THA", "TLS", "TGO", "TON", "TTO", "TUN",
    "TUR", "TKM", "TUV", "UGA", "UKR", "ARE", "GBR", "USA", "URY", "UZB", "VUT",
    "VEN", "VNM", "YEM", "ZMB", "ZWE", "UTO", "UNA", "UNK", "XOM", "XXA", "XXB", "XXX"
}

VALID_GENDERS = {"M", "F", "X", "<", "FEMALE", "MALE", "NON-BINARY"}

@dataclass
class DocumentValidationResult:
    validation_status: str  # VALID, SUSPICIOUS, INVALID
    validation_score: float  # 0 to 100
    chronological_integrity: bool
    format_anomalies: List[str]
    layout_anomalies: List[str]
    details: Dict[str, Any]


def _parse_date(date_str: Optional[str]) -> Optional[datetime.date]:
    """Tries multiple date parsing schemes (YYYY-MM-DD, YYMMDD, DD/MM/YYYY)."""
    if not date_str:
        return None
    cleaned = re.sub(r'[^0-9]', '', str(date_str))
    
    # 8-digit format YYYYMMDD
    if len(cleaned) == 8:
        try:
            return datetime.date(int(cleaned[:4]), int(cleaned[4:6]), int(cleaned[6:8]))
        except ValueError:
            pass
            
    # 6-digit format YYMMDD (ICAO standard)
    if len(cleaned) == 6:
        try:
            yy = int(cleaned[:2])
            current_yy = datetime.date.today().year % 100
            # If yy > current_yy + 15, assume 1900s, else 2000s
            year = (1900 + yy) if yy > (current_yy + 15) else (2000 + yy)
            return datetime.date(year, int(cleaned[2:4]), int(cleaned[4:6]))
        except ValueError:
            pass
            
    # Try standard string splits
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"):
        try:
            return datetime.datetime.strptime(str(date_str).strip(), fmt).date()
        except ValueError:
            pass
            
    return None


def validate_document_standards(
    document_fields: Any,
    doc_type: Any = "PASSPORT",
    layout_meta: Optional[Dict[str, Any]] = None
) -> DocumentValidationResult:
    """
    Module 2 Core Function:
    Validates field formatting, chronological validity, and layout structure.
    """
    # Accommodate callers passing (doc_type, document_fields) as well as (document_fields, doc_type)
    if isinstance(document_fields, str) and isinstance(doc_type, dict):
        doc_type, document_fields = document_fields, doc_type
    elif not isinstance(document_fields, dict):
        document_fields = {}

    format_anomalies: List[str] = []
    layout_anomalies: List[str] = []
    score = 100.0
    chronological_ok = True

    # -------------------------------------------------------------
    # 1. Chronological & Date Logic Validation
    # -------------------------------------------------------------
    dob_raw = document_fields.get("date_of_birth") or document_fields.get("dob")
    exp_raw = document_fields.get("expiry_date") or document_fields.get("expiration_date") or document_fields.get("date_of_expiry")
    issue_raw = document_fields.get("issue_date") or document_fields.get("date_of_issue")

    dob = _parse_date(dob_raw)
    expiry = _parse_date(exp_raw)
    issue = _parse_date(issue_raw)
    today = datetime.date.today()

    if dob_raw and not dob:
        format_anomalies.append(f"Invalid Date of Birth format: '{dob_raw}'")
        score -= 15.0

    if exp_raw and not expiry:
        format_anomalies.append(f"Invalid Expiry Date format: '{exp_raw}'")
        score -= 20.0

    if dob and expiry:
        if expiry <= dob:
            chronological_ok = False
            format_anomalies.append(f"Chronological Violation: Expiry date ({expiry}) is before or equal to Date of Birth ({dob})")
            score -= 35.0

    if dob:
        age_years = (today - dob).days / 365.25
        if age_years < 0:
            chronological_ok = False
            format_anomalies.append(f"Chronological Violation: Date of Birth ({dob}) is in the future")
            score -= 40.0
        elif age_years > 115:
            format_anomalies.append(f"Suspicious Age: Document holder calculated age is {int(age_years)} years")
            score -= 10.0

    if issue and dob:
        if issue <= dob:
            chronological_ok = False
            format_anomalies.append(f"Chronological Violation: Issue date ({issue}) precedes Date of Birth ({dob})")
            score -= 30.0

    if issue and expiry:
        if expiry <= issue:
            chronological_ok = False
            format_anomalies.append(f"Chronological Violation: Expiry date ({expiry}) precedes Issue date ({issue})")
            score -= 35.0
            
    if expiry and expiry < today:
        format_anomalies.append(f"Document Expired: Validity ended on {expiry} ({today.year - expiry.year} years ago)")
        score -= 25.0

    # -------------------------------------------------------------
    # 2. Field-Format Validation
    # -------------------------------------------------------------
    # Nationality / Country
    country = str(document_fields.get("issuing_country") or document_fields.get("nationality") or "").upper().strip()
    if country:
        # Standardize 3-letter code
        c_code = country[:3]
        if c_code not in VALID_ISO_COUNTRY_CODES:
            format_anomalies.append(f"Invalid Country Code: '{country}' does not match ISO 3166-1 alpha-3 standards")
            score -= 15.0

    # Gender
    gender = str(document_fields.get("gender") or document_fields.get("sex") or "").upper().strip()
    if gender and gender not in VALID_GENDERS:
        format_anomalies.append(f"Invalid Gender Code: '{gender}'. Standard values are M, F, or X")
        score -= 10.0

    # Document Number Format
    doc_num = str(document_fields.get("document_number") or "").upper().strip()
    if doc_num:
        if len(doc_num) < 6:
            format_anomalies.append(f"Abnormally Short Document Number: '{doc_num}' ({len(doc_num)} chars)")
            score -= 20.0
        elif not re.match(r'^[A-Z0-9< -]+$', doc_num):
            format_anomalies.append(f"Document Number contains illegal symbols: '{doc_num}'")
            score -= 15.0

    # -------------------------------------------------------------
    # 3. Document Layout Validation (Spatial Structure)
    # -------------------------------------------------------------
    if layout_meta:
        # Check photo positioning (expected in left or right 45% quadrant, upper half)
        photo_box = layout_meta.get("photo_box")  # [x, y, w, h] in normalized 0-1
        if photo_box:
            px, py, pw, ph = photo_box
            # If photo is in the bottom 25% where MRZ belongs -> severe layout tamper
            if py > 0.70:
                layout_anomalies.append("Structural Anomaly: Portrait photo detected in bottom MRZ zone")
                score -= 35.0
            # If photo aspect ratio is abnormally stretched (<0.6 or >1.6)
            p_aspect = pw / max(ph, 0.01)
            if p_aspect < 0.55 or p_aspect > 1.45:
                layout_anomalies.append(f"Structural Anomaly: Portrait dimensions distorted (aspect ratio {p_aspect:.2f})")
                score -= 15.0

        # Check MRZ position
        mrz_pos = layout_meta.get("mrz_position")
        if mrz_pos == "TOP" or mrz_pos == "CENTER":
            layout_anomalies.append(f"Structural Anomaly: Machine-Readable Zone detected in {mrz_pos} region instead of bottom standard")
            score -= 40.0

    # Determine Status
    final_score = max(0.0, min(100.0, round(score, 1)))
    if final_score >= 85.0 and len(format_anomalies) == 0:
        status = "VALID"
    elif final_score >= 60.0:
        status = "SUSPICIOUS"
    else:
        status = "INVALID"

    return DocumentValidationResult(
        validation_status=status,
        validation_score=final_score,
        chronological_integrity=chronological_ok,
        format_anomalies=format_anomalies,
        layout_anomalies=layout_anomalies,
        details={
            "age_calculated": int((today - dob).days / 365.25) if dob else None,
            "is_expired": bool(expiry and expiry < today),
            "iso_country_valid": bool(country[:3] in VALID_ISO_COUNTRY_CODES) if country else True,
            "total_violations": len(format_anomalies) + len(layout_anomalies)
        }
    )
