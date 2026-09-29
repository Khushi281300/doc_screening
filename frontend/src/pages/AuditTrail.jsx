import React, { useEffect, useState } from 'react';
import { History, AlertTriangle, ShieldCheck, Filter, Download, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { getAudit, getAuditSummary, getCases, errMsg } from '../api/client';
import { roleInfo, actionLabel, actionPill } from '../labels';
import { Alert, Spinner, cx, fmtDate, Field } from '../components/ui';

export default function AuditTrail({ onOpenCase }) {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState(null);
  const [cases, setCases] = useState([]);
  const [f, setF] = useState({ case_id: '', action: '', actor: '' });
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setBusy(true);
      const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
      const [a, s, c] = await Promise.all([getAudit({ ...params, limit: 300 }), getAuditSummary(), getCases()]);
      setEntries(a.entries);
      setTotal(a.total);
      setSummary(s);
      setCases(c.cases);
      setError('');
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, [f]); // eslint-disable-line

  const actions = Object.keys(summary?.by_action || {}).sort();
  const actors = Object.entries(summary?.by_actor || {});

  return (
    <div className="space-y-6">
      {/* Header Deck */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-soft text-primary border border-primary/25 text-xs font-bold mb-2">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>NON-REPUDIABLE SHA-256 MERKLE AUDIT LEDGER</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            Immutable Activity Log
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            Every access, exhibit ingestion, download, redaction, inter-agency transfer, and court certification is cryptographically signed and chained.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {summary?.alerts > 0 && (
            <span className="pill pill-danger text-xs font-bold px-3 py-1.5">
              <AlertTriangle size={14} /> {summary.alerts} Tamper Warnings
            </span>
          )}
          <span className="pill pill-success text-xs font-bold px-3 py-1.5">
            <CheckCircle2 size={14} /> {total} Verified Events
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4.5 bg-card border-border grid sm:grid-cols-3 gap-4">
        <Field label="Filter by Case Dossier">
          <select className="input font-medium" value={f.case_id} onChange={(e) => setF({ ...f, case_id: e.target.value })}>
            <option value="">All active cases</option>
            {cases.map((c) => (
              <option key={c.case_id} value={c.case_id}>
                {c.fir_number} — {c.police_station}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Filter by Action Type">
          <select className="input font-medium" value={f.action} onChange={(e) => setF({ ...f, action: e.target.value })}>
            <option value="">All custody actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {actionLabel(a)} ({summary.by_action[a]})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Filter by Official / Officer">
          <select className="input font-medium" value={f.actor} onChange={(e) => setF({ ...f, actor: e.target.value })}>
            <option value="">All officers & examiners</option>
            {actors.map(([b, v]) => (
              <option key={b} value={b}>
                {v.name} — {roleInfo(v.role).label} ({v.count})
              </option>
            ))}
          </select>
        </Field>
      </div>

      {error && <Alert kind="danger">{error}</Alert>}

      {/* Audit Log Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-surface/70 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left font-bold px-5 py-3.5">Timestamp (IST)</th>
                <th className="text-left font-bold px-4 py-3.5">Action Executed</th>
                <th className="text-left font-bold px-4 py-3.5">Case FIR</th>
                <th className="text-left font-bold px-4 py-3.5">Officer / Agency</th>
                <th className="text-left font-bold px-5 py-3.5">Audit Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {busy && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                    <Spinner size={16} className="inline mr-2" /> Decrypting and validating ledger blocks…
                  </td>
                </tr>
              )}
              {!busy && entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                    No logged entries match the selected filters.
                  </td>
                </tr>
              )}
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-card-hover/80 align-middle transition">
                  <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap font-mono text-[11.5px]">
                    {fmtDate(e.timestamp)}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={cx('pill text-[10.5px]', actionPill(e.action))}>
                      {actionLabel(e.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <button
                      className="font-bold text-primary hover:underline font-mono text-xs cursor-pointer"
                      onClick={() => onOpenCase(e.case_id)}
                    >
                      {e.fir_number || e.case_id}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="font-bold text-foreground">{e.performed_by_name}</div>
                    <div className="text-[11px] text-muted-foreground">{roleInfo(e.performed_by_role).label}</div>
                  </td>
                  <td className="px-5 py-3.5 text-foreground/90 max-w-md font-medium leading-relaxed">
                    {e.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-surface/40 border border-border text-xs text-muted-foreground flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <History size={14} className="text-primary" />
          <span>Ledger entries are permanent and non-deletable. Any alteration would invalidate the Merkle root hash.</span>
        </span>
        <span className="font-mono text-[11px]">SHA-256 Chained</span>
      </div>
    </div>
  );
}
