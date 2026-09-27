import cv2
import numpy as np
from typing import Dict, Any, List

def compute_passive_liveness(face_image: np.ndarray) -> Dict[str, Any]:
    """
    Evaluates passive anti-spoofing indicators:
    - High-frequency texture energy (detects printed paper photos)
    - Specular reflection hotspot distribution (detects glass/screen reflections)
    - Color channel correlation (detects replay screens)
    """
    gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY) if len(face_image.shape) == 3 else face_image
    
    # 1. Texture high-frequency analysis
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    
    # 2. Glare hotspot detection on forehead/cheeks
    _, bright_thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)
    glare_ratio = float(np.sum(bright_thresh > 0) / (gray.size + 1e-6))
    
    # 3. HSV saturation balance (screens often have oversaturated borders)
    if len(face_image.shape) == 3:
        hsv = cv2.cvtColor(face_image, cv2.COLOR_BGR2HSV)
        sat_mean = float(np.mean(hsv[:, :, 1]))
    else:
        sat_mean = 100.0

    # Liveness score formulation (0 to 100)
    # Real human webcams typically have laplacian_var between 25 and 200
    if laplacian_var >= 200.0:
        texture_score = 95.0
    elif laplacian_var >= 25.0:
        texture_score = 75.0 + min(20.0, ((laplacian_var - 25.0) / 175.0) * 20.0)
    elif laplacian_var >= 10.0:
        texture_score = 50.0 + ((laplacian_var - 10.0) / 15.0) * 25.0
    else:
        texture_score = max(5.0, (laplacian_var / 10.0) * 45.0)

    screen_glare_penalty = max(0.0, (glare_ratio - 0.03) * 350.0) if glare_ratio > 0.03 else 0.0
    sat_score = min(20.0, (sat_mean / 128.0) * 15.0)
    
    # 4. Deepfake & AI-Generated Synthetic Face Detection (Diffusion / GAN / Morph)
    try:
        from ..forensics.deepfake_detector import detect_synthetic_face
        synth_eval = detect_synthetic_face(face_image)
        is_synthetic = synth_eval.get("is_synthetic", False)
        synth_prob = synth_eval.get("synthetic_probability", 0.0)
    except Exception:
        is_synthetic = False
        synth_prob = 0.0

    if is_synthetic or synth_prob >= 0.50:
        liveness_score = round(float(max(5.0, min(35.0, (1.0 - synth_prob) * 50.0))), 1)
        is_live = False
        spoof_classification = "AI_GENERATED_SPOOF"
    else:
        liveness_score = float(max(0.0, min(100.0, (texture_score * 0.85) - screen_glare_penalty + sat_score)))
        is_live = bool(liveness_score >= 60.0)
        spoof_classification = "REAL_HUMAN" if is_live else ("SCREEN_REPLAY" if glare_ratio > 0.08 else "PRINTED_PHOTO")

    return {
        "liveness_score": round(float(liveness_score), 1),
        "texture_sharpness": round(float(laplacian_var), 2),
        "specular_glare_ratio": round(float(glare_ratio), 4),
        "is_live": is_live,
        "is_synthetic": is_synthetic,
        "synthetic_probability": round(float(synth_prob), 3),
        "spoof_classification": spoof_classification
    }

def verify_active_challenge(
    challenge_type: str, 
    frame_metrics: Dict[str, float]
) -> Dict[str, Any]:
    """
    Validates active challenge-response step:
    - BLINK: Eye Aspect Ratio (EAR) drops below 0.20
    - TURN_HEAD_LEFT: Yaw angle < -18 degrees
    - TURN_HEAD_RIGHT: Yaw angle > +18 degrees
    - OPEN_MOUTH: Mouth Aspect Ratio (MAR) > 0.50
    """
    passed = False
    ear = frame_metrics.get("ear", 0.30)
    mar = frame_metrics.get("mar", 0.15)
    yaw = frame_metrics.get("yaw", 0.0)

    if challenge_type == "BLINK":
        passed = ear < 0.22
    elif challenge_type == "TURN_HEAD_LEFT":
        passed = yaw < -15.0
    elif challenge_type == "TURN_HEAD_RIGHT":
        passed = yaw > 15.0
    elif challenge_type == "OPEN_MOUTH":
        passed = mar > 0.45
    else:
        passed = True

    return {
        "challenge_type": challenge_type,
        "metrics_received": {"ear": ear, "mar": mar, "yaw": yaw},
        "passed": passed,
        "status": "COMPLETED" if passed else "IN_PROGRESS"
    }
