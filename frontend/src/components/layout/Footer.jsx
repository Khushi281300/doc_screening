import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Footer({ engineMode = 'LIVE_BACKEND' }) {
  const { officer } = useAuth();
  const checkpoint = officer?.checkpoint_id || 'Station Gate 4';

  return (
    <footer className="dashboard-footer-bar" role="contentinfo">
      {/* Left: System Status dot + Station Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#475569' }}>
        <span style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: engineMode === 'LIVE_BACKEND' ? '#16A34A' : '#D97706',
          boxShadow: engineMode === 'LIVE_BACKEND' ? '0 0 6px #16A34A' : 'none',
          display: 'inline-block'
        }} />
        <span style={{ fontWeight: 600 }}>
          {engineMode === 'LIVE_BACKEND' ? 'System Online' : 'Demo Test Mode'}
        </span>
        <span style={{ color: '#CBD5E1' }}>•</span>
        <span style={{ color: '#64748B' }}>
          {checkpoint}
        </span>
      </div>

      {/* Right: Clean Version info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748B' }}>
        <span style={{ fontWeight: 600, color: '#0F172A' }}>ARGUS v2</span>
      </div>
    </footer>
  );
}
