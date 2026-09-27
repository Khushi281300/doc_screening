# ARGUS - AI-Based Fake Identity Document Screening System

> AI-powered border screening pipeline for detecting forged and fraudulent identity documents.
> Built for SSB/MoHA lab prototype evaluation.

---

## Architecture Overview

`	ext
                    ARGUS PIPELINE
                          |
              +-----------v-----------+
              |   MODULE 1: OCR       |
              | CNN Doc Classifier    |
              | (ResNet18 / Heuristic)|
              | Passport/Visa/DL/NID  |
              |         +             |
              | EasyOCR Field Extract |
              | Name, Num, DOB, Expiry|
              |         +             |
              | MRZ TD1/TD2/TD3 Parse |
              +-----------+-----------+
                          |
              +-----------v-----------+
              |  MODULE 2: VALIDATION |
              | ICAO 9303 MRZ check   |
              | 7-3-1 Luhn math       |
              | Date/chronology check |
              | Field format checks   |
              | Layout integrity      |
              +-----------+-----------+
                          |
              +-----------v-----------+
              | MODULE 3: TAMPERING   |
              | Classical:            |
              | ELA SRM CopyMove      |
              | JPEG-Ghost Moire EXIF |
              | DL/ML:                |
              | CNN Tamper Classifier |
              | Deepfake Detection    |
              | Stamp Verifier        |
              | ML Signal Fusion      |
              +-----------+-----------+
                          |
              +-----------v-----------+
              |  MODULE 4: BIOMETRICS |
              | FaceNet 512-D embed   |
              | ArcFace benchmark     |
              | 1:1 cosine similarity |
              | Anti-spoofing liveness|
              | 1:N duplicate search  |
              +-----------+-----------+
                          |
              +-----------v-----------+
              |  RISK FUSION ENGINE   |
              | Quality       x10%    |
              | Validation    x20%    |
              | MRZ           x15%    |
              | Forensics     x25%    |
              | Biometrics    x25%    |
              | Watchlist      x5%    |
              |                       |
              | Hard Rules:           |
              | Watchlist -> REJECTED |
              | MRZ fail  -> REVIEW   |
              +-----------+-----------+
                          |
              +------+----+----+------+
              |      |         |      |
           VERIFIED  MANUAL  REJECTED
                      REVIEW
                          |
              +-----------v-----------+
              | HITL Officer Review   |
              | UV/Tactile/Watermark  |
              +-----------+-----------+
                          |
              +-----------v-----------+
              | Crypto Audit Ledger   |
              | SHA-256 Merkle Chain  |
              +-----------------------+
`

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Vanilla CSS, Lucide icons |
| Backend | FastAPI (Python 3.12), SQLAlchemy, SQLite |
| OCR | EasyOCR (LSTM + CNN backend) |
| Doc Classifier | PyTorch ResNet18 + Layout / MRZ priors |
| Forensics | OpenCV, NumPy, scikit-image, SciPy |
| ML Fusion | Calibrated Multivariate Logistic Regression |
| Face Verification | FaceNet (512-D), ArcFace margin benchmarking |
| Anti-spoofing | Passive liveness (texture analysis) |
| Risk Engine | Custom weighted multi-signal fusion |
| Audit Ledger | SHA-256 Merkle chain (tamper-evident) |
| AI Copilot | Local Ollama LLM (mistral/llama3) |
| Auth | JWT bearer, role-based (Officer/Supervisor) |

## Running the Project

### Backend
`ash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
`

### Frontend
`ash
cd frontend
npm install
npm run dev
`

Open http://localhost:5173

Default Login: officer1 / password123 (Inspector) or dmin / dmin123 (Supervisor)

## Test Results

**24 passed, 0 failures** in ~36s (100% test suite passing)

Run tests:
`ash
cd backend
python -m pytest tests/ -v
`

## Module 1 - OCR Extraction and Document Classification

- doc_classifier.py: Deep document type classifier routing to ICAO, Visa, DL, or ID pipelines
- engine.py: EasyOCR engine with morphological MRZ strip localization and VIZ parsing
- extractors.py: Per-type field extractors (Visa, DL, National ID)
- mrz/parser.py: TD1/TD2/TD3 MRZ parser with 7-3-1 check digit validation

## Module 2 - Document Validation

- document_validation.py: ICAO 9303 MRZ Luhn checksums, chronological validity (DOB < Issue < Expiry), ISO 3166-1 country code lookup, format regex, and layout scoring

## Module 3 - Tampering and Deepfake Detection

- ela.py: Error Level Analysis (JPEG compression difference)
- srm.py: Steganographic Rich Model 3-filter noise residuals
- copy_move.py: SIFT feature matching with RANSAC affine clustering
- jpeg_ghost.py: Multi-quality recompression ghost curve min/max variance
- 
ecapture.py: Screen recapture / Moire fringe detection via 2D FFT
- exif_inspector.py: Software tags (Photoshop/GIMP) and recompression metadata
- deep_classifier.py: CNN tamper classification and Grad-CAM saliency
- deepfake_detector.py: Azimuthal FFT spectral artifacts & chromatic covariance
- stamp_detector.py: Physical rubber stamp ink diffusion and contour analysis
- ml_fusion.py: Logistic regression fusion of all 9 forensic signals into calibrated probability

## Module 4 - Face Verification and Duplicate Search

- matcher.py: FaceNet 512-D embedding extraction, cosine similarity, ArcFace margin benchmarking
- liveness.py: Passive anti-spoofing texture and edge frequency analysis
- duplicate_search.py: 1:N face embedding search across checkpoint history

## API Endpoints

- POST /api/v1/scan/inspect-full - Full 9-step agentic pipeline
- POST /api/v1/scan/copilot-chat - AI officer copilot
- GET  /api/v1/scan/review-queue - MANUAL_REVIEW queue
- POST /api/v1/scan/hitl-override - Officer override + audit seal
- GET  /api/v1/blacklist/watchlist - Active watchlist
- GET  /api/v1/blockchain/ledger/blocks - Tamper-evident audit ledger
- GET  /api/v1/analytics/checkpoint/metrics - Checkpoint metrics

## Audit Ledger Note

This is a Tamper-Evident Cryptographic Audit Ledger using SHA-256 Merkle chain hashing.
It is NOT a distributed blockchain. It does not implement distributed consensus or multi-node P2P networks.
Correct terminology: **Tamper-Evident Cryptographic Audit Ledger**.

## Pre-Submission Checklist

- [x] Module 1: Document Classification (CNN + layout priors)
- [x] Module 1: OCR + MRZ Extraction (EasyOCR + morphological strip detection)
- [x] Module 2: ICAO 9303 MRZ 7-3-1 Luhn check-digit validation
- [x] Module 2: Chronology, ISO 3166-1 country codes, and layout validation
- [x] Module 3: 5 Classical Forensics (ELA, SRM, Copy-Move, JPEG Ghost, Moire)
- [x] Module 3: 4 DL/ML Forensics (EXIF, Deep Classifier, Deepfake, Stamp Verifier)
- [x] Module 3: ML Forensic Signal Fusion (Calibrated Logistic Regression)
- [x] Module 4: FaceNet 512-D + ArcFace benchmarking (1:1 Biometrics)
- [x] Module 4: Passive anti-spoofing liveness verification
- [x] Module 4: 1:N Duplicate identity search
- [x] Multi-signal Risk Fusion Engine (3-tier verdict: VERIFIED / MANUAL_REVIEW / REJECTED)
- [x] Human-in-the-Loop officer review & override workflow
- [x] Tamper-evident SHA-256 cryptographic audit ledger
- [x] AI officer copilot with plain-English investigative dossiers
- [x] JWT authentication + role-based access (Inspector vs Supervisor)
- [x] 24/24 backend test suite passing
- [x] Live demo preset scenarios with authentic live selfie capture
