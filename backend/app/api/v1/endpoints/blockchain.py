from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from ....services.blockchain import audit_ledger, generate_tamper_certificate

router = APIRouter()

class CertificateRequest(BaseModel):
    scan_record: Dict[str, Any]

@router.get("/ledger/blocks", tags=["Blockchain & Ledger"])
@router.get("/chain", tags=["Blockchain & Ledger"])
async def get_blockchain_ledger():
    return {
        "status": "SUCCESS",
        "total_blocks": len(audit_ledger.chain),
        "chain_valid": audit_ledger.verify_chain_integrity(),
        "blocks": audit_ledger.chain
    }

@router.post("/certificate/generate", tags=["Blockchain & Ledger"])
async def generate_certificate_endpoint(req: CertificateRequest):
    cert = generate_tamper_certificate(req.scan_record)
    return {
        "status": "SUCCESS",
        "certificate": cert
    }
