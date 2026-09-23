import React from 'react';
import {
  ScanLine,
  Microscope,
  FileCode2,
  ShieldAlert,
  ClipboardList,
  BarChart3,
  Users,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  Bot
} from 'lucide-react';
import { playPop } from '../../utils/soundEffects';

const PRIMARY_NAV = [
  {
    id: 'scanner',
    label: 'Scan / Upload',
    sub: 'Upload passport & capture photo',
    icon: ScanLine
  },
  {
    id: 'forensics',
    label: 'Forensics Viewer',
    sub: 'Check for photo edits or fakes',
    icon: Microscope
  },
  {
    id: 'mrz',
    label: 'Security Codes (MRZ)',
    sub: 'Check numbers at bottom of passport',
    icon: FileCode2
  },
  {
    id: 'risk',
    label: 'Risk Score & Verdict',
    sub: 'Pass / Fail evaluation details',
    icon: ShieldAlert
  },
  {
    id: 'audit',
    label: 'Inspection Log',
    sub: 'Secure history of all decisions',
    icon: ClipboardList
  },
  {
    id: 'analytics',
    label: 'Station Reports',
    sub: 'Daily summary & fraud counts',
    icon: BarChart3
  }
];

const SECONDARY_NAV = [
  {
    id: 'biometrics',
    label: 'Face Match Check',
    sub: 'Compare face to passport photo',
    icon: Users
  },
  {
    id: 'watchlist',
    label: 'Stolen IDs & Alerts',
    sub: 'Police & Interpol alert lists',
    icon: AlertTriangle
  }
];

export default function Sidebar({ activeTab, onSelectTab, onOpenCopilot }) {
  return (
    <aside className="dashboard-sidebar-fixed" aria-label="Main Navigation">
      {/* Brand & System Identifier */}
      <div style={{
        padding: '18px 18px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 7,
            background: 'linear-gradient(135deg, var(--teal-600) 0%, var(--teal-700) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(13,148,136,0.3)',
            flexShrink: 0
          }}>
            <ShieldCheck size={18} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                ARGUS
              </span>
              <span style={{
                fontSize: '9.5px',
                fontWeight: 700,
                color: '#0D9488',
                background: '#F0FDFA',
                border: '1px solid #99F6E4',
                padding: '1px 6px',
                borderRadius: 4
              }}>
                DEFENSE
              </span>
            </div>
            <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 500 }}>
              Identity Screener
            </div>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div style={{
        flex: 1,
        padding: '14px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        overflowY: 'auto'
      }}>
        {/* Primary Sections Group */}
        <div>
          <div style={{
            padding: '0 10px 8px',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#64748B'
          }}>
            Inspection Station
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {PRIMARY_NAV.map(({ id, label, sub, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  id={`nav_btn_${id}`}
                  onClick={() => {
                    playPop();
                    onSelectTab(id);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid transparent',
                    borderLeft: active ? '3px solid #0D9488' : '3px solid transparent',
                    background: active ? '#F0FDFA' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => {
                    if (!active) e.currentTarget.style.background = '#F8FAFC';
                  }}
                  onMouseLeave={e => {
                    if (!active) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: active ? '#CCFBF1' : '#F1F5F9',
                    color: active ? '#0F766E' : '#475569'
                  }}>
                    <Icon size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '12.5px',
                      fontWeight: active ? 700 : 600,
                      color: active ? '#0F172A' : '#334155',
                      lineHeight: 1.25,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {label}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: '#94A3B8',
                      lineHeight: 1.2,
                      marginTop: 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {sub}
                    </div>
                  </div>
                  {active && <ChevronRight size={13} color="#0D9488" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Intelligence / Additional Checks */}
        <div>
          <div style={{
            padding: '0 10px 8px',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#64748B'
          }}>
            Cross-Verification
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {SECONDARY_NAV.map(({ id, label, sub, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  id={`nav_btn_${id}`}
                  onClick={() => {
                    playPop();
                    onSelectTab(id);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid transparent',
                    borderLeft: active ? '3px solid #0D9488' : '3px solid transparent',
                    background: active ? '#F0FDFA' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => {
                    if (!active) e.currentTarget.style.background = '#F8FAFC';
                  }}
                  onMouseLeave={e => {
                    if (!active) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: active ? '#CCFBF1' : '#F1F5F9',
                    color: active ? '#0F766E' : '#475569'
                  }}>
                    <Icon size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '12.5px',
                      fontWeight: active ? 700 : 600,
                      color: active ? '#0F172A' : '#334155',
                      lineHeight: 1.25
                    }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94A3B8', lineHeight: 1.2, marginTop: 1 }}>
                      {sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* AI Assistant Button — docked above telemetry */}
      {onOpenCopilot && (
        <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => { playPop(); onOpenCopilot(); }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 12px',
              borderRadius: 6,
              border: '1px solid #99F6E4',
              background: '#F0FDFA',
              color: '#0F766E',
              cursor: 'pointer',
              fontSize: '12.5px',
              fontWeight: 700,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#CCFBF1'}
            onMouseLeave={e => e.currentTarget.style.background = '#F0FDFA'}
          >
            <Bot size={14} />
            <span style={{ flex: 1, textAlign: 'left' }}>Officer AI Assistant</span>
            <span style={{
              background: '#0D9488',
              color: '#FFFFFF',
              fontSize: '9px',
              padding: '1px 5px',
              borderRadius: 3,
              fontWeight: 700
            }}>Online</span>
          </button>
        </div>
      )}

      {/* Station Telemetry Footer */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid var(--border)',
        background: '#F8FAFC'
      }}>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 6,
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A' }}>
              Station: DEL-T3-GATE-4
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '10px',
              fontWeight: 700,
              color: '#16A34A'
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#16A34A',
                boxShadow: '0 0 6px #16A34A'
              }} />
              Online
            </span>
          </div>
          <div style={{ fontSize: '10px', color: '#64748B' }}>
            Passport &amp; ID screening ready
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileBottomNav({ activeTab, onSelectTab }) {
  const tabs = [
    { id: 'scanner', label: 'Scan', icon: ScanLine },
    { id: 'forensics', label: 'Forensics', icon: Microscope },
    { id: 'mrz', label: 'MRZ', icon: FileCode2 },
    { id: 'risk', label: 'Risk', icon: ShieldAlert },
    { id: 'audit', label: 'Audit', icon: ClipboardList }
  ];

  return (
    <div
      className="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(255,255,255,0.98)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid #E2E8F0',
        padding: '6px 8px',
        display: 'none',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 50,
        boxShadow: '0 -2px 10px rgba(15,23,42,0.08)'
      }}
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => {
              playPop();
              onSelectTab(id);
            }}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              cursor: 'pointer',
              color: active ? '#0D9488' : '#64748B',
              padding: '4px'
            }}
          >
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: active ? '#F0FDFA' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon size={16} color={active ? '#0D9488' : '#64748B'} />
            </div>
            <span style={{ fontSize: '9.5px', fontWeight: active ? 700 : 500 }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
