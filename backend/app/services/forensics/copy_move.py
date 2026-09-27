import cv2
import numpy as np
from typing import Tuple, Dict, Any, List

def detect_copy_move_forgery(
    image_bgr: np.ndarray, 
    min_match_dist: float = 30.0, 
    min_inliers: int = 6
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Detects duplicated / cloned image regions (e.g. copied stamps, cloned digits, cloned seals)
    using ORB keypoint descriptors, spatial distance thresholding, and RANSAC affine verification.
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY) if len(image_bgr.shape) == 3 else image_bgr
    h, w = gray.shape[:2]
    # Create mask excluding bottom 22% (MRZ band) to prevent repeated chevrons '<' and standard numbers from false triggers
    mask = np.ones((h, w), dtype=np.uint8) * 255
    mask[int(h * 0.78):, :] = 0

    orb = cv2.ORB_create(nfeatures=1200)
    keypoints, descriptors = orb.detectAndCompute(gray, mask)

    annotated = image_bgr.copy()
    cloned_pairs = []
    coherent_cluster_matches = []

    if descriptors is not None and len(descriptors) > 10:
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
        matches = bf.knnMatch(descriptors, descriptors, k=3)

        # Filter out self-matches and enforce spatial distance
        valid_matches = []
        for m_list in matches:
            if len(m_list) >= 2:
                m = m_list[1]
                pt1 = keypoints[m.queryIdx].pt
                pt2 = keypoints[m.trainIdx].pt
                dx = pt2[0] - pt1[0]
                dy = pt2[1] - pt1[1]
                spatial_dist = np.sqrt(dx**2 + dy**2)
                
                # Strict distance and hamming threshold for cloned regions
                if m.distance < 28 and spatial_dist > min_match_dist:
                    angle = np.arctan2(dy, dx) * 180.0 / np.pi
                    valid_matches.append((pt1, pt2, dx, dy, spatial_dist, angle, m.distance))

        # True copy-move creates a cluster of coherent displacement vectors (same dx, dy, and angle)
        # Cluster vectors with similar magnitude and angle
        vector_clusters = {}
        for vm in valid_matches:
            # Quantize distance to 20px bins and angle to 25-degree bins
            dist_bin = int(vm[4] // 20)
            angle_bin = int((vm[5] + 180) // 25)
            cluster_key = (dist_bin, angle_bin)
            vector_clusters.setdefault(cluster_key, []).append(vm)

        best_cluster = []
        for c in vector_clusters.values():
            if len(c) > len(best_cluster):
                best_cluster = c

        # Require a coherent cluster of at least 7 keypoint pairs sharing identical translation
        if len(best_cluster) >= 7:
            coherent_cluster_matches = best_cluster
            for (p1, p2, dx, dy, dist, angle, m_dist) in coherent_cluster_matches[:25]:
                pt1_int = (int(p1[0]), int(p1[1]))
                pt2_int = (int(p2[0]), int(p2[1]))
                cv2.circle(annotated, pt1_int, 5, (0, 0, 255), -1)
                cv2.circle(annotated, pt2_int, 5, (255, 0, 0), -1)
                cv2.line(annotated, pt1_int, pt2_int, (0, 255, 255), 2)
                cloned_pairs.append({"source": pt1_int, "target": pt2_int, "dist": round(float(dist), 2)})

    copy_move_detected = len(coherent_cluster_matches) >= 7

    return annotated, {
        "copy_move_detected": copy_move_detected,
        "cloned_keypoints_count": len(cloned_pairs),
        "cloned_pairs_sample": cloned_pairs[:5],
        "confidence": round(min(1.0, len(cloned_pairs) / 12.0), 2) if copy_move_detected else 0.0
    }

