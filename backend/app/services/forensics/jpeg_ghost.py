import io
import cv2
import numpy as np
from PIL import Image
from typing import Tuple, Dict, Any, List

def compute_jpeg_ghosts(image_bgr: np.ndarray, qualities: List[int] = [60, 75, 85, 95]) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Computes JPEG Ghost compression history variance map.
    Discrepancies across re-compression quality steps indicate pasted elements from 
    sources with different JPEG compression histories.
    """
    rgb_image = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    original_pil = Image.fromarray(rgb_image)
    orig_np = np.array(rgb_image, dtype=np.float32)

    diff_maps = []
    for q in qualities:
        buf = io.BytesIO()
        original_pil.save(buf, 'JPEG', quality=q)
        buf.seek(0)
        recomp_pil = Image.open(buf)
        recomp_np = np.array(recomp_pil, dtype=np.float32)
        diff = np.mean(np.abs(orig_np - recomp_np), axis=2)
        # Apply smoothing
        diff_smoothed = cv2.GaussianBlur(diff, (15, 15), 0)
        diff_maps.append(diff_smoothed)

    # Compute variance across compression steps
    stacked = np.stack(diff_maps, axis=0)
    ghost_variance = np.var(stacked, axis=0)
    
    # Normalize
    ghost_norm = cv2.normalize(ghost_variance, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8U)
    ghost_heatmap = cv2.applyColorMap(ghost_norm, cv2.COLORMAP_MAGMA)

    ghost_mean = float(np.mean(ghost_norm))
    ghost_max = int(np.max(ghost_norm))
    
    # Structural smoothing to suppress thin font edges
    smoothed_ghost = cv2.GaussianBlur(ghost_norm, (21, 21), 0)
    high_variance_ratio = float(np.sum(smoothed_ghost > 200) / (smoothed_ghost.size + 1e-6))
    
    # Genuine JPEG ghosts form large localized patches (> 6% area after spatial smoothing)
    has_ghosts = high_variance_ratio > 0.06

    return ghost_heatmap, {
        "ghost_mean": round(ghost_mean, 2),
        "ghost_max": ghost_max,
        "high_variance_ratio": round(high_variance_ratio, 4),
        "ghosts_detected": has_ghosts,
        "ghost_risk_tier": "HIGH" if has_ghosts else "LOW"
    }
