import React from 'react';
import { Home, FolderOpen, Search, History, ShieldCheck, Lock, Radio } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { roleInfo } from '../../labels';
import { cx } from '../ui';

export const NAV = [
  { id: 'dashboard', label: 'Command Deck', sub: 'Deadlines & live activity', icon: Home },
  { id: 'cases', label: 'Case Dossiers', sub: 'FIRs, exhibits & Merkle tree', icon: FolderOpen },
  { id: 'search', label: 'Forensic Search', sub: 'Semantic full-text inquiry', icon: Search },
  { id: 'audit', label: 'Immutable Ledger', sub: 'Zero-trust audit history', icon: History },
];

export default function Sidebar({ activeTab, onSelectTab }) {
  const { officer } = useAuth();
  const ri = roleInfo(officer?.role);

  return (
    <aside className="app-sidebar" aria-label="Main navigation">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-border flex items-center gap-3.5 bg-surface/30">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
          <ShieldCheck size={22} />
        </div>
        <div className="leading-tight min-w-0">
          <div className="text-base font-extrabold tracking-tight text-foreground flex items-center gap-1.5">
            <span>CHRONICLE</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/25">v3.0</span>
          </div>
          <div className="text-[11px] text-muted-foreground truncate font-medium">NCRB Forensic DMS Grid</div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
        <div className="section-title px-3 pt-2 pb-1 text-[10.5px]">Main Console</div>
        {NAV.map(({ id, label, sub, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onSelectTab(id)}
              className={cx(
                'w-full flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-left transition-all duration-150 relative group cursor-pointer border',
                active
                  ? 'bg-primary-soft text-primary border-primary/30 shadow-sm'
                  : 'hover:bg-card-hover text-foreground/80 hover:text-foreground border-transparent'
              )}
            >
              {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />}
              <div
                className={cx(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-muted-foreground group-hover:text-primary group-hover:bg-primary/10'
                )}
              >
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-bold leading-tight">{label}</div>
                <div className={cx('text-[11px] truncate mt-0.5', active ? 'text-primary/80 font-medium' : 'text-muted-foreground')}>
                  {sub}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Security Clearance Pass */}
      <div className="p-3.5 border-t border-border bg-surface/50">
        <div className="p-3.5 rounded-xl border border-border bg-card/70 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="section-title text-[10px] text-primary flex items-center gap-1">
              <Radio size={10} className="text-emerald-400 pulse-glow" /> Officer Clearance
            </span>
            <span className="text-[10px] mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-semibold">
              {officer?.station_id || 'CENTRAL'}
            </span>
          </div>

          <div>
            <div className="text-[13px] font-extrabold text-foreground truncate">{officer?.name}</div>
            <div className="text-[11.5px] text-muted-foreground font-medium">{ri.label}</div>
          </div>

          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
            <span>Badge: {officer?.badge_id}</span>
            <span className="flex items-center gap-1 text-emerald-400 font-sans font-semibold text-[10px]">
              <Lock size={10} /> AES-256
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav({ activeTab, onSelectTab }) {
  return (
    <div className="mobile-nav">
      {NAV.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onSelectTab(id)}
            className={cx(
              'flex flex-col items-center gap-1 px-3 py-1.5 text-[11px] font-semibold rounded-lg transition',
              active ? 'text-primary bg-primary/10' : 'text-muted-foreground'
            )}
          >
            <Icon size={18} /> {label}
          </button>
        );
      })}
    </div>
  );
}
