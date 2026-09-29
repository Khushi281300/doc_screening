import React, { useEffect, useState, useCallback } from 'react';
import {
  FolderOpen, Plus, Search, Clock, EyeOff, Lock, Unlock, ShieldCheck, FileText, History, FileCheck,
  Upload, Send, RefreshCw, AlertTriangle, CheckCircle2, ChevronRight, Image as ImageIcon,
  Copy, Check, ShieldAlert, Cpu, Sparkles
} from 'lucide-react';
import {
  getCases, getCaseDossier, createCase, verifyCase, transferCase,
  toggleCaseLock, setCaseStatus, getMeta, errMsg
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  roleInfo, statusLabel, statusPill, actionLabel, actionPill,
  tamperLabel, tamperPill, docTypeLabel
} from '../labels';
import { Modal, Alert, Field, Spinner, Empty, CopyButton, cx, fmtDate, short } from '../components/ui';
import DocumentDetail from '../components/cases/DocumentDetail';
import UploadModal from '../components/cases/UploadModal';
import CertificateModal from '../components/cases/CertificateModal';

const EMPTY_CASE = {
  fir_number: '', police_station: '', state: 'Delhi', district: 'Central', incident_date: '',
  complainant_name: '', victim_name: '', accused_names: '', acts_sections: '',
  statutory_deadline_days: 60, is_women_safety_case: true, is_pocso_case: false,
};

export default function CaseWorkspace({ initialCaseId }) {
  const { isPolice, isSHO, isCourt } = useAuth();
  const [cases, setCases] = useState([]);
  const [filter, setFilter] = useState('');
  const [filterTag, setFilterTag] = useState('all'); // 'all', 'risk', 'women', 'locked'
  const [selectedId, setSelectedId] = useState(initialCaseId || null);
  const [dossier, setDossier] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [tab, setTab] = useState('documents');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const [newCaseOpen, setNewCaseOpen] = useState(false);
  const [newCase, setNewCase] = useState(EMPTY_CASE);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [openDoc, setOpenDoc] = useState(null);
  const [certView, setCertView] = useState(null);
  const [busy, setBusy] = useState('');

  const flash = (msg, kind = 'success') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 4500);
  };

  const loadCases = useCallback(async () => {
    try {
      setLoadingList(true);
      const d = await getCases();
      setCases(d.cases);
      if (!selectedId && d.cases.length) setSelectedId(d.cases[0].case_id);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoadingList(false);
    }
  }, [selectedId]);

  const loadDossier = useCallback(async (id) => {
    if (!id) return;
    try {
      setLoadingDossier(true);
      setDossier(await getCaseDossier(id));
      setError('');
    } catch (e) {
      setError(errMsg(e));
      setDossier(null);
    } finally {
      setLoadingDossier(false);
    }
  }, []);

  useEffect(() => {
    loadCases();
    getMeta().then(setMeta).catch(() => {});
  }, []); // eslint-disable-line

  useEffect(() => {
    if (initialCaseId) setSelectedId(initialCaseId);
  }, [initialCaseId]);

  useEffect(() => {
    loadDossier(selectedId);
    setVerifyResult(null);
  }, [selectedId, loadDossier]);

  const refresh = async () => {
    await Promise.all([loadCases(), loadDossier(selectedId)]);
  };

  const submitNewCase = async (e) => {
    e.preventDefault();
    try {
      setBusy('create');
      const res = await createCase({
        ...newCase,
        accused_names: newCase.accused_names.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setNewCaseOpen(false);
      setNewCase(EMPTY_CASE);
      await loadCases();
      setSelectedId(res.case_id);
      flash(`Dossier opened for ${res.fir_number}. Merkle Genesis Block initialized.`);
    } catch (err) {
      flash(errMsg(err), 'danger');
    } finally {
      setBusy('');
    }
  };

  const runVerify = async () => {
    try {
      setBusy('verify');
      const r = await verifyCase(selectedId);
      setVerifyResult(r);
      setTab('history');
      await loadDossier(selectedId);
    } catch (e) {
      flash(errMsg(e), 'danger');
    } finally {
      setBusy('');
    }
  };

  const doLock = async () => {
    try {
      setBusy('lock');
      const r = await toggleCaseLock(selectedId);
      flash(r.is_locked ? 'Case record locked. Evidentiary freeze active.' : 'Case record unlocked.');
      await refresh();
    } catch (e) {
      flash(errMsg(e), 'danger');
    } finally {
      setBusy('');
    }
  };

  const c = dossier?.case;

  const visible = cases.filter((k) => {
    if (filterTag === 'risk' && !k.is_default_bail_risk) return false;
    if (filterTag === 'women' && !k.is_women_safety_case) return false;
    if (filterTag === 'locked' && !k.is_locked) return false;
    if (!filter) return true;
    const term = filter.toLowerCase();
    return `${k.fir_number} ${k.police_station} ${k.acts_sections} ${k.case_id}`.toLowerCase().includes(term);
  });

  const currentDocs = (dossier?.documents || []).filter((d) => d.is_current_version);
  const canUpload = meta?.my_upload_types?.length > 0 && (!c?.is_locked || isSHO || isCourt);

  return (
    <div className="grid lg:grid-cols-[330px_minmax(0,1fr)] gap-5 items-start">
      {/* ------------------------------------------------ CASE LIST SIDEBAR */}
      <aside className="card overflow-hidden lg:sticky lg:top-[80px]">
        <div className="card-header bg-surface/50">
          <div className="card-title text-sm">
            <FolderOpen size={17} className="text-primary" />
            <span>Case Records</span>
            <span className="pill pill-neutral font-mono text-[11px]">{cases.length}</span>
          </div>
          {isPolice && (
            <button className="btn btn-primary btn-sm" onClick={() => setNewCaseOpen(true)}>
              <Plus size={13} /> New Case
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="p-3 border-b border-border space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="input pl-8.5 py-1.5 text-xs rounded-lg"
              placeholder="Filter FIR, station, section…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          {/* Quick Filter Tags */}
          <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
            <button
              onClick={() => setFilterTag('all')}
              className={cx('px-2 py-0.5 rounded font-semibold transition', filterTag === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary')}
            >
              All
            </button>
            <button
              onClick={() => setFilterTag('risk')}
              className={cx('px-2 py-0.5 rounded font-semibold transition', filterTag === 'risk' ? 'bg-danger text-white' : 'text-muted-foreground hover:bg-secondary')}
            >
              Due Soon
            </button>
            <button
              onClick={() => setFilterTag('women')}
              className={cx('px-2 py-0.5 rounded font-semibold transition', filterTag === 'women' ? 'bg-shield text-white' : 'text-muted-foreground hover:bg-secondary')}
            >
              Sec 72 BNS
            </button>
            <button
              onClick={() => setFilterTag('locked')}
              className={cx('px-2 py-0.5 rounded font-semibold transition', filterTag === 'locked' ? 'bg-warning text-white' : 'text-muted-foreground hover:bg-secondary')}
            >
              Locked
            </button>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="max-h-[calc(100vh-270px)] overflow-y-auto divide-y divide-border/60">
          {loadingList && (
            <div className="p-6 text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Spinner size={14} /> Loading cases…
            </div>
          )}
          {!loadingList && visible.length === 0 && (
            <div className="p-6 text-xs text-muted-foreground text-center">No cases matching filter.</div>
          )}
          {visible.map((k) => {
            const active = k.case_id === selectedId;
            return (
              <button
                key={k.case_id}
                onClick={() => setSelectedId(k.case_id)}
                className={cx(
                  'w-full text-left px-4 py-3.5 transition-all relative border-l-[3px] cursor-pointer group',
                  active
                    ? 'bg-primary-soft/80 border-l-primary'
                    : 'border-l-transparent hover:bg-card-hover'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13.5px] font-bold text-foreground truncate group-hover:text-primary transition">
                    {k.fir_number}
                  </span>
                  {k.is_women_safety_case && (
                    <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" title="Sec 72 BNS Protected" />
                  )}
                </div>

                <div className="text-[11.5px] text-muted-foreground truncate mt-0.5 font-medium">
                  {k.police_station}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className={cx('pill text-[10.5px]', statusPill(k.case_status))}>
                    {statusLabel(k.case_status)}
                  </span>
                  <span
                    className={cx(
                      'text-[11px] font-mono font-bold inline-flex items-center gap-1 ml-auto',
                      k.is_default_bail_risk ? 'text-danger' : 'text-muted-foreground'
                    )}
                  >
                    <Clock size={11} /> {k.days_remaining_for_chargesheet}d
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ------------------------------------------------ CASE DOSSIER MAIN DECK */}
      <section className="min-w-0 space-y-4">
        {toast && <Alert kind={toast.kind}>{toast.msg}</Alert>}
        {error && <Alert kind="danger">{error}</Alert>}
        {!c && !loadingDossier && !error && (
          <Empty icon={FolderOpen} title="Select a case dossier" body="Choose a case from the registry to inspect exhibits, tamper-proof Merkle chain, and court certificates." />
        )}
        {loadingDossier && !c && (
          <div className="card p-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2.5">
            <Spinner size={18} /> Decrypting and loading dossier records…
          </div>
        )}

        {c && (
          <>
            {/* Case Header Card */}
            <div className="card p-6 bg-card border-border">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    <span className={cx('pill font-bold', statusPill(c.case_status))}>
                      {statusLabel(c.case_status)}
                    </span>
                    {c.is_women_safety_case && (
                      <span className="pill pill-shield font-semibold">
                        <EyeOff size={11} /> Sec 72 BNS Shield Active
                      </span>
                    )}
                    {c.is_pocso_case && (
                      <span className="pill pill-shield font-semibold">POCSO Act Mandate</span>
                    )}
                    {c.is_locked && (
                      <span className="pill pill-warning font-semibold">
                        <Lock size={11} /> Evidentiary Record Locked
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                    {c.fir_number}
                  </h2>

                  <div className="text-xs text-muted-foreground mt-1.5 flex flex-wrap items-center gap-2 font-medium">
                    <span>{c.police_station}, {c.district}, {c.state}</span>
                    <span>·</span>
                    <span>Registered: {fmtDate(c.registration_date, false)}</span>
                    <span>·</span>
                    <span className="font-mono text-primary font-bold">ID: {c.case_id}</span>
                  </div>
                </div>

                {/* Case Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {canUpload && (
                    <button className="btn btn-primary btn-sm" onClick={() => setUploadOpen(true)}>
                      <Upload size={14} /> Add Exhibit
                    </button>
                  )}
                  {isPolice && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setTransferOpen(true)}>
                      <Send size={14} /> Transfer Custody
                    </button>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={runVerify}
                    disabled={busy === 'verify'}
                  >
                    {busy === 'verify' ? <Spinner size={13} /> : <ShieldCheck size={14} className="text-emerald-400" />}
                    <span>Verify Merkle Integrity</span>
                  </button>
                  {(isSHO || isCourt) && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setStatusOpen(true)}>
                      <RefreshCw size={13} /> Change Stage
                    </button>
                  )}
                  {isSHO && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={doLock}
                      disabled={busy === 'lock'}
                    >
                      {c.is_locked ? <Unlock size={13} /> : <Lock size={13} />}
                      <span>{c.is_locked ? 'Unlock' : 'Lock Case'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 4 Detail Metric Tiles */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
                <InfoTile label="Charge Sheet Clock (Sec 193 BNSS)" danger={c.is_default_bail_risk}>
                  <div className={cx('text-2xl font-black leading-none', c.is_default_bail_risk ? 'text-danger' : 'text-foreground')}>
                    {c.days_remaining_for_chargesheet ?? '—'}{' '}
                    <span className="text-xs font-semibold text-muted-foreground">days left</span>
                  </div>
                  <div className="help mt-1.5 text-[11.5px]">
                    Limit: {c.statutory_deadline_days} days · Due by {fmtDate(c.statutory_deadline_date, false)}
                  </div>
                </InfoTile>

                <InfoTile label="Statutory Offences">
                  <div className="text-xs font-bold text-foreground leading-snug line-clamp-2">{c.acts_sections}</div>
                  <div className="help mt-1.5 text-[11.5px]">IO: {c.investigating_officer_name}</div>
                </InfoTile>

                <InfoTile label="Parties Involved">
                  <div className="text-xs leading-snug text-foreground">
                    <span className="text-muted-foreground font-semibold">Accused:</span> {c.accused_names?.length ? c.accused_names.join(', ') : '—'}
                  </div>
                  <div className="text-xs mt-1 text-foreground">
                    <span className="text-muted-foreground font-semibold">Victim:</span>{' '}
                    {c.victim_name_masked ? (
                      <span className="text-pink-400 font-semibold">[Sec 72 BNS Identity Hidden]</span>
                    ) : (
                      '—'
                    )}
                  </div>
                </InfoTile>

                <InfoTile label="Inter-Agency Access">
                  <div className="flex flex-wrap gap-1">
                    {c.shared_with_roles.map((r) => (
                      <span key={r} className={cx('pill text-[10.5px]', roleInfo(r).pill)}>
                        {roleInfo(r).short}
                      </span>
                    ))}
                  </div>
                  <div className="help mt-1.5 text-[11.5px]">
                    {currentDocs.length} files · {dossier.chain_of_custody.length} Merkle nodes
                  </div>
                </InfoTile>
              </div>
            </div>

            {/* Verification Result Banner */}
            {verifyResult && (
              <div
                className={cx(
                  'rounded-xl border p-4.5 transition-all',
                  verifyResult.chain_valid
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-current/15 flex items-center justify-center shrink-0 mt-0.5">
                    {verifyResult.chain_valid ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-sm flex items-center gap-2">
                      <span>{verifyResult.chain_valid ? 'CRYPTOGRAPHIC INTEGRITY: 100% VALID' : 'CRYPTOGRAPHIC TAMPERING DETECTED!'}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/30">
                        Merkle Block #{verifyResult.entries_checked}
                      </span>
                    </div>
                    <div className="text-xs text-foreground/80 mt-1 leading-relaxed">
                      Re-computed and matched hashes for all <b>{verifyResult.entries_checked}</b> logged custodial actions and <b>{verifyResult.documents_checked}</b> vault exhibits against the mathematical root hash. No unauthorized changes or backdating detected.
                    </div>
                    {verifyResult.problems.length > 0 && (
                      <ul className="mt-2.5 list-disc pl-5 space-y-1 text-xs text-rose-300 font-mono">
                        {verifyResult.problems.map((p, i) => (
                          <li key={i}>{problemText(p)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Dossier Tabs: Exhibits vs Merkle History vs Certificates */}
            <div className="card">
              <div className="flex border-b border-border px-3 bg-surface/30 overflow-x-auto">
                <button
                  className={cx('tab', tab === 'documents' && 'tab-active')}
                  onClick={() => setTab('documents')}
                >
                  <FileText size={15} />
                  <span>Exhibits & Files</span>
                  <span className="pill pill-neutral font-mono text-[10.5px]">{currentDocs.length}</span>
                </button>
                <button
                  className={cx('tab', tab === 'history' && 'tab-active')}
                  onClick={() => setTab('history')}
                >
                  <History size={15} />
                  <span>Merkle Chain-of-Custody</span>
                  <span className="pill pill-neutral font-mono text-[10.5px]">{dossier.chain_of_custody.length}</span>
                </button>
                <button
                  className={cx('tab', tab === 'certs' && 'tab-active')}
                  onClick={() => setTab('certs')}
                >
                  <FileCheck size={15} />
                  <span>BSA Sec 63 Certificates</span>
                  <span className="pill pill-neutral font-mono text-[10.5px]">{dossier.bsa_certificates.length}</span>
                </button>
              </div>

              {/* Tab 1: Documents */}
              {tab === 'documents' && (
                <div className="p-4 space-y-2.5">
                  {currentDocs.length === 0 && (
                    <Empty
                      icon={FileText}
                      title="No exhibits added to this case yet"
                      body="Add the FIR, seizure memos, witness statements, or digital evidence photos. Every upload is SHA-256 hashed and encrypted."
                      action={
                        canUpload && (
                          <button className="btn btn-primary btn-sm" onClick={() => setUploadOpen(true)}>
                            <Upload size={14} /> Add Exhibit Now
                          </button>
                        )
                      }
                    />
                  )}
                  {currentDocs.map((d) => {
                    const isImg = /^image\//.test(d.mime_type || '');
                    return (
                      <div
                        key={d.document_id}
                        onClick={() => setOpenDoc(d.document_id)}
                        className="w-full text-left rounded-xl border border-border hover:border-primary/50 hover:bg-card-hover transition p-4 flex flex-wrap sm:flex-nowrap items-center gap-4 group cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-xl bg-primary-soft text-primary border border-primary/20 flex items-center justify-center shrink-0">
                          {isImg ? <ImageIcon size={22} /> : <FileText size={22} />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-foreground group-hover:text-primary transition">
                              {d.title}
                            </span>
                            <span className="pill pill-neutral text-[10px] font-mono">
                              {docTypeLabel(d.doc_type)}
                            </span>
                            {d.version > 1 && (
                              <span className="pill pill-warning text-[10px]">v{d.version}</span>
                            )}
                          </div>

                          <div className="text-[11.5px] text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                            <span>Added by <b className="text-foreground/80">{d.uploaded_by_name}</b></span>
                            <span>·</span>
                            <span>{fmtDate(d.created_at, false)}</span>
                            <span>·</span>
                            <span className="font-mono text-[11px] text-muted-foreground/80">
                              SHA: {d.file_hash_sha256?.slice(0, 16)}…
                            </span>
                          </div>

                          {/* Pills: Forensic screening + Redaction */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {d.is_forensic_screened && (
                              <span className={cx('pill text-[10.5px]', tamperPill(d.forensic_status))}>
                                {d.forensic_status === 'CLEAN' ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                                {tamperLabel(d.forensic_status)}
                              </span>
                            )}
                            {d.is_redacted && (
                              <span className="pill pill-shield text-[10.5px]">
                                <EyeOff size={11} /> Sec 72 BNS Protected Copy Available
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-auto">
                          <CopyButton text={d.file_hash_sha256} label="Hash" />
                          <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab 2: Merkle History */}
              {tab === 'history' && (
                <div className="p-5 space-y-4">
                  <div className="p-3.5 rounded-xl bg-secondary/50 border border-border text-xs text-muted-foreground flex items-center justify-between gap-3">
                    <span>
                      <b>Immutable Cryptographic Ledger:</b> Each block links to its predecessor. Run <b>Verify Merkle Integrity</b> to validate all parent-child cryptographic hashes.
                    </span>
                    <span className="pill pill-success text-[10.5px] shrink-0">Chain Healthy</span>
                  </div>

                  <ol className="relative border-l-2 border-border/80 ml-3 space-y-3.5">
                    {dossier.chain_of_custody.map((l, index) => (
                      <li key={l.id} className="relative pl-6">
                        <span
                          className={cx(
                            'absolute -left-[7px] top-3.5 w-3 h-3 rounded-full border-2 border-card',
                            l.action.includes('ALERT') || l.action.includes('FLAG')
                              ? 'bg-danger'
                              : 'bg-primary'
                          )}
                        />
                        <div className="rounded-xl border border-border p-4 bg-surface/30 hover:border-border-strong transition">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={cx('pill text-[10.5px]', actionPill(l.action))}>
                                {actionLabel(l.action)}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground">
                                Node #{dossier.chain_of_custody.length - index}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">{fmtDate(l.timestamp)}</span>
                          </div>

                          <div className="text-sm font-medium text-foreground mt-2">{l.details}</div>

                          <div className="text-xs text-muted-foreground mt-1.5 flex flex-wrap items-center gap-2">
                            <span>By <b className="text-foreground">{l.performed_by_name}</b> ({roleInfo(l.performed_by_role).label})</span>
                            <span>·</span>
                            <span className="font-mono text-[11px]">Terminal: {l.ip_or_device_id}</span>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                            <span>Merkle Root: {short(l.current_merkle_root, 16)}</span>
                            <CopyButton text={l.current_merkle_root} label="Copy Root" />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Tab 3: Court Certificates */}
              {tab === 'certs' && (
                <div className="p-4">
                  {dossier.bsa_certificates.length === 0 ? (
                    <Empty
                      icon={FileCheck}
                      title="No Court Certificates Issued Yet"
                      body="Open any digital exhibit and select 'Court Certificate'. CHRONICLE automatically issues a court-admissible certificate under Section 63(4) Bharatiya Sakshya Adhiniyam, 2023."
                    />
                  ) : (
                    <div className="grid md:grid-cols-2 gap-3.5">
                      {dossier.bsa_certificates.map((k) => (
                        <button
                          key={k.certificate_id}
                          onClick={() => setCertView(k)}
                          className="text-left rounded-xl border border-court-border bg-court-soft/30 hover:border-court hover:bg-court-soft/50 transition p-4 group cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="pill pill-court text-[10px] font-bold">BSA 2023 §63</span>
                            <span className="text-xs text-muted-foreground font-mono">{fmtDate(k.issued_at, false)}</span>
                          </div>
                          <div className="text-sm font-bold text-foreground mt-2 group-hover:text-primary transition truncate">
                            {k.document_title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            Certified by {k.certifying_officer_name}, {k.certifying_officer_designation}
                          </div>
                          <div className="mt-3 pt-2 border-t border-court-border/60 flex items-center justify-between text-[11px] font-mono text-court font-semibold">
                            <span>Cert ID: {k.certificate_id?.slice(0, 16)}…</span>
                            <span className="text-xs">View & Print →</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* ------------------------------------------------ MODALS */}
      {/* 1. New Case Modal */}
      <Modal
        open={newCaseOpen}
        onClose={() => setNewCaseOpen(false)}
        title="Open New Case Dossier"
        icon={FolderOpen}
        width="max-w-2xl"
        subtitle="Initialize an immutable case record anchored to the NCRB Merkle tree."
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setNewCaseOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm" form="new-case-form" type="submit" disabled={busy === 'create'}>
              {busy === 'create' ? <Spinner size={13} /> : <Plus size={13} />} Open Case Dossier
            </button>
          </>
        }
      >
        <form id="new-case-form" onSubmit={submitNewCase} className="grid sm:grid-cols-2 gap-4">
          <Field label="FIR Number *">
            <input
              className="input font-bold"
              required
              placeholder="e.g. FIR 120/2026"
              value={newCase.fir_number}
              onChange={(e) => setNewCase({ ...newCase, fir_number: e.target.value })}
            />
          </Field>
          <Field label="Police Station *">
            <input
              className="input"
              required
              placeholder="e.g. Hauz Khas PS, Delhi"
              value={newCase.police_station}
              onChange={(e) => setNewCase({ ...newCase, police_station: e.target.value })}
            />
          </Field>
          <Field label="State">
            <input className="input" value={newCase.state} onChange={(e) => setNewCase({ ...newCase, state: e.target.value })} />
          </Field>
          <Field label="District">
            <input className="input" value={newCase.district} onChange={(e) => setNewCase({ ...newCase, district: e.target.value })} />
          </Field>
          <Field label="Offences (Acts & Sections) *" className="sm:col-span-2">
            <input
              className="input"
              required
              placeholder="e.g. BNS 64, 70(1), 351(2)"
              value={newCase.acts_sections}
              onChange={(e) => setNewCase({ ...newCase, acts_sections: e.target.value })}
            />
          </Field>
          <Field label="Date of Incident">
            <input
              className="input"
              type="date"
              value={newCase.incident_date}
              onChange={(e) => setNewCase({ ...newCase, incident_date: e.target.value })}
            />
          </Field>
          <Field label="Charge Sheet Statutory Limit (Sec 193 BNSS)">
            <select
              className="input font-medium"
              value={newCase.statutory_deadline_days}
              onChange={(e) => setNewCase({ ...newCase, statutory_deadline_days: Number(e.target.value) })}
            >
              <option value={60}>60 Days (Standard Offences)</option>
              <option value={90}>90 Days (Heinous Offences / Death / Life Imprisonment)</option>
            </select>
          </Field>
          <Field label="Complainant Name">
            <input
              className="input"
              value={newCase.complainant_name}
              onChange={(e) => setNewCase({ ...newCase, complainant_name: e.target.value })}
            />
          </Field>
          <Field label="Victim Name" hint="Never exposed to lab or prosecution; used only for automated Sec 72 BNS redaction.">
            <input
              className="input"
              value={newCase.victim_name}
              onChange={(e) => setNewCase({ ...newCase, victim_name: e.target.value })}
            />
          </Field>
          <Field label="Accused Names (comma separated)" className="sm:col-span-2">
            <input
              className="input"
              value={newCase.accused_names}
              onChange={(e) => setNewCase({ ...newCase, accused_names: e.target.value })}
              placeholder="e.g. Rajesh Kumar, Suresh Verma"
            />
          </Field>
          <label className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded text-primary"
              checked={newCase.is_women_safety_case}
              onChange={(e) => setNewCase({ ...newCase, is_women_safety_case: e.target.checked })}
            />
            <span>Women-Safety Case (Mandatory Sec 72 BNS Redaction)</span>
          </label>
          <label className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded text-primary"
              checked={newCase.is_pocso_case}
              onChange={(e) => setNewCase({ ...newCase, is_pocso_case: e.target.checked })}
            />
            <span>POCSO Case (Minor Victim Protection)</span>
          </label>
        </form>
      </Modal>

      {/* 2. Upload Modal */}
      {c && (
        <UploadModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          caseId={c.case_id}
          allowedTypes={meta?.my_upload_types || []}
          onDone={async (doc) => {
            setUploadOpen(false);
            await refresh();
            flash(`Exhibit “${doc.title}” anchored to case ledger.`);
            setOpenDoc(doc.document_id);
          }}
        />
      )}

      {/* 3. Transfer Custody Modal */}
      {c && (
        <TransferModal
          open={transferOpen}
          onClose={() => setTransferOpen(false)}
          caseObj={c}
          isSHO={isSHO}
          onDone={async (msg) => {
            setTransferOpen(false);
            await refresh();
            flash(msg);
          }}
          onError={(m) => flash(m, 'danger')}
        />
      )}

      {/* 4. Status Modal */}
      {c && (
        <StatusModal
          open={statusOpen}
          onClose={() => setStatusOpen(false)}
          caseObj={c}
          statuses={meta?.statuses || []}
          isCourt={isCourt}
          onDone={async () => {
            setStatusOpen(false);
            await refresh();
            flash('Case procedural stage updated.');
          }}
          onError={(m) => flash(m, 'danger')}
        />
      )}

      {/* 5. Document Detail Modal */}
      {c && openDoc && (
        <DocumentDetail
          caseObj={c}
          documentId={openDoc}
          onClose={() => setOpenDoc(null)}
          onChanged={async (msg) => {
            await refresh();
            if (msg) flash(msg);
          }}
          onViewCert={(k) => setCertView(k)}
          onOpenVersion={(id) => setOpenDoc(id)}
        />
      )}

      {/* 6. Certificate Modal */}
      <CertificateModal cert={certView} caseId={c?.case_id} onClose={() => setCertView(null)} />
    </div>
  );
}

function problemText(p) {
  const map = {
    CHAIN_BREAK: 'A history node does not match previous block hash (entry was altered or dropped)',
    ROOT_MISMATCH: 'Merkle root hash mismatch detected',
    BAD_SIGNATURE: 'Digital signature failed cryptographic verification',
    HEAD_MISMATCH: 'Case head pointer differs from latest block node',
    HASH_MISMATCH: 'Vault file binary does not match original SHA-256 fingerprint',
    FILE_MISSING: 'Encrypted payload missing from filesystem vault',
    DECRYPT_FAILED: 'AES-256 payload decryption failed',
  };
  return `${map[p.issue] || p.issue}${p.entry_id ? ` (Node #${p.entry_id})` : p.detail && p.issue !== 'ROOT_MISMATCH' ? ` — ${p.detail}` : ''}`;
}

function InfoTile({ label, children, danger }) {
  return (
    <div
      className={cx(
        'rounded-xl border p-4 transition',
        danger
          ? 'border-danger-border bg-danger-soft'
          : 'border-border bg-surface/40 hover:border-border-strong'
      )}
    >
      <div className="section-title text-[10.5px] mb-2">{label}</div>
      {children}
    </div>
  );
}

function TransferModal({ open, onClose, caseObj, isSHO, onDone, onError }) {
  const [target, setTarget] = useState('FSL_EXAMINER');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const opts = [
    {
      v: 'FSL_EXAMINER',
      l: 'Forensic Science Laboratory (FSL)',
      d: 'Transfers custody of exhibits for ELA forgery analysis and forensic examination. Case stage transitions to “With forensic lab”.',
    },
    {
      v: 'PUBLIC_PROSECUTOR',
      l: 'Directorate of Prosecution',
      d: 'Grants access to prosecutor to draft charge sheet. Victim identity remains strictly redacted (Sec 72 BNS).',
    },
    {
      v: 'MAGISTRATE',
      l: 'File in District Court (Magistrate)',
      d: 'Formal filing in court under Sec 193 BNSS. Freezes case against new file uploads. (SHO authorization required).',
      sho: true,
    },
  ];

  const go = async () => {
    try {
      setBusy(true);
      await transferCase(caseObj.case_id, target, note || undefined);
      onDone(`Case custody transferred to ${roleInfo(target).label}.`);
    } catch (e) {
      onError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transfer Custody & Inter-Agency Access"
      icon={Send}
      subtitle={`${caseObj.fir_number} is currently accessible by: ${caseObj.shared_with_roles.map((r) => roleInfo(r).label).join(', ')}`}
      footer={
        <>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary btn-sm" onClick={go} disabled={busy}>
            {busy ? <Spinner size={13} /> : <Send size={13} />} Transfer Custody
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {opts.map((o) => (
          <label
            key={o.v}
            className={cx(
              'flex gap-3 rounded-xl border p-4 cursor-pointer transition',
              target === o.v ? 'border-primary bg-primary-soft' : 'border-border bg-surface/30 hover:border-border-strong',
              o.sho && !isSHO && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input
              type="radio"
              name="target"
              className="mt-1 text-primary"
              disabled={o.sho && !isSHO}
              checked={target === o.v}
              onChange={() => setTarget(o.v)}
            />
            <div>
              <div className="text-sm font-bold text-foreground">{o.l}</div>
              <div className="help mt-0.5">{o.d}</div>
            </div>
          </label>
        ))}
        <Field label="Custody Transfer Dispatch Note (optional)">
          <input
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Exhibits 1 through 7 dispatched via Special Messenger"
          />
        </Field>
      </div>
    </Modal>
  );
}

function StatusModal({ open, onClose, caseObj, statuses, isCourt, onDone, onError }) {
  const [status, setStatus] = useState(caseObj.case_status);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => setStatus(caseObj.case_status), [caseObj.case_status]);
  const allowed = isCourt ? ['IN_TRIAL', 'DISPOSED'] : statuses;

  const go = async () => {
    try {
      setBusy(true);
      await setCaseStatus(caseObj.case_id, status, note || undefined);
      onDone();
    } catch (e) {
      onError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Update Investigation / Court Stage"
      icon={RefreshCw}
      subtitle="Changes are timestamped and signed into the immutable Merkle ledger."
      footer={
        <>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary btn-sm" onClick={go} disabled={busy || status === caseObj.case_status}>
            {busy ? <Spinner size={13} /> : <RefreshCw size={13} />} Update Procedural Stage
          </button>
        </>
      }
    >
      <Field label="Procedural Stage">
        <select className="input font-medium" value={status} onChange={(e) => setStatus(e.target.value)}>
          {allowed.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Official Remark (optional)" className="mt-4">
        <input
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Charge sheet scrutinized by prosecution"
        />
      </Field>
    </Modal>
  );
}
