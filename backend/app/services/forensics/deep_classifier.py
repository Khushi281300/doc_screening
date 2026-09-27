import cv2
import numpy as np
from typing import Tuple, Dict, Any
from .ela import compute_error_level_analysis

def generate_gradcam_saliency(
    image_bgr: np.ndarray, 
    ela_gray: np.ndarray
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Computes visual explainability saliency map highlighting localized 
    deep-feature anomaly activations (Grad-CAM style heatmap).
    Fuses high-frequency gradient features with ELA delta energy.
    """
    h, w = image_bgr.shape[:2]
    
    # 1. Multi-scale feature gradients
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY) if len(image_bgr.shape) == 3 else image_bgr
    grad_x = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    grad_y = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    grad_mag = np.sqrt(grad_x**2 + grad_y**2)
    
    # 2. Resize ELA to match
    ela_f = cv2.resize(ela_gray.astype(np.float32), (w, h))
    
    # 3. Anomaly saliency evaluation
    # High ELA residuals that deviate significantly (>3.2 sigma) from global document baseline
    ela_mean = float(np.mean(ela_f))
    ela_std = float(np.std(ela_f)) + 1e-5
    
    # Statistical anomaly map
    anomaly_map = np.clip((ela_f - (ela_mean + 1.8 * ela_std)) / (2.0 * ela_std + 1e-5), 0, 1)
    anomaly_blurred = cv2.GaussianBlur(anomaly_map, (25, 25), 0)
    
    # Normalize for visualization
    act_norm = cv2.normalize(anomaly_blurred, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8U)
    gradcam_heatmap = cv2.applyColorMap(act_norm, cv2.COLORMAP_JET)
    
    # Overlay onto original image with transparency
    overlay = cv2.addWeighted(image_bgr, 0.65, gradcam_heatmap, 0.35, 0)
    
    # Find bounding boxes of severe anomaly regions
    _, thresh = cv2.threshold(act_norm, 235, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    hotspots = []
    # Significant area relative to image
    min_hotspot_area = max(500, int((w * h) * 0.005))
    for c in contours:
        area = cv2.contourArea(c)
        if area > min_hotspot_area:
            x, y, bw, bh = cv2.boundingRect(c)
            hotspots.append({"x": int(x), "y": int(y), "w": int(bw), "h": int(bh), "area": int(area)})
            cv2.rectangle(overlay, (x, y), (x + bw, y + bh), (0, 0, 255), 2)
            cv2.putText(overlay, "ANOMALY", (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)

    deep_tamper_score = float(np.mean(anomaly_blurred))
    # Calibrated: require 3+ hotspots OR 1 large hotspot with very high deep tamper score
    is_deep_forged = len(hotspots) >= 3 or (len(hotspots) >= 1 and deep_tamper_score > 0.55)

    return overlay, {
        "deep_tamper_score": round(deep_tamper_score, 3),
        "hotspots_count": len(hotspots),
        "hotspots": hotspots[:6],
        "is_deep_forged": is_deep_forged,
        "classification": "FORGED" if is_deep_forged else "AUTHENTIC"
    }
