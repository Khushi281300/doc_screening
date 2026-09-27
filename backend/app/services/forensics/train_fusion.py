"""
Train ML Tamper Signal Fusion Model for ARGUS Module 3.
Trains a Scikit-Learn Random Forest and Calibrated Classifier on multi-spectral forensic indicators:
- ELA anomaly
- SRM residual
- JPEG ghost
- Copy-move duplication
- Moire screen recapture
- Deep Grad-CAM saliency
- Deepfake synthetic face
- Stamp seal anomaly

Saves the fitted model to 'tamper_fusion_model.joblib'.
"""

import os
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import train_test_split

FEATURE_NAMES = [
    "ela_anomaly",
    "srm_residual",
    "jpeg_ghost",
    "copy_move",
    "moire_recapture",
    "deep_gradcam",
    "deepfake_face",
    "stamp_anomaly"
]

def generate_forensic_dataset(n_samples=2500):
    np.random.seed(42)
    X = []
    y = []
    
    for _ in range(n_samples):
        is_tampered = np.random.rand() > 0.55 # ~45% authentic, ~55% tampered
        
        if not is_tampered:
            # Authentic document: all signals low / benign noise
            ela = np.clip(np.random.beta(1.5, 8.0), 0.0, 0.40)
            srm = np.clip(np.random.beta(1.5, 7.0), 0.0, 0.45)
            ghost = np.clip(np.random.beta(1.2, 8.0), 0.0, 0.35)
            copy_move = 0.0 if np.random.rand() > 0.02 else 1.0 # 2% false positive noise
            moire = 0.0 if np.random.rand() > 0.03 else np.random.uniform(0.1, 0.3)
            gradcam = np.clip(np.random.beta(1.5, 6.0), 0.0, 0.45)
            deepfake = np.clip(np.random.beta(1.2, 8.0), 0.0, 0.35)
            stamp = np.clip(np.random.beta(1.2, 6.0), 0.0, 0.30)
            label = 0
        else:
            # Tampered document: one or more attack vectors activated
            tamper_type = np.random.choice([
                "splicing", "copy_move", "recapture", "deepfake", "stamp_fraud", "multi_tamper"
            ])
            
            ela = np.clip(np.random.beta(1.5, 6.0), 0.0, 0.45)
            srm = np.clip(np.random.beta(1.5, 5.0), 0.0, 0.50)
            ghost = np.clip(np.random.beta(1.2, 6.0), 0.0, 0.40)
            copy_move = 0.0
            moire = 0.0
            gradcam = np.clip(np.random.beta(1.5, 5.0), 0.0, 0.50)
            deepfake = np.clip(np.random.beta(1.2, 6.0), 0.0, 0.40)
            stamp = np.clip(np.random.beta(1.2, 5.0), 0.0, 0.40)
            
            if tamper_type == "splicing":
                ela = np.clip(np.random.beta(6.0, 2.0), 0.55, 1.0)
                srm = np.clip(np.random.beta(5.0, 2.0), 0.50, 1.0)
                gradcam = np.clip(np.random.beta(5.0, 2.0), 0.60, 1.0)
            elif tamper_type == "copy_move":
                copy_move = 1.0
                srm = np.clip(np.random.beta(4.0, 2.5), 0.40, 0.90)
            elif tamper_type == "recapture":
                moire = np.clip(np.random.beta(7.0, 1.5), 0.70, 1.0)
                ghost = np.clip(np.random.beta(5.0, 2.0), 0.50, 0.95)
            elif tamper_type == "deepfake":
                deepfake = np.clip(np.random.beta(7.0, 1.5), 0.65, 1.0)
                gradcam = np.clip(np.random.beta(4.0, 2.5), 0.45, 0.85)
            elif tamper_type == "stamp_fraud":
                stamp = np.clip(np.random.beta(6.0, 2.0), 0.60, 1.0)
            elif tamper_type == "multi_tamper":
                ela = np.clip(np.random.beta(5.0, 2.0), 0.50, 1.0)
                gradcam = np.clip(np.random.beta(6.0, 2.0), 0.60, 1.0)
                copy_move = 1.0 if np.random.rand() > 0.5 else 0.0
                
            label = 1
            
        X.append([ela, srm, ghost, copy_move, moire, gradcam, deepfake, stamp])
        y.append(label)
        
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int32)

def train_and_save_fusion():
    print("Generating forensic training dataset (2,500 samples)...")
    X, y = generate_forensic_dataset(2500)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
    
    print("Training Calibrated Random Forest model...")
    rf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    calibrated_model = CalibratedClassifierCV(estimator=rf, method='sigmoid', cv=3)
    calibrated_model.fit(X_train, y_train)
    
    # Evaluate
    preds = calibrated_model.predict(X_test)
    probs = calibrated_model.predict_proba(X_test)[:, 1]
    
    print("\nModel Evaluation:")
    print(classification_report(y_test, preds, target_names=["AUTHENTIC", "TAMPERED"]))
    print(f"ROC-AUC Score: {roc_auc_score(y_test, probs):.4f}")
    
    # Save model
    out_dir = os.path.dirname(__file__)
    out_path = os.path.join(out_dir, "tamper_fusion_model.joblib")
    
    # Save a bundle with model and feature names
    bundle = {
        "model": calibrated_model,
        "feature_names": FEATURE_NAMES,
        "auc_score": float(roc_auc_score(y_test, probs))
    }
    joblib.dump(bundle, out_path)
    print(f"\nModel saved successfully to: {out_path}")
    print(f"File size: {os.path.getsize(out_path) / 1024:.1f} KB")

if __name__ == "__main__":
    train_and_save_fusion()
