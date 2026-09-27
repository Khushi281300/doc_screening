"""
Train Learned Risk Scoring Model for ARGUS Multi-Modal Risk Fusion Engine.
Learns optimal statistical decision weights from labeled screening records:
Inputs:
1. Quality Score (0-100)
2. Validation Score (0-100)
3. MRZ Checksum Score (0-100)
4. Forensic Integrity Score (0-100)
5. Biometric Similarity Score (0-100)
6. Intelligence / Watchlist Score (0-100)

Target:
- 0: FRAUD / REJECT / HIGH RISK
- 1: AUTHENTIC / VERIFIED / LOW RISK

Saves model to 'learned_risk_model.joblib'.
"""

import os
import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import train_test_split

COMPONENT_NAMES = [
    "quality_score",
    "validation_score",
    "mrz_score",
    "forensic_score",
    "biometric_score",
    "database_score"
]

def generate_risk_dataset(n_samples=3000):
    np.random.seed(42)
    X = []
    y = []
    
    for _ in range(n_samples):
        # 60% legitimate travelers, 40% fraudulent attempts
        is_fraud = np.random.rand() < 0.40
        
        if not is_fraud:
            # Genuine traveler: high scores across all modules
            q = np.random.uniform(80, 100)
            val = np.random.uniform(85, 100)
            mrz = np.random.uniform(90, 100)
            forensic = np.random.uniform(85, 100)
            bio = np.random.uniform(82, 99)
            db = 100.0
            label = 1 # Safe / Verified
        else:
            # Fraudulent attempt: one or more modules have critical/severe score drops
            fraud_type = np.random.choice(["counterfeit", "impostor", "expired_tampered", "recaptured"])
            
            q = np.random.uniform(50, 95)
            val = np.random.uniform(40, 90)
            mrz = np.random.uniform(20, 90)
            forensic = np.random.uniform(20, 85)
            bio = np.random.uniform(30, 90)
            db = 100.0
            
            if fraud_type == "counterfeit":
                forensic = np.random.uniform(10, 45)
                val = np.random.uniform(20, 60)
            elif fraud_type == "impostor":
                bio = np.random.uniform(15, 55) # Failed face match
            elif fraud_type == "expired_tampered":
                mrz = 0.0 # MRZ checksum math failed
                val = np.random.uniform(30, 65)
            elif fraud_type == "recaptured":
                forensic = np.random.uniform(20, 50)
                q = np.random.uniform(40, 70)
                
            label = 0 # Reject / High Risk
            
        X.append([q, val, mrz, forensic, bio, db])
        y.append(label)
        
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int32)

def train_and_save_risk_model():
    print("Generating risk calibration dataset (3,000 screening records)...")
    X, y = generate_risk_dataset(3000)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
    
    print("Fitting Learned Logistic Risk Fusion Model...")
    base_lr = LogisticRegression(C=1.0, max_iter=500, random_state=42)
    base_lr.fit(X_train, y_train)
    
    calibrated = CalibratedClassifierCV(estimator=base_lr, method='sigmoid', cv=3)
    calibrated.fit(X_train, y_train)
    
    preds = calibrated.predict(X_test)
    probs = calibrated.predict_proba(X_test)[:, 1]
    
    print("\nLearned Risk Model Evaluation:")
    print(classification_report(y_test, preds, target_names=["FRAUD_REJECT", "VERIFIED_SAFE"]))
    print(f"ROC-AUC: {roc_auc_score(y_test, probs):.4f}")
    
    # Extract learned coefficients from base model
    coeffs = base_lr.coef_[0]
    total_w = np.sum(np.abs(coeffs))
    normalized_weights = {name: round(float(abs(c) / total_w) * 100.0, 1) for name, c in zip(COMPONENT_NAMES, coeffs)}
    print("\nLearned Relative Feature Importances (%):")
    for k, v in normalized_weights.items():
        print(f"  {k}: {v}%")
        
    out_dir = os.path.dirname(__file__)
    out_path = os.path.join(out_dir, "learned_risk_model.joblib")
    bundle = {
        "model": calibrated,
        "base_model": base_lr,
        "component_names": COMPONENT_NAMES,
        "normalized_weights": normalized_weights,
        "auc": float(roc_auc_score(y_test, probs))
    }
    joblib.dump(bundle, out_path)
    print(f"\nLearned Risk Model saved successfully to: {out_path}")
    print(f"File size: {os.path.getsize(out_path) / 1024:.1f} KB")

if __name__ == "__main__":
    train_and_save_risk_model()
