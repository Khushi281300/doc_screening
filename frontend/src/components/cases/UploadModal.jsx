import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Image as ImageIcon, X, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';
import { uploadDocument, errMsg } from '../../api/client';
import { docTypeLabel } from '../../labels';
import { Modal, Field, Alert, Spinner, fmtBytes, cx } from '../ui';

async function sha256Hex(file) {
  const buf = await file.arrayBuffer();
  const h = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function UploadModal({ open, onClose, caseId, allowedTypes = [], onDone }) {
  const [file, setFile] = useState(null);
  const [localHash, setLocalHash] = useState('');
  const [docType, setDocType] = useState(allowedTypes[0] || '');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    if ((!docType || !allowedTypes.includes(docType)) && allowedTypes?.length > 0) {
      setDocType(allowedTypes[0]);
    }
  }, [allowedTypes, docType]);

  const pick = async (f) => {
    if (!f) return;
    setFile(f);
    setError('');
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
    setLocalHash('');
    const h = await sha256Hex(f);
    setLocalHash(h);
  };

  const reset = () => {
    setFile(null);
    setLocalHash('');
    setTitle('');
    setDesc('');
    setError('');
    setDocType(allowedTypes[0] || '');
  };

  const submit = async () => {
    if (!file || !docType || !title.trim()) {
      setError('Please choose a file exhibit, document classification and title.');
      return;
    }
    try {
      setBusy(true);
      const res = await uploadDocument(caseId, {
        file,
        doc_type: docType,
        title: title.trim(),
        description: desc.trim() || undefined,
      });

      if (localHash && res.document.file_hash_sha256 !== localHash) {
        setError('Cryptographic integrity failure: Server computed SHA-256 fingerprint differs from client hash.');
        return;
      }
      reset();
      onDone(res.document);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const isImg = file && /^image\//.test(file.type);

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Ingest Exhibit into Case Vault"
      icon={Upload}
      width="max-w-xl"
      subtitle="Exhibits are encrypted with AES-256, hashed with SHA-256, and permanently recorded in the Merkle custody ledger. Photos undergo automatic ELA/SIFT forensic screening."
      footer={
        <>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={submit}
            disabled={busy || !file}
          >
            {busy ? <Spinner size={13} /> : <Upload size={13} />}
            <span>{busy ? 'Anchoring Exhibit…' : 'Ingest & Anchor to Merkle Tree'}</span>
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          onClick={() => !file && inputRef.current?.click()}
          className={cx(
            'rounded-2xl border-2 border-dashed p-6 text-center transition cursor-pointer relative overflow-hidden',
            drag
              ? 'border-primary bg-primary-soft/60 shadow-lg'
              : 'border-border-strong hover:border-primary/60 bg-surface/30 hover:bg-card-hover'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
            accept=".pdf,.txt,.md,.docx,.jpg,.jpeg,.png,.webp,.tif,.tiff"
          />

          {!file ? (
            <div className="space-y-2 py-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto shadow-sm">
                <Upload size={24} />
              </div>
              <div className="text-sm font-bold text-foreground">
                Drag and drop exhibit file here, or browse files
              </div>
              <div className="help text-xs">
                Supports PDF, DOCX, Plaintext, Scanned Exhibits, and Photos (JPG, PNG, TIFF) · Max 25 MB
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-12 h-12 rounded-xl bg-primary-soft text-primary border border-primary/20 flex items-center justify-center shrink-0">
                {isImg ? <ImageIcon size={24} /> : <FileText size={24} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-foreground truncate">{file.name}</div>
                <div className="help text-xs mt-0.5">
                  {fmtBytes(file.size)}
                  {isImg ? ' · High-Resolution Photo (ELA Screening Triggered)' : ''}
                </div>
                <div className="hash mt-1 text-[11px] font-mono text-primary flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  <span>
                    {localHash ? `SHA-256: ${localHash.slice(0, 24)}…` : 'Computing cryptographic hash…'}
                  </span>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm text-muted-foreground hover:text-foreground p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setLocalHash('');
                }}
                aria-label="Remove"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Legal Classification *">
            <select
              className="input font-medium"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              {allowedTypes.map((t) => (
                <option key={t} value={t}>
                  {docTypeLabel(t)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Exhibit Title *">
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Seizure Memo — Mobile Phone & SIM"
            />
          </Field>

          <Field label="Custodial Notes / Description (optional)" className="sm:col-span-2">
            <input
              className="input"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Recovered from scene of crime; marked Exhibit P-1"
            />
          </Field>
        </div>

        {error && <Alert kind="danger">{error}</Alert>}
      </div>
    </Modal>
  );
}
