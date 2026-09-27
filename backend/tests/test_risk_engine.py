from app.services.risk_engine import evaluate_screening_risk

def test_risk_engine_verified():
    quality = {"quality_score": 92.0, "is_blurry": False}
    mrz = {"all_check_digits_valid": True, "document_number": "P12345678"}
    forensics = {"ela": {"is_spliced": False}, "copy_move": {"copy_move_detected": False}}
    biometrics = {"has_live_capture": True, "cosine_similarity": 0.92, "liveness_score": 95.0, "verdict": "MATCH"}
    database = {"is_blacklisted": False, "duplicate_identities": [], "duplicate_search": {}}
    validation = {"validation_score": 100.0, "format_anomalies": [], "layout_anomalies": []}

    res = evaluate_screening_risk(quality, mrz, forensics, biometrics, database, document_validation=validation)
    assert res["outcome"] == "VERIFIED"
    assert res["overall_risk_score"] >= 85.0

def test_risk_engine_rejected_blacklist():
    quality = {"quality_score": 92.0}
    mrz = {"all_check_digits_valid": True}
    forensics = {}
    biometrics = {"cosine_similarity": 0.90, "liveness_score": 90.0}
    database = {"is_blacklisted": True, "blacklist_reason": "Interpol Red Notice"}

    res = evaluate_screening_risk(quality, mrz, forensics, biometrics, database)
    assert res["outcome"] == "REJECTED"
    assert any("WATCHLIST" in f for f in res["critical_failures"])

def test_risk_engine_pending_biometrics():
    quality = {"quality_score": 92.0}
    mrz = {"all_check_digits_valid": True}
    forensics = {}
    biometrics = {"has_live_capture": False}
    database = {"is_blacklisted": False, "duplicate_identities": []}

    res = evaluate_screening_risk(quality, mrz, forensics, biometrics, database)
    assert res["outcome"] == "MANUAL_REVIEW"
    assert res["factor_breakdown"]["biometric_verification"]["status"] == "PENDING"
    assert any("pending" in w.lower() for w in res["warning_flags"])

