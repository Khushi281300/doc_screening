import json
import logging
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional
from ...core.config import settings

logger = logging.getLogger("aegis.local_llm")

def get_llm_health() -> Dict[str, Any]:
    """Checks whether the local Ollama daemon is alive and lists installed models."""
    tags_url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/tags"
    req = urllib.request.Request(tags_url, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=2.0) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                models = [m.get("name") for m in data.get("models", [])]
                active_model = settings.OLLAMA_MODEL
                is_model_present = any(active_model in m for m in models)
                return {
                    "online": True,
                    "active_model": active_model,
                    "model_available": is_model_present,
                    "installed_models": models,
                    "base_url": settings.OLLAMA_BASE_URL
                }
    except Exception as e:
        logger.debug(f"Ollama health check failed: {e}")
    return {
        "online": False,
        "active_model": settings.OLLAMA_MODEL,
        "model_available": False,
        "installed_models": [],
        "base_url": settings.OLLAMA_BASE_URL,
        "fallback_mode": "Offline Forensic Rule Engine"
    }

def _query_ollama(
    prompt: str, 
    model: Optional[str] = None, 
    timeout_seconds: Optional[float] = None
) -> Optional[str]:
    """Attempts to prompt a local Ollama instance. Returns None on timeout or offline."""
    target_model = model or settings.OLLAMA_MODEL
    timeout = timeout_seconds if timeout_seconds is not None else settings.OLLAMA_TIMEOUT
    endpoint = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/generate"

    payload = {
        "model": target_model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.2,
            "top_p": 0.9,
            "num_predict": 300
        }
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=data,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            if response.status == 200:
                result = json.loads(response.read().decode("utf-8"))
                return result.get("response", "").strip()
    except Exception as e:
        logger.debug(f"Local Ollama unreachable or timed out ({e}). Using offline intelligence fallback.")
    return None

def generate_template_dossier(scan_data: Dict[str, Any]) -> str:
    """
    100% offline, deterministic, courtroom-ready forensic intelligence briefing.
    Fuses all technical indicators into plain-English officer guidance.
    """
    risk = scan_data.get("risk_evaluation", {})
    outcome = risk.get("outcome", "MANUAL_REVIEW")
    score = risk.get("overall_risk_score", 50.0)
    confidence = risk.get("confidence_score", 95.0)
    doc_fields = scan_data.get("document_fields", {})
    doc_num = doc_fields.get("document_number", "UNKNOWN")
    holder = doc_fields.get("full_name", "UNKNOWN TRAVELER")
    country = doc_fields.get("issuing_country", "UNKNOWN")
    
    criticals = risk.get("critical_failures", [])
    warnings = risk.get("warning_flags", [])
    forensics = scan_data.get("forensics_metrics", {})
    biometrics = scan_data.get("biometrics", {})
    db_check = scan_data.get("database_check", {})

    dossier_sections = []

    # 1. Header & Primary Verdict
    if outcome == "VERIFIED":
        dossier_sections.append(
            f"SECURITY BRIEFING: Document {doc_num} held by {holder} (Nationality: {country}) "
            f"has been verified with {confidence}% confidence (Authenticity Score: {score}/100). "
            f"All forensic, mathematical, and identity checks have cleared without anomaly."
        )
    elif outcome == "REJECTED":
        dossier_sections.append(
            f"CRITICAL FRAUD ALERT: Immediate confiscation and secondary escalation recommended for document {doc_num} "
            f"presented by {holder}. The screening system rejected this credential with risk score {score}/100 "
            f"due to {len(criticals)} fatal security failure(s)."
        )
    else:
        dossier_sections.append(
            f"SECONDARY INSPECTION ADVISORY: Document {doc_num} ({holder}) scored {score}/100 "
            f"(Amber Zone). While no fatal counterfeit indicators were confirmed, multiple borderline signals "
            f"warrant physical verification at secondary inspection."
        )

    # 2. Key Forensic Findings
    findings = []
    if criticals:
        findings.append("FATAL VIOLATIONS: " + "; ".join(criticals))
    
    # Check ELA
    ela = forensics.get("ela", {})
    if ela.get("is_spliced"):
        findings.append(f"Digital Splicing: Error Level Analysis detected compression delta inconsistency (tamper ratio: {ela.get('tamper_ratio', 0.0):.2f}).")
    
    # Check Checksums
    if not doc_fields.get("all_check_digits_valid", True):
        findings.append("ICAO Doc 9303 Violation: Check-digit 7-3-1 weight algorithms failed on document number, birth date, or composite security field.")
        
    # Check Screen Recapture
    recapture = forensics.get("recapture", {})
    if recapture.get("is_screen_recaptured"):
        findings.append(f"Screen Replay Forgery: 2D FFT spectral peak analysis detected a digital display pixel raster (ratio: {recapture.get('peak_to_mean_ratio', 0.0):.2f}).")

    # Check Biometrics
    if biometrics.get("verdict") == "MISMATCH":
        sim = biometrics.get("similarity_percentage", 0.0)
        findings.append(f"Biometric Impersonation: Traveler webcam face does not match passport portrait (Cosine similarity: {sim:.1f}% vs threshold 72%).")
    elif not biometrics.get("is_live", True):
        findings.append(f"Liveness Anti-Spoofing: Passive facial texture variance flagged potential presentation attack ({biometrics.get('spoof_classification', 'SPOOF')}).")

    # Check Blacklist
    if db_check.get("is_blacklisted"):
        findings.append(f"Watchlist Hit: Document or name flagged on Interpol/checkpoint alert database ({db_check.get('blacklist_reason', 'Active alert')}).")

    if findings:
        dossier_sections.append(" ".join(findings))

    # 3. Officer Action Directives
    if outcome == "VERIFIED":
        dossier_sections.append("RECOMMENDED ACTION: Authorize passenger clearance. Stamp travel credential and commit verification receipt to audit ledger.")
    elif outcome == "REJECTED":
        dossier_sections.append("RECOMMENDED ACTION: Deny border entry immediately. Detain traveler under checkpoint protocol 4-B. Isolate physical document in evidence pouch for laboratory Raman spectroscopy and infrared ink analysis.")
    else:
        dossier_sections.append("RECOMMENDED ACTION: Direct traveler to secondary interview lane. Conduct physical inspection of UV watermark fluorescence, tactile microprinting, and holographic OVD seal.")

    return "\n\n".join(dossier_sections)

def generate_officer_dossier(scan_data: Dict[str, Any]) -> str:
    """
    Generates plain-English intelligence dossier. Uses local Ollama LLM if reachable,
    otherwise instantly falls back to the deterministic forensic template generator.
    """
    risk = scan_data.get("risk_evaluation", {})
    forensics = scan_data.get("forensics_metrics", {})
    doc_fields = scan_data.get("document_fields", {})
    biometrics = scan_data.get("biometrics", {})

    prompt = f"""You are AEGIS, an expert border control forensic intelligence analyst.
Summarize this identity document screening result in 3 concise, authoritative, plain-English paragraphs for the checkpoint border officer.

SCAN SUMMARY:
- Outcome: {risk.get('outcome')}
- Overall Score: {risk.get('overall_risk_score')}/100 (Confidence: {risk.get('confidence_score')}%)
- Holder: {doc_fields.get('full_name')} (Doc #: {doc_fields.get('document_number')}, Country: {doc_fields.get('issuing_country')})
- Critical Failures: {risk.get('critical_failures', [])}
- Warnings: {risk.get('warning_flags', [])}
- Forensics (ELA/SRM/Moire): {forensics}
- Biometrics (Face Match/Liveness): {biometrics}

Write a structured briefing:
1. Executive Verdict & Risk Level
2. Specific Technical Evidence (cite exact numbers and metrics)
3. Action Directive for the Border Officer"""

    llm_output = _query_ollama(prompt)
    if llm_output and len(llm_output) > 80:
        return llm_output
    
    return generate_template_dossier(scan_data)

def copilot_chat(
    scan_data: Dict[str, Any], 
    officer_query: str, 
    history: Optional[List[Dict[str, str]]] = None
) -> str:
    """
    Answers questions from the border officer regarding the active scan.
    Grounded in technical forensic metrics, ICAO standards, and biometric data.
    """
    query_lower = officer_query.lower()
    risk = scan_data.get("risk_evaluation", {})
    forensics = scan_data.get("forensics_metrics", {})
    doc_fields = scan_data.get("document_fields", {})
    biometrics = scan_data.get("biometrics", {})
    db_check = scan_data.get("database_check", {})

    if not scan_data or not scan_data.get("risk_evaluation"):
        return "No active document scan is currently loaded, Officer. Please select a credential scenario or upload a document on the dashboard to review its forensic signals."

    # Try local Ollama with rich context first
    context_summary = (
        f"Document: {doc_fields.get('document_number', 'N/A')}, Holder: {doc_fields.get('full_name', 'N/A')}, "
        f"Outcome: {risk.get('outcome', 'MANUAL_REVIEW')}, Score: {risk.get('overall_risk_score', 50)}/100, "
        f"Criticals: {risk.get('critical_failures', [])}, Warnings: {risk.get('warning_flags', [])}, "
        f"Face Match: {biometrics.get('similarity_percentage', 'N/A')}%, Verdict: {biometrics.get('verdict', 'N/A')}, "
        f"ELA Tamper: {forensics.get('ela', {}).get('is_spliced', False)}, "
        f"MRZ Valid: {doc_fields.get('all_check_digits_valid', True)}, "
        f"Blacklisted: {db_check.get('is_blacklisted', False)}."
    )
    prompt = f"""You are AEGIS, a certified forensic border control AI assisting an authorized immigration officer.
Your task is defensive forensic analysis: explain technical security indicators (such as Error Level Analysis, ICAO Doc 9303 checksums, facial similarity, anti-spoofing) to clarify why this document produced the observed verdict.

Active Inspection Metrics:
{context_summary}

Official Officer Inquiry: "{officer_query}"
Provide an authoritative, direct 2-3 sentence forensic analysis citing the specific technical metrics above."""

    llm_output = _query_ollama(prompt)
    refusal_keywords = [
        "cannot provide information", 
        "cannot assist with", 
        "cannot help you create", 
        "create a false",
        "fake id",
        "safety guidelines"
    ]
    is_refusal = any(kw in (llm_output or "").lower() for kw in refusal_keywords)
    if llm_output and len(llm_output) > 25 and not is_refusal:
        return llm_output

    # Intelligent deterministic grounded response fallback
    if "why" in query_lower and ("flag" in query_lower or "reject" in query_lower or "fail" in query_lower):
        crits = risk.get("critical_failures", [])
        warns = risk.get("warning_flags", [])
        if crits:
            return f"This document was flagged primarily due to fatal security violations: {'; '.join(crits)}. The overall risk score dropped to {risk.get('overall_risk_score')}/100."
        elif warns:
            return f"This document was routed to manual review due to secondary warning flags: {'; '.join(warns)}."
        else:
            return f"The document is authenticated (score: {risk.get('overall_risk_score')}/100) with no critical security flags detected."

    elif "ela" in query_lower or "splice" in query_lower or "edit" in query_lower:
        ela = forensics.get("ela", {})
        is_spliced = ela.get("is_spliced", False)
        mean_err = ela.get("mean_error", 0.0)
        tamper_ratio = ela.get("tamper_ratio", 0.0)
        if is_spliced:
            return f"Error Level Analysis (ELA) detected digital modification. The recompression error variance reached {mean_err:.2f} (tamper ratio: {tamper_ratio:.2f}), which indicates localized pixel editing (often seen in forged dates, altered digits, or replaced photos)."
        return f"Error Level Analysis (ELA) is normal. The compression gradient across the document surface is uniform (mean error: {mean_err:.2f}), indicating no digital splicing."

    elif "mrz" in query_lower or "checksum" in query_lower or "icao" in query_lower:
        all_valid = doc_fields.get("all_check_digits_valid", True)
        if not all_valid:
            checks = doc_fields.get("check_digits", {})
            failed = [k for k, v in checks.items() if isinstance(v, dict) and not v.get("valid", True)]
            return f"The MRZ failed ICAO Doc 9303 7-3-1 weight check-digit validation. Discrepancies were mathematically detected in: {', '.join(failed) if failed else 'composite security checksum'}. This indicates the printed text was edited without recalculating the security checksums."
        return "The MRZ passed all ICAO Doc 9303 mathematical check-digit calculations (Document Number, Date of Birth, Expiry Date, and Composite Checksum are verified)."

    elif "face" in query_lower or "biometric" in query_lower or "photo" in query_lower or "match" in query_lower:
        sim = biometrics.get("similarity_percentage", 0.0)
        verdict = biometrics.get("verdict", "UNKNOWN")
        is_live = biometrics.get("is_live", True)
        return f"Biometric Face Match result is {verdict} ({sim:.1f}% cosine similarity against passport photo). Passive anti-spoofing score is {biometrics.get('liveness_score', 0):.1f}/100 ({'Live Human' if is_live else 'Potential Presentation Spoof'})."

    elif "interpol" in query_lower or "blacklist" in query_lower or "watchlist" in query_lower:
        is_bl = db_check.get("is_blacklisted", False)
        if is_bl:
            return f"ALERT: Document or traveler name matched an active database alert! Reason: '{db_check.get('blacklist_reason')}'. Severity: {db_check.get('severity', 'CRITICAL')}."
        return "Database check cleared. The document number and traveler name do not appear on active Interpol Red Notices, stolen document lists, or travel bans."

    elif "uv" in query_lower or "physical" in query_lower or "check" in query_lower or "inspect" in query_lower:
        return "For secondary physical inspection, verify: 1) Ultraviolet (UV) 365nm fluorescence for dull paper response and luminescent fibers; 2) Tactile intaglio microprinting along the signature line; 3) Optical Variable Device (OVD) holographic foil shift when tilted; 4) True watermark shadow under transmitted light."

    # General fallback
    return (
        f"AEGIS Copilot Analysis for {doc_fields.get('document_number', 'this document')}: "
        f"The current screening verdict is {risk.get('outcome', 'PENDING')} with an authenticity rating of {risk.get('overall_risk_score', 50)}/100. "
        f"{risk.get('recommendation', 'Proceed with standard checkpoint procedure.')}"
    )
