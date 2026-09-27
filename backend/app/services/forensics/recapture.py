import cv2
import numpy as np
from typing import Tuple, Dict, Any

def analyze_2d_fft_moire(image_bgr: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Computes 2D Fast Fourier Transform (FFT) magnitude spectrum to detect
    high-frequency periodic peaks resulting from screen pixel grids (Moire effect)
    and screen-replay recapture attacks.
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY) if len(image_bgr.shape) == 3 else image_bgr
    h, w = gray.shape
    
    # 2D FFT & Shift DC component to center
    f_transform = np.fft.fft2(gray)
    f_shift = np.fft.fftshift(f_transform)
    magnitude_spectrum = 20 * np.log(np.abs(f_shift) + 1e-6)
    
    # Normalize spectrum for visualization
    spectrum_norm = cv2.normalize(magnitude_spectrum, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8U)
    spectrum_color = cv2.applyColorMap(spectrum_norm, cv2.COLORMAP_JET)

    # Mask DC center region and coordinate axes (which contain natural document edge harmonics)
    cy, cx = h // 2, w // 2
    r = int(min(h, w) * 0.12)
    mask = np.ones((h, w), dtype=np.uint8)
    cv2.circle(mask, (cx, cy), r, 0, -1)
    
    # Mask a 5px band along cardinal axes (natural document rectangular borders & text lines)
    axis_band = max(2, int(min(h, w) * 0.008))
    mask[max(0, cy - axis_band):min(h, cy + axis_band + 1), :] = 0
    mask[:, max(0, cx - axis_band):min(w, cx + axis_band + 1)] = 0

    valid_mag = magnitude_spectrum[mask == 1]
    if len(valid_mag) > 0:
        mean_val = float(np.mean(valid_mag))
        std_val = float(np.std(valid_mag)) + 1e-6
        max_val = float(np.max(valid_mag))
        median_val = float(np.median(valid_mag))
        
        # Periodic screen grids (subpixel Moire) exhibit strong isolated off-axis spikes
        peak_z_score = (max_val - mean_val) / std_val
        peak_to_mean_ratio = float(max_val / (mean_val + 1e-5))
        
        # A genuine screen capture has high isolated harmonic spikes (z > 5.5 and peak/mean > 2.8 on raw log scale)
        is_recaptured = (peak_z_score > 5.5 and peak_to_mean_ratio > 2.8)
        recapture_prob = round(min(1.0, max(0.0, (peak_z_score - 3.5) / 3.0)), 2)
    else:
        peak_to_mean_ratio = 1.0
        peak_z_score = 0.0
        is_recaptured = False
        recapture_prob = 0.0

    return spectrum_color, {
        "peak_to_mean_ratio": round(peak_to_mean_ratio, 2),
        "peak_frequency_energy": round(peak_z_score, 2),
        "is_screen_recaptured": is_recaptured,
        "recapture_probability": recapture_prob
    }

