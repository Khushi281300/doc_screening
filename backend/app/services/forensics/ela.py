import io
import cv2
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
from typing import Tuple, Dict, Any

def compute_error_level_analysis(
    image_bgr: np.ndarray, 
    quality: int = 90, 
    scale_factor: int = 15
) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
    """
    Performs Error Level Analysis (ELA) by re-saving image at specified JPEG quality
    and calculating compression delta residuals.
    
    Returns:
      - ela_heatmap_bgr: Heatmap in BGR format (Inferno colormap)
      - ela_grayscale: Raw difference map (1-channel)
      - metrics: Summary dictionary containing max_delta, mean_delta, tamper_ratio
    """
    # Convert OpenCV BGR to PIL Image (RGB)
    rgb_image = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    original_pil = Image.fromarray(rgb_image)

    # Save to temporary buffer at designated quality
    buffer = io.BytesIO()
    original_pil.save(buffer, 'JPEG', quality=quality)
    buffer.seek(0)
    resaved_pil = Image.open(buffer)

    # Compute difference
    diff = ImageChops.difference(original_pil, resaved_pil)
    
    # Scale difference to enhance visibility of compression artifacts
    extrema = diff.getextrema()
    max_diff = max([ex[1] for ex in extrema]) if extrema else 1
    if max_diff == 0:
        max_diff = 1
    
    scale = 255.0 / max_diff if max_diff < (255 / scale_factor) else scale_factor
    diff_enhanced = ImageEnhance.Brightness(diff).enhance(scale)
    
    diff_np = np.array(diff_enhanced)
    ela_gray = cv2.cvtColor(diff_np, cv2.COLOR_RGB2GRAY)
    
    # Apply Inferno / Jet colormap for rich visual explainability
    ela_heatmap = cv2.applyColorMap(ela_gray, cv2.COLORMAP_INFERNO)
    
    # Calculate anomaly statistics
    mean_delta = float(np.mean(ela_gray))
    std_delta = float(np.std(ela_gray))
    tamper_threshold = mean_delta + 2.8 * std_delta
    suspicious_pixels = np.sum(ela_gray > max(tamper_threshold, 160))
    tamper_ratio = float(suspicious_pixels / (ela_gray.size + 1e-6))
    
    # Calibrated thresholds for real-world document scans:
    # Re-compressed scans often have mean_delta 30-90 from ordinary JPEG artifacts.
    # Genuine digital tampering typically shows mean_delta > 100 AND localized high-ratio patches.
    is_tampered_medium = tamper_ratio > 0.09 or mean_delta > 95.0
    is_tampered_high = tamper_ratio > 0.18 or mean_delta > 130.0
    is_tampered = is_tampered_medium
    
    if is_tampered_high:
        severity = "HIGH"
    elif is_tampered_medium:
        severity = "MEDIUM"
    else:
        severity = "LOW"
    
    return ela_heatmap, ela_gray, {
        "mean_error": round(mean_delta, 2),
        "max_error": int(np.max(ela_gray)),
        "tamper_ratio": round(tamper_ratio, 4),
        "is_spliced": is_tampered,
        "tamper_severity": severity
    }
