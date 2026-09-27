import cv2
import numpy as np
from typing import Tuple, Dict, Any

def compute_srm_residuals(image_bgr: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Computes Spatial Rich Model (SRM) high-pass noise residuals.
    Uses KV (Ker-Vandewalle) and 3x3 min-max edge filter kernels to expose
    texture splicing, font tampering, and boundary anomalies.
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY) if len(image_bgr.shape) == 3 else image_bgr
    gray_f = gray.astype(np.float32)

    # 1. KV high-pass filter
    kv_filter = np.array([
        [-1,  2, -2,  2, -1],
        [ 2, -6,  8, -6,  2],
        [-2,  8, -12, 8, -2],
        [ 2, -6,  8, -6,  2],
        [-1,  2, -2,  2, -1]
    ], dtype=np.float32) / 12.0

    # 2. Min-Max 3x3 filter
    min_max_filter = np.array([
        [-1, -1, -1],
        [-1,  8, -1],
        [-1, -1, -1]
    ], dtype=np.float32) / 8.0

    res_kv = cv2.filter2D(gray_f, -1, kv_filter)
    res_mm = cv2.filter2D(gray_f, -1, min_max_filter)

    combined_res = np.abs(res_kv) * 0.5 + np.abs(res_mm) * 0.5
    
    # Normalize for visualization
    res_norm = cv2.normalize(combined_res, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8U)
    srm_heatmap = cv2.applyColorMap(res_norm, cv2.COLORMAP_VIRIDIS)

    # Isolate sensor noise residuals by masking out high-contrast document edges and text
    edges = cv2.Canny(gray, 60, 160)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    dilated_edges = cv2.dilate(edges, kernel, iterations=1)
    flat_mask = (dilated_edges == 0)

    if np.sum(flat_mask) > 1000:
        flat_residuals = combined_res[flat_mask]
        variance_metric = float(np.var(flat_residuals))
        high_noise_ratio = float(np.sum(flat_residuals > 18.0) / (flat_residuals.size + 1e-6))
    else:
        variance_metric = float(np.var(combined_res))
        high_noise_ratio = float(np.sum(combined_res > 25.0) / (combined_res.size + 1e-6))

    # Calibrated thresholds: real document scans produce natural sensor noise that
    # can cause moderate variance readings. Only flag genuine texture inconsistency.
    is_inconsistent = high_noise_ratio > 0.22 or variance_metric > 200.0

    return srm_heatmap, {
        "noise_variance": round(variance_metric, 2),
        "high_noise_ratio": round(high_noise_ratio, 4),
        "has_noise_inconsistency": is_inconsistent,
        "srm_status": "FLAGGED" if is_inconsistent else "NORMAL"
    }
