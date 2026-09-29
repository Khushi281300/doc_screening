# CHRONICLE — Secure Digital Document Management System for Legal & Investigation Records

**Smart India Hackathon 2026 · PS 26190 · Ministry of Home Affairs / NCRB (Women Safety Division)**
Theme: Blockchain & Cybersecurity · Category: Software

One tamper-evident, access-controlled record for every FIR, case diary, witness statement, seizure memo,
evidence exhibit, FSL report, charge sheet and court order — shared between the police station,
the Forensic Science Laboratory, the prosecution and the court.

## What it does (mapped to the problem statement)

| PS requirement | Implementation |
|---|---|
| Digitise & centralise storage | Case → documents model; files stored in an **AES-256-GCM encrypted vault** (`backend/case_vault/`) |
| Secure access & confidentiality | JWT login; **5 agency roles** (IO, SHO, FSL, Prosecutor, Magistrate); a case is visible only to agencies it was shared with; per-role upload rights |
| Prevent unauthorised modification | Every file is **SHA-256 hashed** on ingest; new content = new version (old versions never overwritten); SHO can **lock** a case; filing before the court locks it automatically |
| Complete audit trail | **Hash-chained, HMAC-signed chain of custody**: every create / upload / view / download / redact / transfer / certify / status change. `Verify integrity` recomputes the whole chain and re-hashes every stored file |
| Efficient search & retrieval | Full-text search across FIR numbers, sections, accused, document titles, hashes and **extracted document text** (PDF / DOCX / TXT) |
| Collaboration | **Share / transfer** to FSL, Prosecutor, Court with automatic status change (`FSL_PENDING → CHARGE_SHEET_DRAFTED → CHARGE_SHEET_FILED → IN_TRIAL → DISPOSED`) |
| Legal validity / evidentiary integrity | **BSA 2023 Section 63(4)** electronic-evidence certificate bound to the file hash + custody root, re-verifiable in one click |
| Women Safety Division mandate | **Sec 72 BNS redaction** (victim / witness names, phone, e-mail, Aadhaar, PAN, address, PIN). Non-police agencies only ever receive the redacted copy of women-safety cases |
| Statutory compliance | **Sec 193 BNSS charge-sheet clock** (60 / 90 days) with dashboard alerts at ≤ 10 days |
| Evidence tamper screening | Image exhibits are screened on ingest with **ELA, copy-move (ORB/RANSAC) and EXIF** analysis; flags go into the custody chain |

The ledger is a **tamper-evident SHA-256 hash chain with HMAC signatures** stored in SQLite — not a distributed
multi-node blockchain. Say that honestly to the jury; the verification demo is the strong part.

## Run (Windows)

```
run_system.bat
```
starts the FastAPI backend (http://127.0.0.1:8000, docs at /api/v1/docs) and the React UI (http://localhost:5173).

Manual:
```
cd backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload

cd frontend
npm install
npm run dev
```
Database (`backend/chronicle.db`) and vault are created and seeded on first start. Delete both to reset the demo.

### Demo logins (password `demo1234`)

| Badge | Role | Can do |
|---|---|---|
| `IO-1001` | Investigating Officer | register FIRs, upload FIR / diary / statements / memos / exhibits / charge sheet, redact, certify, share with FSL & prosecutor |
| `SHO-001` | Station House Officer | everything the IO can + lock/unlock, change status, file before the Court |
| `FSL-008` | FSL Examiner | read shared cases (redacted for women-safety), attach & certify forensic reports |
| `PP-021` | Public Prosecutor | read shared cases (redacted), upload charge sheet / legal notice |
| `MAG-004` | Magistrate | read filed cases (originals), verify chain & certificates, upload orders / judgments, set In Trial / Disposed |

## Suggested 3-minute demo

1. Login as **IO** → Dashboard → open **FIR 104/2026** → open the FIR → **Generate Sec 72 redaction** (victim: `Pooja Sharma`).
2. **Upload document** → a phone photo / scanned exhibit → forensic report tab (ELA heat-map, copy-move, EXIF).
3. **Issue Sec 63 certificate** → shows signature / hash / chain-root verification.
4. **Verify integrity** → chain valid. (Optional: edit a row in `chronicle.db` with any SQLite tool, verify again → chain break is reported.)
5. Sign out → login as **FSL-008** → same FIR now shows only the redacted text; download gives the redacted copy.
6. Login as **SHO-001** → **Share / transfer → File before the Court** → case locks; **MAG-004** can now open it and verify.

## Tests

```
python -m pytest -q        # from the repo root; 22 tests
```

## Layout

```
backend/app
  api/v1/endpoints/{auth,cases,audit,health}.py   REST API
  core/{config,security,dependencies}.py          settings, JWT, role guards
  db/{models,seed}.py                             SQLAlchemy models + demo data
  services/vault.py                               AES-256-GCM encrypted file store
  services/custody.py                             hash chain + verification
  services/forensics/{ela,copy_move,exif_inspector,screening}.py
  services/privacy/redaction.py                   Sec 72 BNS masking
  services/compliance/bsa_certificate.py          Sec 63 BSA certificate
  services/text_extract.py                        PDF / DOCX / TXT text for search
frontend/src
  pages/{Dashboard,CaseWorkspace,SearchPage,AuditTrail,Login}.jsx
  components/cases/{UploadModal,DocumentDetail,CertificateModal}.jsx
  components/layout/{Sidebar,Navbar,Footer}.jsx · components/ui.jsx
```

## Known limits
* No OCR is bundled: scanned images get forensic screening but no searchable text (paste text into the redaction dialog if needed).
* Certificate and custody signatures are HMAC with the server secret; swap `services/custody.py` / `bsa_certificate.py` for PKI (e-Sign / DSC) for production.
* SQLite + local vault are for the prototype; both are behind one interface and can be moved to PostgreSQL / object storage.
