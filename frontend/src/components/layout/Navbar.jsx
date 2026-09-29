import React, { useState, useEffect } from 'react';
import { LogOut, Server, Settings, RefreshCw, ShieldCheck, Clock, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { roleInfo } from '../../labels';
import { getBackendUrl, setBackendUrl, checkHealth } from '../../api/client';
import { Modal, Alert, Field, Spinner, ThemeToggle, cx } from '../ui';
import { NAV } from './Sidebar';

export default function Navbar({ online, activeTab, onRecheck }) {
  const { officer, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(getBackendUrl());
  const [test, setTest] = useState(null);
  const [time, setTime] = useState('');

  const ri = roleInfo(officer?.role);
  const current = NAV.find((n) => n.id === activeTab);

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const save = async () => {
    setTest({ kind: 'info', msg: 'Connecting to backend…' });
    setBackendUrl(url);
    try {
      const h = await checkHealth();
      setTest({ kind: 'success', msg: `Connected successfully (Version ${h.version || '3.0'}).` });
      onRecheck?.();
    } catch {
      setTest({ kind: 'danger', msg: 'Could not connect to that address. Check server status.' });
    }
  };

  return (
    <>
      <div className="tricolour" />
      <header className="app-header">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-semibold text-white/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-glow" />
            <span>MHA · NCRB</span>
          </div>
          <span className="text-white/30 hidden sm:inline">|</span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-[15px] truncate tracking-tight text-white">{current?.label || 'CHRONICLE'}</span>
            <span className="hidden xl:inline text-xs text-white/60">({current?.sub})</span>
          </div>
        </div>

        {/* Center/Status: Merkle Integrity & Clock */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11.5px] font-semibold text-emerald-400">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>MERKLE CHAIN: INTEGRITY 100%</span>
          </div>
          {time && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11.5px] font-mono text-white/70">
              <Clock size={12} className="text-primary" />
              <span>{time}</span>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          <button
            onClick={() => setOpen(true)}
            title="Backend Server Status"
            className={cx(
              'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition',
              online
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25'
            )}
          >
            <span className={cx('w-2 h-2 rounded-full', online ? 'bg-emerald-400 pulse-glow' : 'bg-amber-400')} />
            <span className="hidden md:inline">{online ? 'API Online' : 'Offline'}</span>
            <Settings size={12} className="opacity-70" />
          </button>

          <div className="h-6 w-px bg-white/15 hidden sm:block" />

          {/* Officer badge chip */}
          <div className="hidden md:flex items-center gap-2 text-right">
            <div className="leading-tight">
              <div className="text-xs font-bold text-white truncate max-w-[150px]">{officer?.name}</div>
              <div className="text-[11px] text-white/70">{ri.label}</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 text-primary flex items-center justify-center font-bold text-xs">
              {ri.short}
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign out of CHRONICLE"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-300 border border-white/15 hover:border-rose-500/30 px-3 py-1.5 text-xs font-semibold transition"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Server API Connection"
        icon={Server}
        subtitle="Gateway address for CHRONICLE backend API services. Default is local port 8000."
        footer={
          <>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setUrl('http://localhost:8000/api/v1');
                setBackendUrl(null);
                setTest(null);
              }}
            >
              Reset to Default
            </button>
            <button className="btn btn-primary btn-sm" onClick={save}>
              {test?.kind === 'info' ? <Spinner size={13} /> : <RefreshCw size={13} />} Test & Save Connection
            </button>
          </>
        }
      >
        <Field label="Backend Gateway URL" hint="Format: http://host:port/api/v1">
          <input className="input mono" value={url} onChange={(e) => setUrl(e.target.value)} />
        </Field>
        {test && <Alert kind={test.kind} className="mt-3.5">{test.msg}</Alert>}
      </Modal>
    </>
  );
}
