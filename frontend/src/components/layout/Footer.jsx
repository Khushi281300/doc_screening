import React from 'react';
import { Shield, Radio, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Footer({ engineMode = 'LIVE_BACKEND' }) {
  const { officer } = useAuth();
  const checkpoint = officer?.checkpoint_id || 'DEL-T3-GATE-4';
  const badgeId = officer?.badge_id || 'BC-1001';

  return (
    <footer className="dashboard-footer-bar" role="contentinfo">
      {/* Left: Security Classification */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: '#F1F5F9',
          border: '1px solid #E2E8F0',
          borderRadius: 4,
          padding: '2px 8px',
          fontSize: '10px',
          fontWeight: 700,
          color: '#334155',
          letterSpacing: '0.06em',
          textTransform: 'uppercase'
        }}>
          <Shield size={12} color="#0D9488" />
          <span>Passport Inspection Station</span>
        </div>
        <span className="hide-on-mobile" style={{ fontSize: 11, color: '#64748B' }}>
          Border Control &amp; Document Screening System
        </span>
      </div>

      {/* Center: System Status */}
      <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#475569' }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: engineMode === 'LIVE_BACKEND' ? '#16A34A' : '#D97706',
            boxShadow: engineMode === 'LIVE_BACKEND' ? '0 0 6px #16A34A' : 'none'
          }} />
          <span style={{ fontSize: 11, fontWeight: 600 }}>
            {engineMode === 'LIVE_BACKEND' ? 'System Online (Live Scanner Active)' : 'System Ready (Demo Test Mode)'}
          </span>
        </div>
        <span style={{ color: '#CBD5E1' }}>•</span>
        <span style={{ fontSize: 11, color: '#64748B' }}>
          Gate: {checkpoint}
        </span>
        <span style={{ color: '#CBD5E1' }}>•</span>
        <span style={{ fontSize: 11, color: '#64748B' }}>
          Badge ID: {badgeId}
        </span>
      </div>

      {/* Right: Simple System Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#64748B' }}>
        <span>Official Checkpoint Desk</span>
        <span style={{ color: '#CBD5E1' }}>•</span>
        <span style={{ fontWeight: 600, color: '#0F172A' }}>ARGUS v2</span>
      </div>
    </footer>
  );
}
