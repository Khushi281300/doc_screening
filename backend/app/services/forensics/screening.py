"""
Ingestion-time forensic screening for image evidence (scans, crime-scene photos).
Runs ELA, copy-move detection and EXIF inspection; returns a compact report
plus a base64 ELA heat-map for the UI.
"""
from typing import Dict, Any, Optional

import cv2
import numpy as np

from .ela import compute_error_level_analysis
from .copy_move import detect_copy_move_forgery
from .exif_inspector import inspect_image_metadata
from ...utils.image_converter import cv2_to_base64

IMAGE_MIMES = ("image/jpeg", "image/png", "image/jpg", "image/webp", "image/bmp", "image/tiff")


def is_image(mime_type: Optional[str], filename: Optional[str]) -> bool:
    if mime_type and mime_type.lower() in IMAGE_MIMES:
        return True
    return (filename or "").lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"))


def screen_evidence_image(data: bytes, max_side: int = 1600) -> Dict[str, Any]:
    arr = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return {"status": "NOT_APPLICABLE", "tamper_score": 0.0, "reason": "Could not decode image"}

    h, w = img.shape[:2]
    scale = min(1.0, max_side / max(h, w))
    if scale < 1.0:
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    ela_map, _, ela = compute_error_level_analysis(img)
    _, copy_move = detect_copy_move_forgery(img)
    exif = inspect_image_metadata(data)

    # Weighted tamper score in [0,1]
    score = 0.0
    findings = []
    if ela["is_spliced"]:
        score += 0.55 if ela["tamper_severity"] == "HIGH" else 0.35
        findings.append(f"ELA: inconsistent compression levels ({ela['tamper_severity']} severity)")
    if copy_move["copy_move_detected"]:
        score += 0.35
        findings.append(f"Copy-move: {copy_move['cloned_keypoints_count']} cloned key-point pairs")
    if exif["editing_software_detected"]:
        score += 0.25
        findings.append(f"EXIF: edited with '{exif['software_tag']}'")
    score = round(min(1.0, score), 2)

    if score >= 0.6:
        status = "TAMPER_DETECTED"
    elif score >= 0.3:
        status = "SUSPICIOUS"
    else:
        status = "CLEAN"

    return {
        "status": status,
        "tamper_score": score,
        "findings": findings,
        "ela": ela,
        "copy_move": {k: v for k, v in copy_move.items() if k != "cloned_pairs_sample"},
        "exif": exif,
        "ela_heatmap_base64": cv2_to_base64(ela_map, ".jpg", 70),
    }
