"""
Section 63, Bharatiya Sakshya Adhiniyam 2023 - certificate for admissibility of
an electronic record (successor of Sec 65B, Indian Evidence Act).

The certificate binds: document SHA-256, the case custody-chain root at the
moment of issue, the issuing terminal, the certifying officer and the time.
It is signed with HMAC-SHA256 under the server secret so it can be re-verified.
"""
import hashlib
import hmac
import platform
from datetime import datetime, timezone
from typing import Dict, Any

from ...core.config import settings


class BSACertificateGenerator:

    @staticmethod
    def terminal_id() -> str:
        raw = f"{platform.node()}:{platform.machine()}:{platform.system()}"
        return "TERM-" + hashlib.sha256(raw.encode()).hexdigest()[:16].upper()

    @classmethod
    def sign(cls, cert_id: str, case_id: str, document_sha256: str, merkle_root: str,
             terminal: str, iso_time: str) -> str:
        material = f"{cert_id}:{case_id}:{document_sha256}:{merkle_root}:{terminal}:{iso_time}"
        return hmac.new(settings.SECRET_SALT.encode(), material.encode(), hashlib.sha256).hexdigest()

    @classmethod
    def generate_certificate_payload(cls, case_id: str, fir_number: str, police_station: str,
                                     document_id: str, document_title: str, document_sha256: str,
                                     merkle_root: str, officer_id: str, officer_name: str,
                                     officer_designation: str) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        iso_time = now.isoformat()
        cert_id = f"BSA63-{now.strftime('%Y%m%d%H%M%S')}-{document_sha256[:8].upper()}"
        terminal = cls.terminal_id()
        signature = cls.sign(cert_id, case_id, document_sha256, merkle_root, terminal, iso_time)

        declaration = (
            f"I, {officer_name}, {officer_designation}, {police_station}, certify under Section 63(4) of the "
            f"Bharatiya Sakshya Adhiniyam, 2023 that the electronic record titled '{document_title}' "
            f"(SHA-256: {document_sha256}) relating to {fir_number} was produced by a computer system under "
            f"lawful control in the regular course of investigation, that the system was operating properly, "
            f"and that the record's integrity is anchored in the CHRONICLE custody chain "
            f"(root {merkle_root[:16]}…) without alteration."
        )

        return {
            "certificate_id": cert_id,
            "statutory_act": "Bharatiya Sakshya Adhiniyam, 2023",
            "statutory_section": "Section 63 (Sub-section 4)",
            "supersedes_legacy_law": "Indian Evidence Act, 1872 - Section 65B",
            "case_id": case_id,
            "fir_number": fir_number,
            "police_station": police_station,
            "document_id": document_id,
            "document_title": document_title,
            "document_sha256": document_sha256,
            "merkle_root": merkle_root,
            "terminal_hardware_hash": terminal,
            "certifying_officer": {"id": officer_id, "name": officer_name, "designation": officer_designation},
            "digital_signature": signature,
            "signature_scheme": "HMAC-SHA256 (server key)",
            "legal_declaration": declaration,
            "qr_verification_url": f"/api/v1/cases/{case_id}/certificates/{cert_id}/verify",
            "issued_at": iso_time,
        }


bsa_generator = BSACertificateGenerator()
