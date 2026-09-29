import React, { useEffect, useState } from 'react';
import {
  FolderOpen, Clock, AlertTriangle, FileText, FileCheck, ArrowRight,
  History, ShieldCheck, ArrowUpRight, Scale, ShieldAlert, Cpu, CheckCircle2
} from 'lucide-react';
import { getStats, getAudit, errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { roleInfo, statusLabel, statusPill, actionLabel, actionPill } from '../labels';
import { Stat, Alert, Spinner, fmtDate, cx } from '../components/ui';

export default function Dashboard({ onOpenCase, onGoTo }) {
  const { officer } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getStats(), getAudit({ limit: 10 })])
      .then(([s, a]) => {
        setStats(s);
        setRecent(a.entries);
      })
      .catch((e) => setError(errMsg(e)));
  }, []);

  if (error) return <Alert kind="danger">{error}</Alert>;
  if (!stats) {
    return (
      <div className="flex items-center justify-center p-16 text-sm text-muted-foreground gap-2.5">
        <Spinner size={18} />
        <span>Synchronizing with Cryptographic Case Grid…</span>
      </div>
    );
  }

  const ri = roleInfo(officer?.role);

  return (
    <div className="space-y-6">
      {/* Top Welcome Deck */}
      <div className="card p-6 bg-gradient-to-r from-card via-surface/60 to-card border-border flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-glow" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              NCRB Evidentiary Grid · Live Session
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            Welcome, {officer?.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            Authenticated as <b className="text-foreground">{ri.label}</b> ({officer?.station_id || 'Crime Branch Central'}). Showing records authorized for your clearance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button className="btn btn-secondary btn-sm" onClick={() => onGoTo('search')}>
            Forensic Search
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onGoTo('cases')}>
            View All Cases <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Active Case Dossiers"
          value={stats.cases_total}
          sub={`${stats.women_safety_cases} protected under Sec 72 BNS`}
          icon={FolderOpen}
          tone="neutral"
        />
        <Stat
          label="Charge Sheet Clock (Sec 193 BNSS)"
          value={stats.deadline_at_risk}
          sub={stats.deadline_at_risk > 0 ? 'CRITICAL: ≤ 10 days to default bail' : 'All statutory deadlines on track'}
          tone={stats.deadline_at_risk > 0 ? 'danger' : 'success'}
          icon={Clock}
        />
        <Stat
          label="Digital Evidence Exhibits"
          value={stats.documents_total}
          sub={stats.documents_flagged > 0 ? `${stats.documents_flagged} flagged by ELA/SIFT scanner` : '0 tamper flags detected'}
          tone={stats.documents_flagged > 0 ? 'warning' : 'neutral'}
          icon={FileText}
        />
        <Stat
          label="Court Certificates Issued"
          value={stats.certificates_total}
          sub={`${stats.custody_entries_total} Merkle actions verified`}
          tone="primary"
          icon={FileCheck}
        />
      </div>

      {/* Inter-Agency Handshake Pipeline Banner */}
      <div className="card p-4.5 bg-surface/40 border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="section-title text-[11px] text-primary flex items-center gap-1.5">
            <Cpu size={13} /> Zero-Trust Inter-Agency Digital Handshake Pipeline
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">Police ➔ FSL ➔ Prosecution ➔ Court</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-card border border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center font-bold text-xs shrink-0">1</div>
            <div>
              <div className="font-bold text-foreground">Police (IO / SHO)</div>
              <div className="text-muted-foreground text-[11px]">FIR & Evidence Ingestion</div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs shrink-0">2</div>
            <div>
              <div className="font-bold text-foreground">Forensic Lab (FSL)</div>
              <div className="text-muted-foreground text-[11px]">ELA Forensics & Reports</div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs shrink-0">3</div>
            <div>
              <div className="font-bold text-foreground">Prosecutor (PP)</div>
              <div className="text-muted-foreground text-[11px]">Sec 72 BNS Redacted Dossier</div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold text-xs shrink-0">4</div>
            <div>
              <div className="font-bold text-foreground">Judicial Magistrate</div>
              <div className="text-muted-foreground text-[11px]">Sec 63 BSA Certificate Check</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Deadlines vs Recent Activity */}
      <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.35fr)] gap-5">
        {/* Left: Statutory Deadlines */}
        <section className="card min-w-0 flex flex-col justify-between">
          <div>
            <div className="card-header">
              <div className="card-title">
                <Clock size={18} className="text-danger" />
                <span>Statutory Charge Sheet Clocks</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => onGoTo('cases')}>
                All cases <ArrowRight size={13} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border text-xs text-muted-foreground leading-relaxed">
                Under <b className="text-foreground">Sec 193 BNSS</b>, charge sheets must be submitted within 60 or 90 days of arrest. Failure to file on time entitles the accused to statutory default bail.
              </div>

              {stats.deadline_at_risk_cases.length === 0 ? (
                <div className="rounded-xl bg-success-soft border border-success-border text-success text-xs font-semibold p-4 flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>No active case is within 10 days of its statutory filing deadline.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {stats.deadline_at_risk_cases.map((c) => (
                    <button
                      key={c.case_id}
                      onClick={() => onOpenCase(c.case_id)}
                      className="w-full text-left rounded-xl border border-danger-border bg-danger-soft p-4 hover:border-danger transition flex items-center gap-3.5 group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg bg-danger/15 text-danger flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-foreground group-hover:text-danger transition">
                          {c.fir_number} <span className="text-muted-foreground font-normal">· {c.police_station}</span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-0.5">{c.acts_sections}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-black text-danger leading-none">
                          {c.days_remaining_for_chargesheet}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-medium mt-0.5">days left</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Status Breakdown */}
              <div className="pt-2">
                <div className="section-title mb-2.5">Active Cases by Procedural Stage</div>
                <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-surface/30">
                  {Object.entries(stats.by_status).map(([s, n]) => (
                    <div key={s} className="px-4 py-2.5 flex items-center justify-between text-xs">
                      <span className={cx('pill', statusPill(s))}>{statusLabel(s)}</span>
                      <span className="font-mono font-bold text-foreground text-sm">{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Live Tamper-Proof Audit Feed */}
        <section className="card min-w-0">
          <div className="card-header">
            <div className="card-title">
              <History size={18} className="text-primary" />
              <span>Immutable Chain-of-Custody Feed</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onGoTo('audit')}>
              Full log <ArrowRight size={13} />
            </button>
          </div>

          <ul className="divide-y divide-border">
            {recent.map((e) => (
              <li
                key={e.id}
                className="px-5 py-3.5 flex items-start gap-3.5 hover:bg-card-hover transition cursor-pointer"
                onClick={() => onOpenCase(e.case_id)}
              >
                <span className={cx('pill shrink-0 mt-0.5', actionPill(e.action))}>
                  {actionLabel(e.action)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground leading-snug">{e.details}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground/80">{e.performed_by_name}</span>
                    <span>·</span>
                    <span className="font-mono text-primary font-semibold">{e.fir_number}</span>
                    <span>·</span>
                    <span className="font-mono">{fmtDate(e.timestamp)}</span>
                  </div>
                </div>
                <ArrowUpRight size={15} className="text-muted-foreground opacity-60 shrink-0 self-center" />
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* NCRB Women Safety Shield Mandate Alert */}
      <div className="p-4 rounded-xl bg-shield-soft border border-shield-border flex items-start gap-3.5 text-xs text-foreground">
        <ShieldCheck size={20} className="text-shield shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <b className="text-shield font-bold">Section 72 BNS Automated Privacy Shield Active:</b> In women-safety and POCSO cases, CHRONICLE automatically redacts the victim's name, parentage, phone number, address and hospital details before sharing exhibits with the Forensic Science Lab (FSL) or Public Prosecutor. Only the Investigating Police Station and the Judicial Bench retain cryptographic access to the unredacted original.
        </div>
      </div>
    </div>
  );
}
