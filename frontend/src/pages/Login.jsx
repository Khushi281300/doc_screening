import React, { useState } from 'react';
import {
  ShieldCheck, Eye, EyeOff, ArrowRight, Lock, History, FileCheck,
  UserCheck, FlaskConical, Scale, Gavel, Cpu, KeyRound, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Spinner, Alert, Field, ThemeToggle } from '../components/ui';

const DEMO_ACCOUNTS = [
  {
    badge: 'IO-1001',
    title: 'Investigating Officer',
    role: 'POLICE · IO',
    desc: 'Opens cases, uploads FIRs, case diaries, witness statements & exhibits.',
    icon: UserCheck,
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/30'
  },
  {
    badge: 'SHO-001',
    title: 'Station House Officer',
    role: 'POLICE · COMMAND',
    desc: 'Supervises, approves, locks case record & files charge sheet in court.',
    icon: ShieldCheck,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
  },
  {
    badge: 'FSL-008',
    title: 'Forensic Lab (FSL)',
    role: 'EXAMINER',
    desc: 'Receives digital exhibits, conducts ELA/SIFT forensics, uploads lab reports.',
    icon: FlaskConical,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  },
  {
    badge: 'PP-021',
    title: 'Public Prosecutor',
    role: 'DIRECTORATE',
    desc: 'Prepares prosecution; views automated Sec 72 BNS victim-redacted dossier.',
    icon: Scale,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30'
  },
  {
    badge: 'MAG-004',
    title: 'Court (Magistrate)',
    role: 'JUDICIAL BENCH',
    desc: 'Verifies cryptographic SHA-256 Merkle integrity; admits BSA Sec 63 evidence.',
    icon: Gavel,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
  },
];

export default function Login() {
  const { login, error: authError } = useAuth();
  const [badge, setBadge] = useState('IO-1001');
  const [password, setPassword] = useState('demo1234');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');

  const submit = async (b = badge, p = password) => {
    if (!b.trim() || !p) {
      setLocalError('Please enter your badge ID and authentication password.');
      return;
    }
    setLocalError('');
    setBusy(true);
    try {
      await login(b, p);
    } catch (e) {
      setLocalError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const error = localError || authError;

  return (
    <div className="min-h-screen bg-background relative flex flex-col justify-between">
      {/* Top Banner */}
      <div>
        <div className="tricolour" />
        <header className="px-6 py-4 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center shadow-md shadow-primary/20">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight text-foreground flex items-center gap-2">
                <span>CHRONICLE</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-soft text-primary border border-primary/25">
                  SIH 2026 · PS 26190
                </span>
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                Ministry of Home Affairs · National Crime Records Bureau (NCRB)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-glow" />
              <span>Zero-Trust Blockchain Grid</span>
            </div>
            <ThemeToggle />
          </div>
        </header>
      </div>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full p-4 md:p-8 my-auto grid lg:grid-cols-[1fr_420px] gap-8 items-start">
        {/* Left Column: Mission & Demo Accounts */}
        <div className="space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-soft border border-primary/25 text-xs font-bold text-primary mb-3">
              <Cpu size={13} />
              <span>CRYPTOGRAPHIC REPOSITORY FOR NCRB INVESTIGATIONS & EVIDENCE</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              Tamper-Proof Legal Records & Digital Chain-of-Custody
            </h1>
            <p className="text-muted-foreground mt-3 text-sm md:text-[15px] leading-relaxed max-w-2xl">
              FIRs, case diaries, witness statements, forensic exhibits and court certificates — anchored in an immutable SHA-256 Merkle tree with automated Section 72 BNS victim redaction and BSA 2023 Section 63 electronic certification.
            </p>
          </div>

          {/* 3 Capability Pillars */}
          <div className="grid sm:grid-cols-3 gap-3.5">
            <div className="card p-4 bg-surface/50 border-border hover:border-primary/40 transition">
              <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary border border-primary/20 flex items-center justify-center mb-2.5">
                <Lock size={17} />
              </div>
              <div className="text-sm font-bold text-foreground">Encrypted & Anchored</div>
              <div className="text-xs text-muted-foreground mt-1 leading-snug">
                Every file is hashed (SHA-256) and anchored in an immutable Merkle tree to prevent backdating.
              </div>
            </div>

            <div className="card p-4 bg-surface/50 border-border hover:border-primary/40 transition">
              <div className="w-9 h-9 rounded-lg bg-shield-soft text-shield border border-shield/20 flex items-center justify-center mb-2.5">
                <ShieldCheck size={17} />
              </div>
              <div className="text-sm font-bold text-foreground">Women Safety Shield</div>
              <div className="text-xs text-muted-foreground mt-1 leading-snug">
                Sec 72 BNS automated redaction protects victim identity in sexual assault and POCSO cases.
              </div>
            </div>

            <div className="card p-4 bg-surface/50 border-border hover:border-primary/40 transition">
              <div className="w-9 h-9 rounded-lg bg-court-soft text-court border border-court/20 flex items-center justify-center mb-2.5">
                <FileCheck size={17} />
              </div>
              <div className="text-sm font-bold text-foreground">BSA 2023 Sec 63</div>
              <div className="text-xs text-muted-foreground mt-1 leading-snug">
                One-click court electronic evidence certificate with device hardware hash & digital signature.
              </div>
            </div>
          </div>

          {/* Persona Fast Login Card */}
          <div className="card p-5 border-border bg-card">
            <div className="flex items-center justify-between mb-3.5">
              <div className="section-title text-[11px] text-primary">Select Official Role for Instant Access</div>
              <span className="text-[11px] text-muted-foreground font-mono">Password: demo1234</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-2.5">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                const isSelected = badge === acc.badge;
                return (
                  <button
                    key={acc.badge}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setBadge(acc.badge);
                      setPassword('demo1234');
                      submit(acc.badge, 'demo1234');
                    }}
                    className={`flex items-start gap-3 text-left rounded-xl border p-3 transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary-soft shadow-sm ring-1 ring-primary/40'
                        : 'border-border bg-surface/40 hover:border-border-strong hover:bg-card-hover'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${acc.color}`}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="text-[13px] font-bold text-foreground truncate">{acc.title}</div>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-secondary text-muted-foreground">
                          {acc.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                        {acc.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Secure Login Card */}
        <form
          className="card p-6 md:p-7 space-y-5 bg-card/90 backdrop-blur-xl border-border shadow-2xl relative"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="border-b border-border pb-4">
            <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-1">
              <KeyRound size={13} />
              <span>Identity Verification</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">Sign In to DMS</h2>
            <p className="help mt-1">Authenticate using your official government badge ID.</p>
          </div>

          <Field label="Official Badge / System ID">
            <input
              className="input mono uppercase tracking-wider"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="e.g. IO-1001, SHO-001"
              autoComplete="username"
            />
          </Field>

          <Field label="Master Access Key / Password">
            <div className="relative">
              <input
                className="input pr-10"
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                aria-label="Show password"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          {error && <Alert kind="danger">{error}</Alert>}

          <button type="submit" disabled={busy} className="btn btn-primary w-full py-3 text-sm font-bold shadow-lg">
            {busy ? <Spinner size={16} /> : <ArrowRight size={16} />}
            <span>{busy ? 'Authenticating Officer…' : 'Access Investigation Grid'}</span>
          </button>

          <div className="pt-3 border-t border-border/70 flex items-center justify-center gap-1.5 text-[11.5px] text-muted-foreground">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span>Hardware-Bound PKI & AES-256 Encryption Active</span>
          </div>
        </form>
      </main>

      {/* Login Footer */}
      <footer className="border-t border-border px-6 py-3 bg-card/40 text-center text-xs text-muted-foreground">
        <span>Smart India Hackathon 2026 · Problem Statement 26190 · Ministry of Home Affairs / NCRB</span>
      </footer>
    </div>
  );
}
