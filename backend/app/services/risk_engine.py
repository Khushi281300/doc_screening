from typing import Dict, Any, List, Optional
from ..core.config import settings

def evaluate_screening_risk(
    quality_result: Dict[str, Any],
    mrz_result: Dict[str, Any],
    forensic_results: Dict[str, Any],
    biometric_results: Dict[str, Any],
    database_check: Dict[str, Any],
    document_validation: Optional[Dict[str, Any]] = None,
    ml_fusion: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Fuses all multi-modal signals into an explainable, risk-based 3-tier verdict:
    VERIFIED (Green - Authentic), MANUAL_REVIEW (Amber - Secondary Inspection), REJECTED (Red - Deny Entry).
    
    Architecture:
    Module 1: OCR Extraction & Document Classification
    Module 2: Document Validation (Format, Chronology, Layout)
    Module 3: Tampering & Deepfake Detection with ML Signal Fusion
    Module 4: Face Verification (FaceNet/ArcFace) & Duplicate Identity Review
    
    Deterministic Hard Rules:
    - WATCHLIST HIT -> Mandatory REJECTED / Police Alert.
    - MRZ CHECKSUM MATH FAILURE -> Mandatory REVIEW / REJECTED.
    - CRITICAL CHRONOLOGICAL VIOLATION -> Mandatory REVIEW.
    """
    critical_failures: List[str] = []
    warning_flags: List[str] = []
    
    # 1. Quality Component (10%)
    q_score = float(quality_result.get("quality_score", 90.0))
    if quality_result.get("is_blurry"):
        warning_flags.append("High image blur detected; re-scan recommended")
    if quality_result.get("illumination", {}).get("has_excessive_glare"):
        warning_flags.append("Excessive specular glare reflecting off laminate")

    # 2. Module 2: Document Validation Component (Format & Chronological Standards)
    val_score = 100.0
    if document_validation:
        val_score = float(document_validation.get("validation_score", 100.0))
        for fa in document_validation.get("format_anomalies", []):
            if "Chronological Violation" in fa or "Expired" in fa:
                critical_failures.append(f"Document Standards Violation: {fa}")
            else:
                warning_flags.append(f"Format Non-Compliance: {fa}")
        for la in document_validation.get("layout_anomalies", []):
            warning_flags.append(f"Layout Integrity Anomaly: {la}")

    # 3. MRZ & Check-Digit Component (15%)
    mrz_all_valid = mrz_result.get("all_check_digits_valid", True)
    has_mrz_data = bool(mrz_result.get("document_number") and mrz_result.get("document_number") != "UNKNOWN")
    
    if mrz_all_valid and has_mrz_data:
        mrz_score = 100.0
    elif mrz_all_valid and not has_mrz_data:
        mrz_score = 85.0
        warning_flags.append("MRZ not present or unread — using layout/VIZ field extraction")
    else:
        # Check digits genuinely failed - strong forgery indicator (Hard Rule)
        mrz_score = 0.0
        critical_failures.append("Invalid ICAO 9303 check digit math (tampered passport number, DOB, or expiry)")

    # 4. Module 3: Forensic & ML Tamper Signal Fusion Component (25%)
    ela_res = forensic_results.get("ela", {})
    srm_res = forensic_results.get("srm", {})
    copy_move_res = forensic_results.get("copy_move", {})
    recapture_res = forensic_results.get("recapture", {})
    deep_res = forensic_results.get("deep_tamper", {})
    exif_res = forensic_results.get("exif", {})
    deepfake_res = forensic_results.get("deepfake", {})
    morph_res = forensic_results.get("morph", {})
    stamp_res = forensic_results.get("stamp", {})

    # Evaluate ML Tamper Fusion model if available
    if ml_fusion:
        forensic_score = float(ml_fusion.get("forensic_integrity_score", 95.0))
        tamper_prob = float(ml_fusion.get("tamper_probability", 0.05))
        if tamper_prob >= 0.65:
            critical_failures.append(f"ML Tamper Fusion flagged high tampering probability ({tamper_prob:.1%}) across multi-spectral features")
        elif tamper_prob >= 0.35:
            warning_flags.append(f"ML Tamper Fusion: Suspicious forensic profile ({tamper_prob:.1%} manipulation likelihood)")
    else:
        forensic_score = 100.0

    # Specific forensic alerts
    if deepfake_res.get("is_synthetic"):
        critical_failures.append(f"AI-Generated Photo Detected: Portrait photo exhibits synthetic generation artifacts (confidence: {deepfake_res.get('confidence', 85):.0f}%)")
        forensic_score = min(forensic_score, 45.0)

    if morph_res.get("is_morphed"):
        critical_failures.append(
            f"FACE MORPHING ATTACK: Portrait is a composite of multiple identities "
            f"(morph probability: {morph_res.get('morph_probability', 0):.1%}). "
            f"This is a documented biometric border bypass technique."
        )
        forensic_score = min(forensic_score, 35.0)
    elif morph_res.get("verdict") == "SUSPICIOUS_MORPH":
        warning_flags.append(
            f"Possible Face Morph: Portrait shows blending artifact patterns "
            f"({morph_res.get('morph_probability', 0):.1%} probability) — secondary physical inspection recommended"
        )
        forensic_score = min(forensic_score, 72.0)

    if stamp_res.get("status") == "SUSPICIOUS":
        warning_flags.append(f"Immigration Stamp Anomaly: {stamp_res.get('explanation', 'Irregular border stamp boundary')}")

    if copy_move_res.get("copy_move_detected") and copy_move_res.get("confidence", 0) >= 0.70:
        critical_failures.append(f"Copy-Move forgery detected ({copy_move_res.get('cloned_keypoints_count', 0)} cloned feature vectors)")

    if recapture_res.get("is_screen_recaptured") and recapture_res.get("recapture_probability", 0) >= 0.85:
        critical_failures.append("Screen-Replay Recapture attack detected — high-frequency pixel raster grid found (Moiré)")

    if exif_res.get("editing_software_detected"):
        warning_flags.append(f"EXIF Metadata indicates editing software: {exif_res.get('software_tag')}")

    forensic_score = max(0.0, min(100.0, forensic_score))

    # 5. Module 4: Biometrics & Liveness Component (25%)
    has_live = biometric_results.get("has_live_capture", False)
    face_sim_val = biometric_results.get("cosine_similarity")
    bio_pending = False
    
    if not has_live or face_sim_val is None:
        bio_score = 75.0  # Neutral pending state
        bio_pending = True
        warning_flags.append("Live facial verification pending: Provide traveler live photo for 1:1 biometric match")
    else:
        face_sim = float(face_sim_val)
        live_score = float(biometric_results.get("liveness_score") or 85.0)
        verdict = biometric_results.get("verdict", "UNKNOWN")
        
        if verdict == "MATCH":
            bio_score = (face_sim * 100.0 * 0.65) + (live_score * 0.35)
        elif verdict == "BORDERLINE":
            bio_score = (face_sim * 100.0 * 0.65) + (live_score * 0.35)
            warning_flags.append(f"Borderline facial similarity ({round(face_sim * 100, 1)}%) — Secondary officer inspection recommended")
        else:
            bio_score = (face_sim * 100.0 * 0.65) + (live_score * 0.35)
            if face_sim < settings.FACE_MATCH_REVIEW_THRESHOLD:
                critical_failures.append(f"Biometric face mismatch — Impersonation risk (Similarity: {round(face_sim * 100, 1)}%)")
            else:
                warning_flags.append(f"Low facial similarity ({round(face_sim * 100, 1)}%) — Secondary officer inspection recommended")
            
        if live_score < 45.0:
            critical_failures.append("Live anti-spoofing check FAILED — potential photo presentation or screen replay attack")

    # 6. Database, Blacklist & Duplicate Identity Component (20%)
    db_score = 100.0
    is_blacklisted = database_check.get("is_blacklisted", False)
    duplicate_info = database_check.get("duplicate_search", {})
    duplicate_hits = duplicate_info.get("matches", []) if duplicate_info else database_check.get("duplicate_identities", [])

    if is_blacklisted:
        db_score = 0.0
        reason = database_check.get("blacklist_reason", "Interpol Watchlist Hit")
        critical_failures.append(f"CRITICAL WATCHLIST HIT: {reason}")
        
    # Duplicate Identity Detection: Route to review, DO NOT auto-reject
    if duplicate_info.get("duplicate_detected") or len(duplicate_hits) > 0:
        db_score = min(db_score, 60.0)
        top_m = duplicate_info.get("top_match", {})
        matched_name = top_m.get("matched_holder_name", "prior identity")
        matched_doc = top_m.get("matched_doc_number", "record")
        sim_val = top_m.get("similarity_percentage", 92)
        warning_flags.append(
            f"DUPLICATE IDENTITY REVIEW: Facial biometrics match ({sim_val}%) prior record '{matched_name}' (Doc: {matched_doc}). Route to secondary officer review."
        )

    # Composite Overall Score Calculation: Learned ML Risk Fusion with fallback
    import os
    import joblib
    import numpy as np

    heuristic_score = (
        (q_score * 0.10) +
        (val_score * 0.15) +
        (mrz_score * 0.10) +
        (forensic_score * 0.25) +
        (bio_score * 0.25) +
        (db_score * 0.15)
    )

    learned_weights = None
    try:
        model_path = os.path.join(os.path.dirname(__file__), "learned_risk_model.joblib")
        if os.path.exists(model_path):
            bundle = joblib.load(model_path)
            feats = np.array([[q_score, val_score, mrz_score, forensic_score, bio_score, db_score]], dtype=np.float32)
            prob_safe = float(bundle["model"].predict_proba(feats)[0, 1])
            learned_score = float(prob_safe * 100.0)
            learned_weights = bundle.get("normalized_weights")
            # Calibrated ensemble: 70% learned model, 30% baseline
            total_score = round(max(0.0, min(100.0, learned_score * 0.70 + heuristic_score * 0.30)), 1)
        else:
            total_score = round(max(0.0, min(100.0, heuristic_score)), 1)
    except Exception:
        total_score = round(max(0.0, min(100.0, heuristic_score)), 1)

    # 3-Tier Outcome Decision
    if len(critical_failures) > 0:
        outcome = "REJECTED"
        recommendation = "DENY ENTRY. Immediate physical document confiscation and supervisory escalation required."
    elif duplicate_info.get("duplicate_detected"):
        outcome = "MANUAL_REVIEW"
        recommendation = "Route to Secondary Inspection: Potential duplicate identity detected under alternative passport/ID."
    elif total_score < settings.REVIEW_SCORE_MIN:
        outcome = "MANUAL_REVIEW"
        recommendation = "Secondary physical inspection recommended. Score below verification threshold."
    elif bio_pending and len(warning_flags) > 1:
        outcome = "MANUAL_REVIEW"
        recommendation = "Secondary physical inspection recommended. Live traveler verification required plus review of flagged indicators."
    elif total_score >= settings.VERIFIED_SCORE_MIN and len(warning_flags) <= 1 and not bio_pending:
        outcome = "VERIFIED"
        recommendation = "DOCUMENT AUTHENTICATED. Optical, cryptographic, and biometric integrity verified. Proceed with entry authorization."
    elif total_score >= settings.VERIFIED_SCORE_MIN and bio_pending and len(warning_flags) <= 1:
        outcome = "MANUAL_REVIEW"
        recommendation = "Document forensics passed. Capture traveler live photo and run biometric match to complete verification."
    else:
        outcome = "MANUAL_REVIEW"
        recommendation = "Secondary physical inspection recommended. Review flagged indicators and verify physical security features."

    return {
        "outcome": outcome,
        "overall_risk_score": total_score,
        "confidence_score": round(min(99.0, 50.0 + abs(total_score - 50.0) * 0.9), 1),
        "recommendation": recommendation,
        "critical_failures": critical_failures,
        "warning_flags": warning_flags,
        "factor_breakdown": {
            "document_quality": {"score": round(q_score, 1), "weight": "10%", "status": "PASS" if q_score >= 70 else "WARN"},
            "document_validation": {"score": round(val_score, 1), "weight": "15%", "status": "PASS" if val_score >= 80 else "FAIL"},
            "mrz_integrity": {"score": round(mrz_score, 1), "weight": "10%", "status": "PASS" if mrz_all_valid else "FAIL"},
            "forensic_integrity": {"score": round(forensic_score, 1), "weight": "25%", "status": "PASS" if forensic_score >= 75 else ("WARN" if forensic_score >= 50 else "FAIL")},
            "biometric_verification": {"score": round(bio_score, 1), "weight": "25%", "status": "PENDING" if bio_pending else ("PASS" if bio_score >= 75 else "FAIL")},
            "database_watchlist": {"score": round(db_score, 1), "weight": "15%", "status": "PASS" if db_score >= 80 else "FAIL"}
        },
        "learned_weights": learned_weights
    }
