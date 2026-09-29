import re
from typing import Dict, Any, List, Tuple

class VictimPrivacyRedactor:
    """
    Automated Named Entity Masking for Bharatiya Nyaya Sanhita (BNS) Section 72
    and POCSO Act Compliance (Protection of Victim & Minor Identities).
    """

    # High-risk legal entity patterns in Indian FIRs and witness depositions
    PHONE_REGEX = re.compile(r'(\+91[\-\s]?)?[6-9]\d{9}')
    EMAIL_REGEX = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')
    AADHAAR_REGEX = re.compile(r'\b\d{4}\s\d{4}\s\d{4}\b')
    PAN_REGEX = re.compile(r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b')
    # "H.No 42, Sector 15, Rohini, Delhi, PIN: 110085" -> masked up to end of line / sentence
    ADDRESS_REGEX = re.compile(
        r'(?:residing at|r/o|R/O|address[:\s]+)?\b(?:H\.?\s?No\.?|House No\.?|Flat No\.?|Gali No\.?|Plot No\.?)\s*[^\n]*?(?=[\n]|\.\s|$)',
        re.IGNORECASE)
    PIN_REGEX = re.compile(r'\bPIN(?:\s?Code)?[:\s]*\d{6}\b', re.IGNORECASE)

    def redact_text(self, text: str, victim_name: str = None, extra_names: List[str] = None) -> Tuple[str, Dict[str, Any]]:
        """
        Redacts sensitive victim PII and returns masked text plus audit metadata.
        """
        masked = text
        redactions: List[Dict[str, str]] = []

        # 1. Mask explicit victim / protected names if known
        names = [n for n in ([victim_name] + list(extra_names or [])) if n and len(n.strip()) > 2]
        for idx, name in enumerate(names):
            pattern = re.compile(re.escape(name.strip()), re.IGNORECASE)
            matches = list(pattern.finditer(masked))
            if matches:
                redactions.append({
                    "entity_type": "VICTIM_NAME" if idx == 0 else "PROTECTED_WITNESS_NAME",
                    "count": len(matches),
                    "rule": "BNS Section 72(1) (formerly Sec 228A IPC)"
                })
                masked = pattern.sub("[REDACTED - IDENTITY PROTECTED U/S 72 BNS]", masked)

        # 1b. Mask residential addresses
        addr_matches = list(self.ADDRESS_REGEX.finditer(masked))
        if addr_matches:
            redactions.append({"entity_type": "RESIDENTIAL_ADDRESS", "count": len(addr_matches),
                               "rule": "BNS Section 72 / Witness Protection Scheme 2018"})
            masked = self.ADDRESS_REGEX.sub("[REDACTED - ADDRESS]", masked)
        pin_matches = list(self.PIN_REGEX.finditer(masked))
        if pin_matches:
            redactions.append({"entity_type": "PIN_CODE", "count": len(pin_matches), "rule": "BNS Section 72"})
            masked = self.PIN_REGEX.sub("[REDACTED - PIN]", masked)

        # 2. Mask Aadhaar numbers
        aadhaar_matches = list(self.AADHAAR_REGEX.finditer(masked))
        if aadhaar_matches:
            redactions.append({
                "entity_type": "AADHAAR_UID",
                "count": len(aadhaar_matches),
                "rule": "Aadhaar Act & Digital Personal Data Protection Act 2023"
            })
            masked = self.AADHAAR_REGEX.sub("[REDACTED - AADHAAR ID]", masked)

        # 3. Mask Phone Numbers
        phone_matches = list(self.PHONE_REGEX.finditer(masked))
        if phone_matches:
            redactions.append({
                "entity_type": "PHONE_NUMBER",
                "count": len(phone_matches),
                "rule": "Privacy & Witness Protection Scheme"
            })
            masked = self.PHONE_REGEX.sub("[REDACTED - CONTACT NUMBER]", masked)

        # 4. Mask Emails
        email_matches = list(self.EMAIL_REGEX.finditer(masked))
        if email_matches:
            redactions.append({
                "entity_type": "EMAIL_ADDRESS",
                "count": len(email_matches),
                "rule": "Privacy Protection"
            })
            masked = self.EMAIL_REGEX.sub("[REDACTED - EMAIL]", masked)

        # 5. Mask PAN Numbers
        pan_matches = list(self.PAN_REGEX.finditer(masked))
        if pan_matches:
            redactions.append({
                "entity_type": "PAN_IDENTIFIER",
                "count": len(pan_matches),
                "rule": "Financial Privacy Protection"
            })
            masked = self.PAN_REGEX.sub("[REDACTED - PAN]", masked)

        summary = {
            "statutory_act": "Bharatiya Nyaya Sanhita (BNS) 2023 - Section 72",
            "protection_domain": "NCRB Women Safety & Witness Identity Protection",
            "total_redactions": sum(r["count"] for r in redactions),
            "redacted_entities": redactions,
            "status": "COMPLIANT_PROTECTED"
        }

        return masked, summary

victim_redactor = VictimPrivacyRedactor()
