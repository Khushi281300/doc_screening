"""
ARGUS Module 1 — Deep Document Type Classifier
Classifies incoming credentials into:
- PASSPORT (ICAO TD3)
- VISA (Entry Visa / Transit / Diplomatic)
- DRIVING_LICENSE (ID-1 Motor Vehicle License)
- NATIONAL_ID (ICAO TD1 / National Identity Card)
- PERMIT (Residence / Work / Travel Permit)

Combines a lightweight PyTorch ResNet feature extractor with structural layout
and textual cues for resilient real-time routing.
"""

import cv2
import re
import numpy as np
import logging
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass

logger = logging.getLogger("argus.classifier")

# Document Class Definitions
DOC_CLASSES = ["PASSPORT", "VISA", "DRIVING_LICENSE", "NATIONAL_ID", "PERMIT"]

PIPELINE_MAP = {
    "PASSPORT": "MRZ_AND_ICAO",
    "VISA": "VISA_FIELD_EXTRACTOR",
    "DRIVING_LICENSE": "DL_LAYOUT_EXTRACTOR",
    "NATIONAL_ID": "ID_CARD_EXTRACTOR",
    "PERMIT": "PERMIT_EXTRACTOR"
}

@dataclass
class DocumentClassificationResult:
    document_type: str
    confidence: float
    probabilities: Dict[str, float]
    sub_type: str
    recommended_pipeline: str
    detected_features: Dict[str, Any]

MODEL_WEIGHTS_PATH = None  # Set to 'doc_classifier.pth' once trained weights are available
_torch_model = None
_torch_transform = None

def _get_torch_feature_backbone():
    """Lazy initialization of PyTorch feature backbone.
    Only loads if a trained weights file exists — random weights corrupt heuristic scores.
    """
    global _torch_model, _torch_transform
    if _torch_model is not None:
        return _torch_model, _torch_transform

    import os
    weights_file = os.path.join(os.path.dirname(__file__), "doc_classifier.pth")
    if not os.path.exists(weights_file):
        logger.info("No trained doc_classifier.pth found. Using heuristic-only classifier (correct behaviour).")
        return None, None

    try:
        import torch
        import torchvision.models as models
        import torchvision.transforms as transforms

        model = models.resnet18(weights=None)
        model.fc = torch.nn.Linear(model.fc.in_features, len(DOC_CLASSES))
        state = torch.load(weights_file, map_location="cpu")
        model.load_state_dict(state)
        model.eval()

        transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

        _torch_model = model
        _torch_transform = transform
        logger.info("Trained doc_classifier.pth loaded successfully.")
    except Exception as e:
        logger.warning(f"Could not load trained weights ({e}). Heuristic classifier only.")
        _torch_model = None
        _torch_transform = None

    return _torch_model, _torch_transform


def extract_visual_layout_priors(image_bgr: np.ndarray, raw_text: str = "") -> Tuple[Dict[str, float], Dict[str, Any]]:
    """
    Extracts structural geometry, aspect ratios, and visual cues from the document.
    """
    h, w = image_bgr.shape[:2]
    aspect_ratio = round(w / max(h, 1), 2)
    
    # 1. Chevron / MRZ signature detection in bottom 30% of document
    bottom_crop = image_bgr[int(h * 0.70):, :]
    gray_bottom = cv2.cvtColor(bottom_crop, cv2.COLOR_BGR2GRAY) if len(bottom_crop.shape) == 3 else bottom_crop
    
    # Check for horizontal line structure typical of MRZ text
    sobel_h = cv2.Sobel(gray_bottom, cv2.CV_32F, 0, 1, ksize=3)
    mrz_energy = float(np.mean(np.abs(sobel_h)))
    has_mrz_texture = mrz_energy > 12.0
    
    # 2. Textual keyword priors
    text_upper = raw_text.upper() if raw_text else ""
    
    has_passport_keyword = any(k in text_upper for k in ["PASSPORT", "PASSEPORT", "REPUBLIK", "TRAVEL DOCUMENT", "P<", "P<UTO", "P<USA", "P<GBR", "P<IND"])
    has_visa_keyword = any(k in text_upper for k in ["VISA", "ENTRIES", "DURATION OF STAY", "TYPE: T", "TYPE: B", "VALID FOR", "VISA NO", "CONTROL NUMBER"])
    has_dl_keyword = any(k in text_upper for k in ["DRIVING LICENCE", "DRIVER LICENSE", "DL NO", "MOTOR VEHICLE", "CLASS", "VEHICLE CLASS", "OPERATOR LICENSE", "ORGAN DONOR"])
    has_id_keyword = any(k in text_upper for k in ["NATIONAL ID", "IDENTITY CARD", "CITIZEN", "RESIDENT CARD", "CIVIL ID", "AADHAAR", "ELECTOR", "ID NO"])
    has_permit_keyword = any(k in text_upper for k in ["PERMIT", "RESIDENCE PERMIT", "WORK PERMIT", "ENTRY PERMIT", "TEMPORARY RESIDENT"])
    
    # Chevron presence in text
    has_chevrons = bool(re.search(r'<{2,}', text_upper)) or "P<" in text_upper or "I<" in text_upper or "V<" in text_upper
    
    # Score accumulator
    scores = {
        "PASSPORT": 0.15,
        "VISA": 0.10,
        "DRIVING_LICENSE": 0.10,
        "NATIONAL_ID": 0.10,
        "PERMIT": 0.05
    }
    
    # Evaluate Aspect Ratio:
    # Standard ICAO TD3 passport booklet page: 1.25 - 1.54 (standard 125x88 is 1.42; captured scans/photos typically 1.30-1.52)
    # Standard ID-1 card (DL / National ID): 1.55 - 1.75 (standard 85.6x53.98 is 1.586)
    if 1.25 <= aspect_ratio <= 1.54:
        scores["PASSPORT"] += 0.35
        scores["VISA"] += 0.15
    elif 1.55 <= aspect_ratio <= 1.75:
        scores["DRIVING_LICENSE"] += 0.30
        scores["NATIONAL_ID"] += 0.30
    
    # Strengthen MRZ zone detection signal for passport images
    # Passports and TD2 visas have high horizontal text density in the bottom 30%.
    # ID-1 Driving Licenses and National ID cards (front) DO NOT have MRZ strips.
    if has_mrz_texture:
        scores["PASSPORT"] += 0.50
        scores["VISA"] += 0.20
        scores["DRIVING_LICENSE"] = max(0.0, scores["DRIVING_LICENSE"] - 0.25)
        if has_passport_keyword or has_chevrons:
            scores["PASSPORT"] += 0.40

    if has_passport_keyword:
        scores["PASSPORT"] += 1.20
    if has_visa_keyword:
        scores["VISA"] += 1.20
    if has_dl_keyword:
        scores["DRIVING_LICENSE"] += 1.20
    if has_id_keyword:
        scores["NATIONAL_ID"] += 1.20
    if has_permit_keyword:
        scores["PERMIT"] += 1.20

    # When image contains chevrons AND no DL/ID keyword, strongly prefer PASSPORT
    if has_chevrons and not has_dl_keyword and not has_id_keyword:
        scores["PASSPORT"] += 0.80

    features = {
        "aspect_ratio": aspect_ratio,
        "has_mrz_texture": has_mrz_texture,
        "has_chevrons": has_chevrons,
        "has_passport_keyword": has_passport_keyword,
        "has_visa_keyword": has_visa_keyword,
        "has_dl_keyword": has_dl_keyword,
        "has_id_keyword": has_id_keyword,
        "has_permit_keyword": has_permit_keyword
    }
    
    return scores, features


def classify_document_type(
    image_bgr: np.ndarray,
    ocr_text: str = ""
) -> DocumentClassificationResult:
    """
    First-stage Classifier: Routes incoming document to the appropriate 
    extraction and validation pipeline.
    """
    scores, features = extract_visual_layout_priors(image_bgr, ocr_text)
    
    # Optional PyTorch CNN inference fusion
    try:
        model, transform = _get_torch_feature_backbone()
        if model is not None and transform is not None:
            import torch
            rgb_img = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
            tensor = transform(rgb_img).unsqueeze(0)
            with torch.no_grad():
                logits = model(tensor)
                probs = torch.softmax(logits, dim=1).squeeze().numpy()
                for idx, c in enumerate(DOC_CLASSES):
                    scores[c] = float(scores[c] * 0.7 + probs[idx] * 0.3)
    except Exception as e:
        logger.debug(f"PyTorch forward pass skipped: {e}")
        
    # Normalize probabilities via Softmax
    exp_scores = np.exp(list(scores.values()))
    norm_probs = exp_scores / np.sum(exp_scores)
    
    prob_dict = {cls_name: round(float(norm_probs[i]), 4) for i, cls_name in enumerate(DOC_CLASSES)}
    
    # Top predicted class
    best_class = max(prob_dict.keys(), key=lambda k: prob_dict[k])
    confidence = prob_dict[best_class]
    
    # Determine Sub-Type
    if best_class == "PASSPORT":
        sub_type = "ICAO_TD3_PASSPORT"
    elif best_class == "VISA":
        sub_type = "STICKER_VISA"
    elif best_class == "DRIVING_LICENSE":
        sub_type = "ID1_DRIVING_LICENSE"
    elif best_class == "NATIONAL_ID":
        sub_type = "ICAO_TD1_NATIONAL_ID"
    else:
        sub_type = "RESIDENCE_PERMIT"
        
    return DocumentClassificationResult(
        document_type=best_class,
        confidence=confidence,
        probabilities=prob_dict,
        sub_type=sub_type,
        recommended_pipeline=PIPELINE_MAP.get(best_class, "MRZ_AND_ICAO"),
        detected_features=features
    )
