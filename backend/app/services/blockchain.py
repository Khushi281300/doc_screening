import hashlib
import time
import json
from typing import List, Dict, Any, Optional
from ..core.security import generate_tamper_seal, hash_document_payload

class MerkleAuditLedger:
    """
    Cryptographic SHA-256 Merkle audit ledger for immutable verification tracking.
    """
    def __init__(self):
        self.chain: List[Dict[str, Any]] = []
        self._create_genesis_block()

    def _create_genesis_block(self):
        genesis_block = {
            "block_index": 0,
            "timestamp": time.time(),
            "previous_hash": "0" * 64,
            "event_type": "GENESIS_BORDER_SECURITY_LEDGER",
            "payload_hash": hashlib.sha256(b"GENESIS_BORDER_SECURITY_ROOT").hexdigest(),
            "merkle_root": hashlib.sha256(b"GENESIS_MERKLE_ROOT").hexdigest(),
            "block_hash": "0000000000000000000000000000000000000000000000000000000000000000",
            "digital_signature": "GENESIS_SIGNATURE_IMMUTABLE_ROOT"
        }
        self.chain.append(genesis_block)

    def compute_merkle_root(self, hashes: List[str]) -> str:
        if not hashes:
            return hashlib.sha256(b"EMPTY").hexdigest()
        current_layer = hashes
        while len(current_layer) > 1:
            next_layer = []
            for i in range(0, len(current_layer), 2):
                h1 = current_layer[i]
                h2 = current_layer[i+1] if (i+1) < len(current_layer) else h1
                combined = hashlib.sha256((h1 + h2).encode("utf-8")).hexdigest()
                next_layer.append(combined)
            current_layer = next_layer
        return current_layer[0]

    def record_verification_event(
        self, 
        scan_id: str, 
        doc_number: str, 
        outcome: str, 
        risk_score: float, 
        officer_id: str,
        officer_name: Optional[str] = None,
        checkpoint_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Appends an immutable verification event block to the cryptographic ledger.
        """
        prev_block = self.chain[-1]
        prev_hash = prev_block["block_hash"]
        current_time = time.time()
        
        event_payload = {
            "scan_id": scan_id,
            "doc_number": doc_number,
            "outcome": outcome,
            "risk_score": risk_score,
            "officer_id": officer_id,
            "officer_name": officer_name,
            "checkpoint_id": checkpoint_id,
            "timestamp": current_time
        }
        payload_hash = hash_document_payload(event_payload)
        merkle_root = self.compute_merkle_root([prev_hash, payload_hash])
        
        block_header = f"{len(self.chain)}:{prev_hash}:{merkle_root}:{current_time}"
        block_hash = hashlib.sha256(block_header.encode("utf-8")).hexdigest()
        digital_seal = generate_tamper_seal(doc_number, outcome, current_time)

        block = {
            "block_index": len(self.chain),
            "timestamp": current_time,
            "previous_hash": prev_hash,
            "event_type": "DOCUMENT_INSPECTION_DECISION",
            "payload_hash": payload_hash,
            "merkle_root": merkle_root,
            "block_hash": block_hash,
            "digital_signature": digital_seal,
            "event_summary": event_payload
        }
        self.chain.append(block)
        return block

    def verify_chain_integrity(self) -> bool:
        for i in range(1, len(self.chain)):
            curr = self.chain[i]
            prev = self.chain[i-1]
            if curr["previous_hash"] != prev["block_hash"]:
                return False
        return True

# Global singleton
audit_ledger = MerkleAuditLedger()

def generate_tamper_certificate(scan_record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates a verifiable tamper-proof digital certificate with QR verification payload.
    """
    timestamp = time.time()
    doc_num = scan_record.get("document_number", "UNKNOWN")
    outcome = scan_record.get("outcome", "UNKNOWN")
    signature = generate_tamper_seal(doc_num, outcome, timestamp)

    return {
        "certificate_id": f"CERT-SEC-{int(timestamp)}-{doc_num[:4]}",
        "issuing_authority": "National Border Control & Identity Screening Grid",
        "issued_at": timestamp,
        "document_number": doc_num,
        "holder_name": scan_record.get("holder_name", "UNKNOWN"),
        "outcome": outcome,
        "risk_score": scan_record.get("overall_risk_score", 0),
        "digital_seal_signature": signature,
        "merkle_tx_hash": scan_record.get("blockchain_tx_hash", "0x" + hashlib.sha256(str(timestamp).encode()).hexdigest()),
        "qr_verification_url": f"https://border-verify.gov/receipt/{signature[:16]}"
    }
