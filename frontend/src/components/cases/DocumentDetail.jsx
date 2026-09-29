import React, { useEffect, useState, useRef } from 'react';
import {
  FileText, Download, EyeOff, FileCheck, Upload, History, AlertTriangle,
  CheckCircle2, ScanSearch, Image as ImageIcon, Copy, Check, ShieldCheck, Cpu
} from 'lucide-react';
import {
  getDocument, downloadDocument, redactDocument, issueCertificate,
  uploadNewVersion, errMsg
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  roleInfo, docTypeLabel, actionLabel, actionPill, tamperLabel, tamperPill
} from '../../labels';
import { Modal, Alert, Field, Spinner, CopyButton, cx, fmtDate, fmtBytes } from '../ui';

export default function DocumentDetail({ caseObj, documentId, onClose, onChanged, onViewCert, onOpenVersion }) {
  const { isPolice, isFSL, isCourt } = useAuth();
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);
  const [tab, setTab] = useState('text');
  const [redactOpen, setRedactOpen] = useState(false);
  const [victim, setVictim] = useState('');
  const [extra, setExtra] = useState('');
  const [pasted, setPasted] = useState('');
  const versionInput = useRef();

  const load = async () => {
    try {
      const d = await getDocument(caseObj.case_id, documentId);
      setDoc(d);
      setError('');
      if (d.forensic_report && !d.extracted_text) setTab('check');
    } catch (e) {
      setError(errMsg(e));
    }
  };

  useEffect(() => {
    setDoc(null);
    setTab('text');
    load();
  }, [documentId]); // eslint-disable-line

  const flash = (m, kind = 'success') => {
    setMsg({ m, kind });
    setTimeout(() => setMsg(null), 4000);
  };

  const download = async (redacted) => {
    try {
      setBusy(redacted ? 'dl-red' : 'dl');
      const r = await downloadDocument(caseObj.case_id, documentId, redacted);
      flash(`Downloaded ${r.filename}.`);
      await load();
      onChanged();
    } catch (e) {
      flash(errMsg(e), 'danger');
    } finally {
      setBusy('');
    }
  };

  const runRedact = async () => {
    try {
      setBusy('redact');
      const r = await redactDocument(caseObj.case_id, documentId, {
        victim_name: victim || undefined,
        extra_names: extra.split(',').map((s) => s.trim()).filter(Boolean),
        document_text: pasted.trim() || undefined,
      });
      setRedactOpen(false);
      await load();
      setTab('protected');
      onChanged(`Sec 72 BNS Protected copy generated — ${r.redaction_summary.total_redactions} sensitive identifiers masked.`);
    } catch (e) {
      flash(errMsg(e), 'danger');
    } finally {
      setBusy('');
    }
  };

  const certify = async () => {
    try {
      setBusy('cert');
      const r = await issueCertificate(caseObj.case_id, documentId);
      await load();
      onChanged('Court electronic evidence certificate issued.');
      onViewCert(r.certificate);
    } catch (e) {
      flash(errMsg(e), 'danger');
    } finally {
      setBusy('');
    }
  };

  const newVersion = async (f) => {
    if (!f) return;
    try {
      setBusy('ver');
      const r = await uploadNewVersion(caseObj.case_id, documentId, { file: f });
      onChanged(`Version ${r.document.version} added.`);
      onOpenVersion(r.document.document_id);
    } catch (e) {
      flash(errMsg(e), 'danger');
    } finally {
      setBusy('');
    }
  };

  const canCertify = isPolice || (isFSL && doc?.doc_type === 'FORENSIC_REPORT');
  const canRevise = doc?.is_current_version && (!caseObj.is_locked || isCourt) && (isPolice || (isFSL && doc?.doc_type === 'FORENSIC_REPORT'));
  const fr = doc?.forensic_report;
  const isImg = /^image\//.test(doc?.mime_type || '');
  const seesOriginal = isPolice || isCourt || !caseObj.is_women_safety_case;

  return (
    <Modal
      open
      onClose={onClose}
      width="max-w-3xl"
      icon={isImg ? ImageIcon : FileText}
      title={doc ? doc.title : 'Loading exhibit…'}
      subtitle={
        doc
          ? `${docTypeLabel(doc.doc_type)} · ${fmtBytes(doc.file_size)} · Ingested by ${doc.uploaded_by_name} on ${fmtDate(doc.created_at, false)}${doc.version > 1 ? ` · Revision v${doc.version}` : ''}`
          : ''
      }
    >
      {error && <Alert kind="danger">{error}</Alert>}
      {msg && <Alert kind={msg.kind} className="mb-3.5">{msg.m}</Alert>}
      {!doc && !error && (
        <div className="text-sm text-muted-foreground flex items-center justify-center p-8 gap-2.5">
          <Spinner size={16} /> Retrieving verified exhibit payload…
        </div>
      )}

      {doc && (
        <div className="space-y-4.5">
          {/* Action Toolbar */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => download(false)}
              disabled={!!busy}
            >
              {busy === 'dl' ? <Spinner size={13} /> : <Download size={14} />}
              <span>Download {seesOriginal ? 'Original Vault Copy' : 'Protected Copy'}</span>
            </button>

            {doc.is_redacted && seesOriginal && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => download(true)}
                disabled={!!busy}
              >
                <EyeOff size={14} className="text-shield" />
                <span>Download Sec 72 Protected Copy</span>
              </button>
            )}

            {isPolice && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setRedactOpen(true)}
              >
                <EyeOff size={14} className="text-shield" />
                <span>Auto-Redact Victim Identity</span>
              </button>
            )}

            {canCertify && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={certify}
                disabled={!!busy}
              >
                {busy === 'cert' ? <Spinner size={13} /> : <FileCheck size={14} className="text-court" />}
                <span>Issue BSA Sec 63 Certificate</span>
              </button>
            )}

            {canRevise && (
              <>
                <input
                  ref={versionInput}
                  type="file"
                  className="hidden"
                  onChange={(e) => newVersion(e.target.files?.[0])}
                />
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => versionInput.current?.click()}
                  disabled={!!busy}
                >
                  {busy === 'ver' ? <Spinner size={13} /> : <Upload size={14} />}
                  <span>Upload Revised Version</span>
                </button>
              </>
            )}

            {!doc.is_current_version && (
              <span className="pill pill-warning self-center font-bold">
                <History size={11} /> Historical Version
              </span>
            )}
          </div>

          {/* Cryptographic SHA-256 Fingerprint Box */}
          <div className="rounded-xl border border-border bg-surface/50 p-4 grid sm:grid-cols-[1fr_auto] gap-3 items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="section-title text-[10.5px] text-primary">Cryptographic SHA-256 Fingerprint</span>
                <CopyButton text={doc.file_hash_sha256} />
              </div>
              <div className="hash mt-1 text-foreground font-mono text-[12px] break-all select-all font-semibold">
                {doc.file_hash_sha256}
              </div>
              <div className="help mt-1 text-[11.5px]">
                Deterministic integrity anchor. Any page alteration or file corruption alters this hash.
              </div>
            </div>

            <div className="flex flex-col gap-1.5 items-start sm:items-end shrink-0">
              {doc.is_forensic_screened && (
                <span className={cx('pill text-[11px]', tamperPill(doc.forensic_status))}>
                  {doc.forensic_status === 'CLEAN' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                  {tamperLabel(doc.forensic_status)}
                </span>
              )}
              <span className={cx('pill text-[11px]', doc.is_redacted ? 'pill-shield' : 'pill-neutral')}>
                <EyeOff size={12} /> {doc.is_redacted ? 'Sec 72 BNS Masked' : 'Unmasked Original'}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border flex overflow-x-auto bg-surface/30 px-2 rounded-t-lg">
            {(doc.extracted_text || !fr) && (
              <button
                className={cx('tab text-xs', tab === 'text' && 'tab-active')}
                onClick={() => setTab('text')}
              >
                <FileText size={14} /> Contents & OCR
              </button>
            )}
            {doc.is_redacted && (
              <button
                className={cx('tab text-xs', tab === 'protected' && 'tab-active')}
                onClick={() => setTab('protected')}
              >
                <EyeOff size={14} /> Sec 72 BNS Protected
              </button>
            )}
            {fr && (
              <button
                className={cx('tab text-xs', tab === 'check' && 'tab-active')}
                onClick={() => setTab('check')}
              >
                <ScanSearch size={14} /> ELA / Forensic Check
              </button>
            )}
            <button
              className={cx('tab text-xs', tab === 'versions' && 'tab-active')}
              onClick={() => setTab('versions')}
            >
              <History size={14} /> Versions ({doc.versions.length})
            </button>
            <button
              className={cx('tab text-xs', tab === 'history' && 'tab-active')}
              onClick={() => setTab('history')}
            >
              <History size={14} /> Custody Log ({doc.custody.length})
            </button>
          </div>

          {/* Tab: Text Contents */}
          {tab === 'text' && (
            doc.extracted_text ? (
              <pre className="mono text-[12.5px] leading-relaxed whitespace-pre-wrap bg-surface/60 border border-border rounded-xl p-4.5 max-h-80 overflow-auto select-text text-foreground/90 font-mono">
                {doc.extracted_text}
              </pre>
            ) : (
              <Alert kind="info">
                {isImg
                  ? 'Binary visual exhibit. No textual data extracted; refer to the "ELA / Forensic Check" tab for forgery screening.'
                  : 'No OCR or text stream extracted from this file format. Binary exhibit remains intact and downloadable.'}
              </Alert>
            )
          )}

          {/* Tab: Protected Copy */}
          {tab === 'protected' && doc.redacted_text && (
            <div className="space-y-2.5">
              <pre className="mono text-[12.5px] leading-relaxed whitespace-pre-wrap bg-shield-soft/50 border border-shield-border rounded-xl p-4.5 max-h-80 overflow-auto select-text text-foreground/90 font-mono">
                {doc.redacted_text}
              </pre>
              {doc.redaction_summary && (
                <div className="p-3 rounded-lg bg-shield-soft border border-shield-border/70 text-xs text-foreground flex items-center justify-between">
                  <span>
                    <b>{doc.redaction_summary.total_redactions} identifiers masked:</b>{' '}
                    {doc.redaction_summary.redacted_entities.map((r) => `${entityName(r.entity_type)} (${r.count})`).join(', ')}.
                  </span>
                  <span className="font-semibold text-shield">Sec 72 BNS Compliant</span>
                </div>
              )}
            </div>
          )}

          {/* Tab: ELA / Forensic Check */}
          {tab === 'check' && fr && (
            <div className="grid md:grid-cols-[1fr_270px] gap-5 items-start">
              <div className="space-y-3.5 text-xs">
                <Alert kind={fr.status === 'CLEAN' ? 'success' : fr.status === 'SUSPICIOUS' ? 'warning' : 'danger'}>
                  <div className="font-bold text-sm">{tamperLabel(fr.status)}</div>
                  {fr.findings?.length > 0 ? (
                    <ul className="list-disc pl-5 mt-1.5 space-y-1">
                      {fr.findings.map((f, i) => (
                        <li key={i}>{plainFinding(f)}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-1">Forensic analysis revealed no compression anomalies or spliced keypoints.</div>
                  )}
                </Alert>

                <div className="card p-3.5 space-y-2.5 bg-surface/30">
                  <Row
                    k="Error Level Analysis"
                    v={
                      fr.ela?.is_spliced
                        ? `Compression variance detected — image regions spliced at varying quality levels (${fr.ela.tamper_severity} severity).`
                        : 'Uniform compression error matrix — no spliced elements found.'
                    }
                  />
                  <Row
                    k="Copy-Move Clones"
                    v={
                      fr.copy_move?.copy_move_detected
                        ? `${fr.copy_move.cloned_keypoints_count} matched keypoints found via SIFT/RANSAC — duplicated image patch detected.`
                        : 'No duplicated regions or clone patches found.'
                    }
                  />
                  <Row
                    k="EXIF Metadata"
                    v={
                      fr.exif?.has_exif
                        ? `${fr.exif.camera_make || 'Unknown'} ${fr.exif.camera_model || ''}${fr.exif.editing_software_detected ? ` · Last edited in ${fr.exif.software_tag}` : ''}`
                        : 'No EXIF header present (typical for messaging screenshots & social media).'
                    }
                  />
                </div>
              </div>

              {/* Heatmap */}
              <div className="card p-3 bg-surface/50 border-border">
                <div className="section-title mb-2 text-primary">ELA Heatmap Inspection</div>
                <img
                  src={fr.ela_heatmap_base64}
                  alt="Error Level Analysis Heatmap"
                  className="rounded-lg border border-border w-full object-contain bg-black"
                />
                <p className="help mt-2 text-[11px] leading-snug">
                  Luminescent bright regions indicate differential JPEG quantization errors (possible post-facto digital tampering).
                </p>
              </div>
            </div>
          )}

          {/* Tab: Versions */}
          {tab === 'versions' && (
            <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
              {doc.versions.map((v) => (
                <div
                  key={v.document_id}
                  className={cx(
                    'px-4 py-3 flex items-center justify-between gap-3 text-xs',
                    v.document_id === doc.document_id ? 'bg-primary-soft/40' : 'hover:bg-card-hover'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="pill pill-primary font-bold">v{v.version}</span>
                    <div>
                      <div className="font-bold text-foreground">
                        {v.is_current_version ? 'Active Production Version' : 'Historical Snapshot'}
                        <span className="text-muted-foreground font-normal"> · {v.uploaded_by_name} · {fmtDate(v.created_at)}</span>
                      </div>
                      <div className="hash text-[11px] font-mono mt-0.5">{v.file_hash_sha256}</div>
                    </div>
                  </div>
                  {v.document_id !== doc.document_id && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onOpenVersion(v.document_id)}
                    >
                      Open Version
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tab: Custody History */}
          {tab === 'history' && (
            <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
              {doc.custody.map((l) => (
                <div key={l.id} className="px-4 py-3 text-xs hover:bg-card-hover transition">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cx('pill text-[10.5px]', actionPill(l.action))}>
                      {actionLabel(l.action)}
                    </span>
                    <span className="text-muted-foreground font-mono">{fmtDate(l.timestamp)}</span>
                  </div>
                  <div className="mt-1.5 font-medium text-foreground">{l.details}</div>
                  <div className="text-muted-foreground mt-0.5 text-[11px]">
                    By <b className="text-foreground">{l.performed_by_name}</b> ({roleInfo(l.performed_by_role).label})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Redaction Modal */}
      <Modal
        open={redactOpen}
        onClose={() => setRedactOpen(false)}
        title="Sec 72 BNS Automated Victim Identity Redaction"
        icon={EyeOff}
        subtitle="Generates an entity-redacted electronic copy for the forensic laboratory and prosecution. Original remains intact in police custody."
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setRedactOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={runRedact}
              disabled={busy === 'redact'}
            >
              {busy === 'redact' ? <Spinner size={13} /> : <EyeOff size={13} />} Generate Protected Copy
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Victim's Full Legal Name" hint="As recorded in the statement or medical examination report.">
            <input
              className="input font-medium"
              value={victim}
              onChange={(e) => setVictim(e.target.value)}
              placeholder="e.g. Priyadarshini Rao"
            />
          </Field>
          <Field
            label="Additional Protected Names (optional)"
            hint="Names of minor witnesses, siblings, or institutions to redact (comma separated)."
          >
            <input
              className="input"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="e.g. Master Aarav, St. Mary's Hostel"
            />
          </Field>
          {!doc?.has_text && (
            <Field label="Paste Text Body (since this document has no OCR layer)">
              <textarea
                className="input mono text-xs"
                rows={5}
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                placeholder="Paste OCR text transcript here for entity scrubbing…"
              />
            </Field>
          )}
        </div>
      </Modal>
    </Modal>
  );
}

function entityName(t) {
  return (
    {
      VICTIM_NAME: 'Victim Name',
      PROTECTED_WITNESS_NAME: 'Protected Witness',
      RESIDENTIAL_ADDRESS: 'Address',
      PIN_CODE: 'PIN Code',
      AADHAAR_UID: 'Aadhaar UID',
      PHONE_NUMBER: 'Phone Number',
      EMAIL_ADDRESS: 'Email',
      PAN_IDENTIFIER: 'PAN ID',
    }[t] || t.toLowerCase()
  );
}

function plainFinding(f) {
  if (f.startsWith('ELA')) return 'Compression anomaly detected — possible pasted or edited elements.';
  if (f.startsWith('Copy-move')) return 'Duplicate image patch identified via SIFT keypoint matching.';
  if (f.startsWith('EXIF')) return `Saved using commercial photo manipulation software (${f.split("'")[1] || 'Editor'}).`;
  return f;
}

function Row({ k, v }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 border-b border-border/50 pb-2">
      <div className="w-36 shrink-0 font-bold text-foreground text-[11.5px]">{k}</div>
      <div className="min-w-0 text-muted-foreground text-[11.5px] leading-relaxed">{v}</div>
    </div>
  );
}
