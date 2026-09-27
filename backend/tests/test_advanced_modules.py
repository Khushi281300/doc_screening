import numpy as np
import cv2
import pytest
from app.services.forensics.deepfake_detector import detect_synthetic_face
from app.services.forensics.morph_detector import detect_face_morphing
from app.services.forensics.stamp_detector import detect_and_verify_stamps
from app.services.forensics.ml_fusion import compute_ml_tamper_fusion
from app.services.classifier.doc_classifier import classify_document_type
from app.services.validation.document_validation import validate_document_standards


def test_deepfake_detector():
    face_img = np.random.randint(50, 200, (160, 160, 3), dtype=np.uint8)
    res = detect_synthetic_face(face_img)
    assert "synthetic_probability" in res
    assert 0.0 <= res["synthetic_probability"] <= 1.0
    assert "status" in res
    assert res["status"] in ["AUTHENTIC", "DEEPFAKE_SUSPECT"]


def test_morph_detector():
    face_img = np.random.randint(80, 220, (160, 160, 3), dtype=np.uint8)
    # Draw simple facial feature lines
    cv2.circle(face_img, (50, 50), 10, (20, 20, 20), -1)
    cv2.circle(face_img, (110, 50), 10, (20, 20, 20), -1)
    cv2.ellipse(face_img, (80, 110), (30, 15), 0, 0, 180, (20, 20, 20), 2)
    
    res = detect_face_morphing(face_img)
    assert "morph_probability" in res
    assert 0.0 <= res["morph_probability"] <= 1.0
    assert "verdict" in res
    assert "is_morphed" in res


def test_stamp_detector():
    img = np.ones((300, 300, 3), dtype=np.uint8) * 240
    # Draw circular stamp impression
    cv2.circle(img, (150, 150), 60, (0, 0, 180), 3)
    cv2.putText(img, "IMMIGRATION", (105, 155), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 180), 1)

    res = detect_and_verify_stamps(img)
    assert "stamp_detected" in res
    assert "status" in res
    assert "similarity_to_reference" in res


def test_ml_tamper_fusion():
    forensic_payload = {
        "ela": {"tamper_ratio": 0.02, "is_spliced": False},
        "srm": {"noise_variance": 12.0, "is_noise_inconsistent": False},
        "jpeg_ghost": {"ghosts_detected": False, "difference_ratio": 0.04},
        "copy_move": {"forgery_detected": False, "matched_clusters": 0},
        "recapture": {"is_recaptured": False, "peak_to_mean_ratio": 2.1},
        "deep_tamper": {"is_deep_forged": False, "confidence": 0.05},
        "deepfake": {"synthetic_probability": 0.08, "is_synthetic": False},
        "morph": {"morph_probability": 0.06, "is_morphed": False},
        "stamp": {"status": "GENUINE", "similarity_to_reference": 0.92}
    }
    fusion_clean = compute_ml_tamper_fusion(forensic_payload)
    assert "tamper_probability" in fusion_clean
    assert 0.0 <= fusion_clean["tamper_probability"] <= 1.0
    assert "forensic_integrity_score" in fusion_clean
    assert fusion_clean["forensic_integrity_score"] >= 60.0
    assert fusion_clean["verdict"] in ["AUTHENTIC", "SUSPICIOUS", "TAMPERED"]

    # Test tampered payload
    tampered_payload = {
        "ela": {"tamper_ratio": 0.28, "is_spliced": True},
        "srm": {"noise_variance": 58.0, "is_noise_inconsistent": True},
        "jpeg_ghost": {"ghosts_detected": True, "difference_ratio": 0.35},
        "copy_move": {"forgery_detected": True, "matched_clusters": 4},
        "recapture": {"is_recaptured": True, "peak_to_mean_ratio": 9.4},
        "deep_tamper": {"is_deep_forged": True, "confidence": 0.91},
        "deepfake": {"synthetic_probability": 0.88, "is_synthetic": True},
        "morph": {"morph_probability": 0.82, "is_morphed": True},
        "stamp": {"status": "SUSPICIOUS", "similarity_to_reference": 0.41}
    }
    fusion_tampered = compute_ml_tamper_fusion(tampered_payload)
    assert fusion_tampered["tamper_probability"] > fusion_clean["tamper_probability"]
    assert fusion_tampered["verdict"] in ["SUSPICIOUS", "TAMPERED"]


def test_document_classifier():
    img = np.ones((400, 600, 3), dtype=np.uint8) * 230
    ocr_text = "PASSPORT REPUBLIC OF INDIA P<INDDOE<<JOHN<<<<<<<<<<<<<<<<<<<<"
    res = classify_document_type(img, ocr_text)
    assert res.document_type == "PASSPORT"
    assert res.confidence > 0.5


def test_document_validation():
    fields = {
        "date_of_birth": "1990-05-15",
        "date_of_issue": "2020-01-10",
        "date_of_expiry": "2030-01-09",
        "document_number": "J12345678"
    }
    res = validate_document_standards("PASSPORT", fields)
    assert res.validation_status in ["VALID", "SUSPICIOUS", "INVALID"]
    assert res.chronological_integrity is True
    assert len(res.format_anomalies) == 0
