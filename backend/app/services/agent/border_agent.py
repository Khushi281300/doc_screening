"""
ARGUS Multi-Stage Border Screening & Document Intelligence Pipeline
Coordinates the 4 Core Defense Modules:
- Module 1: Document Type Classification & Field Extraction (Passport, Visa, DL, ID)
- Module 2: Dedicated Document Validation Engine (Format, Chronology, Layout)
- Module 3: Tamper Detection, Deepfake Identification & ML Signal Fusion
- Module 4: Biometric Matching (FaceNet/ArcFace) & Duplicate Identity Review
- Tamper-Evident Cryptographic Audit Ledger Seal
"""

import time
import uuid
import base64
import numpy as np
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ...db.models import DocumentScan, BlacklistEntry
from ...db.vector_store import face_vector_store
from ...services.preprocessing import assess_image_quality, rectify_document
from ...services.classifier.doc_classifier import classify_document_type
from ...services.ocr.engine import extract_document_text_and_mrz
from ...services.ocr.extractors import extract_visa_fields, extract_driving_license_fields, extract_national_id_fields
from ...services.mrz.parser import parse_mrz_text
from ...services.validation.document_validation import validate_document_standards
from ...services.forensics import (
    compute_error_level_analysis,
    compute_srm_residuals,
    compute_jpeg_ghosts,
    detect_copy_move_forgery,
    analyze_2d_fft_moire,
    generate_gradcam_saliency,
    inspect_image_metadata
)
from ...services.forensics.deepfake_detector import detect_synthetic_face
from ...services.forensics.stamp_detector import detect_and_verify_stamps
from ...services.forensics.ml_fusion import compute_ml_tamper_fusion
from ...services.forensics.morph_detector import detect_face_morphing
from ...services.biometrics import (
    extract_face_crop,
    extract_face_embedding,
    compare_faces,
    compute_passive_liveness
)
from ...services.biometrics.duplicate_search import search_duplicate_identities
from ...services.risk_engine import evaluate_screening_risk
from ...services.ai.local_llm import generate_officer_dossier
from ...services.blockchain import audit_ledger
from ...utils.image_converter import cv2_to_base64


def run_screening_agent(
    doc_img: np.ndarray,
    live_face_img: Optional[np.ndarray],
    raw_bytes: bytes,
    mrz_override: Optional[List[str]],
    officer_id: str,
    checkpoint_id: str,
    db: Session,
    officer_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Autonomous Border Screening Pipeline orchestrating Modules 1 through 4,
    recording tamper-evident cryptographic audit logs, and generating plain-English officer briefings.
    """
    start_time = time.time()
    scan_id = f"SCAN-{uuid.uuid4().hex[:8].upper()}"
    trace: List[Dict[str, Any]] = []

    # ==========================================
    # Step 1: Preprocessing & Document Alignment
    # ==========================================
    trace.append({
        "step": 1,
        "agent": "DocIngestAgent",
        "thought": "Ingesting optical document capture. Assessing image resolution, surface glare, and perspective skew.",
        "action": "rectify_document and assess_image_quality",
        "status": "RUNNING"
    })
    quality_res = assess_image_quality(doc_img)
    rectified_doc, corners = rectify_document(doc_img)
    trace[-1]["observation"] = (
        f"Quality score: {quality_res.get('quality_score', 85)}/100. "
        f"Blur metric: {quality_res.get('laplacian_variance', 0.0):.1f} ({'PASSED' if not quality_res.get('is_blurry') else 'BLUR WARN'}). "
        f"Perspective transformation aligned document corners."
    )
    trace[-1]["status"] = "COMPLETED"

    # ==========================================
    # Step 2 (Module 1): Document Type Classification
    # ==========================================
    trace.append({
        "step": 2,
        "agent": "DocClassificationAgent",
        "thought": "First-stage classification: identifying whether document is Passport, Visa, Driving License, National ID, or Permit.",
        "action": "classify_document_type",
        "status": "RUNNING"
    })
    doc_classification = classify_document_type(rectified_doc)
    doc_type = doc_classification.document_type
    trace[-1]["observation"] = (
        f"Identified credential type: {doc_type} ({doc_classification.sub_type}) "
        f"with {doc_classification.confidence:.1%} confidence. Routing to pipeline '{doc_classification.recommended_pipeline}'."
    )
    trace[-1]["status"] = "COMPLETED"

    # ==========================================
    # Step 3 (Module 1): Field Extraction & OCR
    # ==========================================
    trace.append({
        "step": 3,
        "agent": "VisionOCRAgent",
        "thought": f"Executing field extraction tailored for {doc_type}.",
        "action": "extract_document_text_and_mrz or specialized extractors",
        "status": "RUNNING"
    })
    ocr_result = extract_document_text_and_mrz(rectified_doc)
    full_ocr_text = ocr_result.get("ocr_info", {}).get("full_viz_text", "")

    # Optical confirmation: If OCR successfully extracted valid passport TD3 MRZ lines
    # (starts with P< or 30+ chars with chevrons), ensure pipeline routes to PASSPORT.
    # Only override classifier when OCR actually succeeded — not when MRZ_NOT_DETECTED placeholder is used.
    mrz_lines = ocr_result.get("extracted_mrz_lines", [])
    ocr_succeeded = ocr_result.get("ocr_status") == "EASYOCR_SUCCESS"
    has_td3_mrz = ocr_succeeded and bool(
        mrz_lines and (
            mrz_lines[0].startswith("P<") or
            (len(mrz_lines) >= 2 and len(mrz_lines[0]) >= 30 and "<" in mrz_lines[0])
        )
    )
    if has_td3_mrz and doc_type != "PASSPORT":
        doc_type = "PASSPORT"
        doc_classification.document_type = "PASSPORT"
        doc_classification.sub_type = "ICAO_TD3_PASSPORT"
        doc_classification.confidence = max(doc_classification.confidence, 0.95)

    # Route extraction according to classified document type
    if doc_type == "VISA":
        extracted_doc_fields = extract_visa_fields(full_ocr_text)
    elif doc_type == "DRIVING_LICENSE":
        extracted_doc_fields = extract_driving_license_fields(full_ocr_text)
    elif doc_type == "NATIONAL_ID":
        extracted_doc_fields = extract_national_id_fields(full_ocr_text)
    else:
        # Default / PASSPORT pipeline
        mrz_lines_to_use = mrz_override if (mrz_override and len(mrz_override) >= 2) else ocr_result["extracted_mrz_lines"]
        mrz_res = parse_mrz_text(mrz_lines_to_use)
        extracted_doc_fields = mrz_res
        extracted_doc_fields["doc_type"] = "PASSPORT"

    # Ensure document_number and holder_name are standardized
    doc_num = str(extracted_doc_fields.get("document_number") or "UNKNOWN").upper().strip()
    holder_name = str(extracted_doc_fields.get("full_name") or extracted_doc_fields.get("holder_name") or "UNKNOWN").upper().strip()
    extracted_doc_fields["document_number"] = doc_num
    extracted_doc_fields["full_name"] = holder_name
    extracted_doc_fields["classified_type"] = doc_type

    trace[-1]["observation"] = (
        f"Extracted fields for {doc_type}: Doc No: {doc_num} | Holder: {holder_name}. "
        f"Engine mode: {ocr_result['ocr_status']}."
    )
    trace[-1]["status"] = "COMPLETED"

    # ==========================================
    # Step 4 (Module 2): Dedicated Document Standards Validation
    # ==========================================
    trace.append({
        "step": 4,
        "agent": "DocValidationStandardsAgent",
        "thought": "Validating chronological dates (DOB < Issue < Expiry), ISO 3166-1 country codes, document number syntax, and spatial layout.",
        "action": "validate_document_standards",
        "status": "RUNNING"
    })
    h, w = rectified_doc.shape[:2]
    layout_meta = {
        "mrz_position": "BOTTOM" if (ocr_result["mrz_box"]["y"] > int(h * 0.65)) else "CENTER",
        "aspect_ratio": round(w / max(h, 1), 2)
    }
    validation_res = validate_document_standards(
        document_fields=extracted_doc_fields,
        doc_type=doc_type,
        layout_meta=layout_meta
    )
    trace[-1]["observation"] = (
        f"Validation Score: {validation_res.validation_score}/100 ({validation_res.validation_status}). "
        f"Chronological integrity: {'PASS' if validation_res.chronological_integrity else 'FAIL'}. "
        f"Violations detected: {len(validation_res.format_anomalies) + len(validation_res.layout_anomalies)}."
    )
    trace[-1]["status"] = "COMPLETED"

    # ==========================================
    # Step 5 (Module 3): Multi-Spectral Forensics & Deepfake Detection
    # ==========================================
    trace.append({
        "step": 5,
        "agent": "SignalForensicsAgent",
        "thought": "Executing multi-spectral signal suite: ELA recompression, SRM noise, JPEG ghost, ORB copy-move, Moiré grid, AI synthetic face, and stamp verification.",
        "action": "compute_forensics_suite and deepfake_detector and stamp_verifier",
        "status": "RUNNING"
    })
    ela_map, ela_gray, ela_metrics = compute_error_level_analysis(rectified_doc)
    srm_map, srm_metrics = compute_srm_residuals(rectified_doc)
    ghost_map, ghost_metrics = compute_jpeg_ghosts(rectified_doc)
    copy_move_map, copy_move_metrics = detect_copy_move_forgery(rectified_doc)
    moire_map, moire_metrics = analyze_2d_fft_moire(rectified_doc)
    gradcam_map, deep_metrics = generate_gradcam_saliency(rectified_doc, ela_gray)
    exif_metrics = inspect_image_metadata(raw_bytes)

    # Face crop for deepfake detector
    doc_face_crop, face_box = extract_face_crop(rectified_doc, is_document=True)
    if doc_face_crop is None or doc_face_crop.size == 0:
        doc_face_crop = rectified_doc

    deepfake_metrics = detect_synthetic_face(doc_face_crop)
    morph_metrics = detect_face_morphing(doc_face_crop)
    stamp_metrics = detect_and_verify_stamps(rectified_doc)

    forensic_results = {
        "ela": ela_metrics,
        "srm": srm_metrics,
        "jpeg_ghost": ghost_metrics,
        "copy_move": copy_move_metrics,
        "recapture": moire_metrics,
        "deep_tamper": deep_metrics,
        "exif": exif_metrics,
        "deepfake": deepfake_metrics,
        "morph": morph_metrics,
        "stamp": stamp_metrics
    }

    # Module 3: ML-Based Forensic Signal Fusion
    ml_fusion_results = compute_ml_tamper_fusion(forensic_results)

    trace[-1]["observation"] = (
        f"ML Tamper Fusion: {ml_fusion_results['verdict']} "
        f"(Tamper Likelihood: {ml_fusion_results['tamper_probability']:.1%}, Integrity: {ml_fusion_results['forensic_integrity_score']}/100). "
        f"Deepfake Analysis: {deepfake_metrics['status']} ({deepfake_metrics['confidence']}%). "
        f"Morph Attack: {morph_metrics['verdict']} ({morph_metrics['morph_probability']:.1%} probability). "
        f"Stamp Seal: {stamp_metrics['status']}."
    )
    trace[-1]["status"] = "COMPLETED"

    # ==========================================
    # Step 6 (Module 4): Facial Biometrics & ArcFace Benchmarking
    # ==========================================
    trace.append({
        "step": 6,
        "agent": "BiometricMatcherAgent",
        "thought": "Extracting 512-D face embeddings, performing 1:1 matching, ArcFace margin benchmarking, and anti-spoofing.",
        "action": "compare_faces with ArcFace benchmarking and compute_passive_liveness",
        "status": "RUNNING"
    })
    
    doc_embedding = extract_face_embedding(doc_face_crop)

    if live_face_img is not None and live_face_img.size > 0:
        live_face_crop, _ = extract_face_crop(live_face_img, is_document=False)
        if live_face_crop is None or live_face_crop.size == 0:
            live_face_crop = live_face_img
        match_info = compare_faces(doc_face_crop, live_face_crop)
        passive_live = compute_passive_liveness(live_face_crop)
        biometric_results = {
            "has_live_capture": True,
            "cosine_similarity": match_info["cosine_similarity"],
            "similarity_percentage": match_info["similarity_percentage"],
            "verdict": match_info["verdict"],
            "liveness_score": passive_live["liveness_score"],
            "is_live": passive_live["is_live"],
            "spoof_classification": passive_live["spoof_classification"],
            "benchmarking": match_info.get("benchmarking")
        }
    else:
        biometric_results = {
            "has_live_capture": False,
            "cosine_similarity": None,
            "similarity_percentage": None,
            "verdict": "NOT_PERFORMED",
            "liveness_score": None,
            "is_live": None,
            "spoof_classification": "AWAITING_CAPTURE",
            "message": "Live traveler capture not provided. Awaiting live camera selfie for 1:1 facial verification.",
            "benchmarking": None
        }

    trace[-1]["observation"] = (
        f"Face Match Verdict: {biometric_results['verdict']} "
        f"({biometric_results['similarity_percentage']}% cosine similarity). "
        f"ArcFace Benchmark: {biometric_results.get('benchmarking', {}).get('arcface', {}).get('similarity_percentage', 'N/A')}% similarity."
        if biometric_results["has_live_capture"]
        else "Live biometric capture not provided. Facial verification pending traveler live selfie."
    )
    trace[-1]["status"] = "COMPLETED"

    # ==========================================
    # Step 7 (Module 4): Duplicate Identity & Watchlist Query
    # ==========================================
    trace.append({
        "step": 7,
        "agent": "IntelligenceWatchlistAgent",
        "thought": "Querying national blacklist and executing 1:N vector similarity search across past checkpoint records for duplicate identities.",
        "action": "query_database and search_duplicate_identities",
        "status": "RUNNING"
    })
    
    # 1:N vector search in database
    duplicate_search_res = search_duplicate_identities(
        current_face_embedding=doc_embedding,
        current_doc_number=doc_num,
        current_name=holder_name,
        db=db
    )

    # In-memory vector store cache update
    face_vector_store.add_identity(doc_embedding.tolist(), {
        "document_number": doc_num,
        "holder_name": holder_name,
        "scan_id": scan_id,
        "timestamp": time.time()
    })

    # Watchlist check
    blacklist_hit = db.query(BlacklistEntry).filter(
        or_(
            BlacklistEntry.document_number == doc_num.upper(),
            BlacklistEntry.holder_name == holder_name.upper()
        ),
        BlacklistEntry.active == True
    ).first()

    database_check = {
        "is_blacklisted": blacklist_hit is not None,
        "blacklist_reason": blacklist_hit.reason if blacklist_hit else None,
        "severity": blacklist_hit.severity if blacklist_hit else None,
        "duplicate_search": duplicate_search_res,
        "duplicate_identities": duplicate_search_res.get("matches", [])
    }

    trace[-1]["observation"] = (
        f"Blacklist Status: {'HIT - ' + blacklist_hit.reason if blacklist_hit else 'CLEARED'}. "
        f"Duplicate Identity Check: {duplicate_search_res['status']} ({duplicate_search_res.get('match_count', 0)} candidates found)."
    )
    trace[-1]["status"] = "COMPLETED"

    # ==========================================
    # Step 8: Multi-Module Risk Supervisor & GenAI Dossier
    # ==========================================
    trace.append({
        "step": 8,
        "agent": "RiskSupervisorAgent",
        "thought": "Fusing all 4 module outputs into an explainable 3-tier verdict adhering to deterministic hard security rules.",
        "action": "evaluate_screening_risk and generate_officer_dossier",
        "status": "RUNNING"
    })
    
    # Standardize MRZ wrapper for risk engine
    mrz_eval_wrapper = {
        "all_check_digits_valid": extracted_doc_fields.get("all_check_digits_valid", True),
        "document_number": doc_num,
        "format": extracted_doc_fields.get("format", "TD3")
    }

    risk_evaluation = evaluate_screening_risk(
        quality_result=quality_res,
        mrz_result=mrz_eval_wrapper,
        forensic_results=forensic_results,
        biometric_results=biometric_results,
        database_check=database_check,
        document_validation=validation_res.__dict__,
        ml_fusion=ml_fusion_results
    )

    scan_summary_data = {
        "risk_evaluation": risk_evaluation,
        "document_fields": extracted_doc_fields,
        "forensics_metrics": forensic_results,
        "biometrics": biometric_results,
        "database_check": database_check,
        "document_classification": doc_classification.__dict__,
        "document_validation": validation_res.__dict__,
        "ml_fusion": ml_fusion_results
    }
    officer_dossier = generate_officer_dossier(scan_summary_data)
    trace[-1]["observation"] = (
        f"Final Decision: {risk_evaluation['outcome']} (Risk Safety Score: {risk_evaluation['overall_risk_score']}/100). "
        f"Dossier compiled with plain-English officer instructions."
    )
    trace[-1]["status"] = "COMPLETED"

    # ==========================================
    # Step 9: Cryptographic Tamper-Evident Audit Ledger Seal
    # ==========================================
    trace.append({
        "step": 9,
        "agent": "AuditLedgerAgent",
        "thought": "Sealing inspection transaction into Cryptographic Tamper-Evident Audit Ledger (chained SHA-256 block hash + Merkle root).",
        "action": "record_verification_event",
        "status": "RUNNING"
    })
    block = audit_ledger.record_verification_event(
        scan_id=scan_id,
        doc_number=doc_num,
        outcome=risk_evaluation["outcome"],
        risk_score=risk_evaluation["overall_risk_score"],
        officer_id=officer_id,
        officer_name=officer_name,
        checkpoint_id=checkpoint_id
    )
    trace[-1]["observation"] = (
        f"Ledger Block #{block['block_index']} committed. Hash: {block['block_hash'][:16]}... "
        f"Merkle Root: {block['merkle_root'][:16]}..."
    )
    trace[-1]["status"] = "COMPLETED"

    processing_time_ms = round((time.time() - start_time) * 1000, 1)

    # Persist scan to SQLite
    db_scan = DocumentScan(
        scan_id=scan_id,
        officer_id=officer_id,
        officer_name=officer_name,
        checkpoint_id=checkpoint_id,
        doc_type=doc_type,
        issuing_country=extracted_doc_fields.get("issuing_country", "UTO"),
        document_number=doc_num,
        holder_name=holder_name,
        date_of_birth=extracted_doc_fields.get("date_of_birth", ""),
        expiry_date=extracted_doc_fields.get("expiry_date", ""),
        gender=extracted_doc_fields.get("sex", "U"),
        nationality=extracted_doc_fields.get("nationality", "UTO"),
        outcome=risk_evaluation["outcome"],
        overall_risk_score=risk_evaluation["overall_risk_score"],
        confidence_score=risk_evaluation["confidence_score"],
        ela_score=ela_metrics.get("mean_error", 0),
        srm_score=srm_metrics.get("noise_variance", 0),
        moire_score=moire_metrics.get("peak_to_mean_ratio", 0),
        copy_move_detected=copy_move_metrics.get("copy_move_detected", False),
        mrz_valid=extracted_doc_fields.get("all_check_digits_valid", True),
        face_match_score=biometric_results.get("cosine_similarity", 0),
        liveness_score=biometric_results.get("liveness_score", 0),
        blockchain_tx_hash=block["block_hash"],
        merkle_root=block["merkle_root"]
    )
    db.add(db_scan)
    db.commit()

    return {
        "status": "SUCCESS",
        "scan_id": scan_id,
        "processing_time_ms": processing_time_ms,
        "agent_trace": trace,
        "officer_dossier": officer_dossier,
        "risk_evaluation": risk_evaluation,
        "document_classification": {
            "document_type": doc_type,
            "confidence": doc_classification.confidence,
            "sub_type": doc_classification.sub_type,
            "probabilities": doc_classification.probabilities,
            "recommended_pipeline": doc_classification.recommended_pipeline
        },
        "document_validation": {
            "validation_status": validation_res.validation_status,
            "validation_score": validation_res.validation_score,
            "chronological_integrity": validation_res.chronological_integrity,
            "format_anomalies": validation_res.format_anomalies,
            "layout_anomalies": validation_res.layout_anomalies,
            "details": validation_res.details
        },
        "document_fields": extracted_doc_fields,
        "ocr_info": ocr_result,
        "quality": quality_res,
        "forensics_metrics": forensic_results,
        "ml_tamper_fusion": ml_fusion_results,
        "biometrics": biometric_results,
        "database_check": database_check,
        "blockchain": {
            "ledger_type": "Cryptographic Tamper-Evident Audit Ledger",
            "block_index": block["block_index"],
            "block_hash": block["block_hash"],
            "merkle_root": block["merkle_root"],
            "digital_seal": block["digital_signature"]
        },
        "layers": {
            "original_rectified_base64": cv2_to_base64(rectified_doc),
            "doc_face_crop_base64": cv2_to_base64(doc_face_crop),
            "ela_heatmap_base64": cv2_to_base64(ela_map),
            "srm_noise_base64": cv2_to_base64(srm_map),
            "jpeg_ghost_base64": cv2_to_base64(ghost_map),
            "copy_move_base64": cv2_to_base64(copy_move_map),
            "fft_moire_base64": cv2_to_base64(moire_map),
            "gradcam_saliency_base64": cv2_to_base64(gradcam_map)
        }
    }
