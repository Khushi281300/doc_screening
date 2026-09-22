import React, { useState } from 'react';
import {
  ShieldCheck,
  ChevronDown,
  Settings,
  LogOut,
  Server,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Volume2,
  VolumeX,
  HelpCircle,
  Radio
} from 'lucide-react';
import { getBackendUrl, setBackendUrl, checkHealth } from '../../api/client';
import { isSoundEnabled, setSoundEnabled, playPop } from '../../utils/soundEffects';
import { useAuth } from '../../context/AuthContext';
import HowItWorksModal from './HowItWorksModal';

export default function Navbar({ engineMode = 'LIVE_BACKEND', activeTab = 'scanner' }) {
  const { officer, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showBackendModal, setShowBackendModal] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [customUrl, setCustomUrl] = useState(getBackendUrl());
  const [testStatus, setTestStatus] = useState(null);
  const [testMessage, setTestMessage] = useState('');
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const currentOfficerName = officer?.name || 'Officer on Duty';
  const currentBadgeId = officer?.badge_id || 'BC-1001';
  const currentCheckpoint = officer?.checkpoint_id || 'DEL-T3-GATE-4';
  const currentRole = officer?.role || 'OFFICER';
  const initials = currentOfficerName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'OF';

  const tabLabels = {
    scanner: 'Scan & Upload a Passport or ID',
    forensics: 'Forensics Viewer — Check for Photo Edits',
    mrz: 'Security Codes — Passport Bottom Numbers',
    risk: 'Risk Score & Final Verdict',
    audit: 'Inspection Log — Secure Decision History',
    analytics: 'Station Reports & Daily Summary',
    biometrics: 'Face Match — Compare Live Photo',
    watchlist: 'Stolen IDs & Police Alert Lists'
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playPop();
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Pinging backend endpoint...');
    setBackendUrl(customUrl);
    try {
      const data = await checkHealth();
      setTestStatus('success');
      setTestMessage(`Connected — Version: ${data.version || '1.0.0'}`);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setTestStatus('failed');
      setTestMessage(
        err.message?.includes('Network Error')
          ? 'Cannot reach endpoint. If hosted on a free tier, instance may take ~45s to wake.'
          : `Connection error: ${err.message}`
      );
    }
  };

  const handleResetDefault = () => {
    const defaultUrl = 'http://localhost:8000/api/v1';
    setCustomUrl(defaultUrl);
    setBackendUrl(null);
    setTestStatus(null);
    setTestMessage('Reset to default local URL.');
  };

  return (
    <header className="dashboard-header-sticky" role="banner">
      {/* Left: Active Section & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px' }}>
          <span style={{ color: '#64748B', fontWeight: 500 }}>ARGUS Station</span>
          <span style={{ color: '#CBD5E1' }}>/</span>
          <span style={{ color: '#0F172A', fontWeight: 700 }}>
            {tabLabels[activeTab] || 'Document Screening'}
          </span>
        </div>
      </div>

      {/* Right Controls: Backend API, Sound, Guide, Officer Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Backend API Status Pill */}
        <button
          onClick={() => {
            playPop();
            setShowBackendModal(true);
          }}
          title="Click to configure Backend API endpoint"
          style={{
            background: engineMode === 'LIVE_BACKEND' ? '#F0FDF4' : '#FFFBEB',
            border: `1px solid ${engineMode === 'LIVE_BACKEND' ? '#BBF7D0' : '#FDE68A'}`,
            borderRadius: 6,
            padding: '5px 11px',
            fontSize: '11.5px',
            color: engineMode === 'LIVE_BACKEND' ? '#15803D' : '#B45309',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: engineMode === 'LIVE_BACKEND' ? '#16A34A' : '#D97706',
            boxShadow: engineMode === 'LIVE_BACKEND' ? '0 0 6px #16A34A' : 'none'
          }} />
          <span className="hide-on-mobile">
            {engineMode === 'LIVE_BACKEND' ? 'Live API Connected' : 'Demo Simulation'}
          </span>
          <Settings size={12} style={{ opacity: 0.7 }} />
        </button>

        {/* How It Works Guide */}
        <button
          onClick={() => {
            playPop();
            setShowHowItWorks(true);
          }}
          className="btn btn-secondary hide-on-mobile"
          style={{ padding: '6px 11px', fontSize: '11.5px', borderRadius: 6 }}
        >
          <HelpCircle size={13} color="#0D9488" />
          <span>How It Works</span>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          title={soundOn ? 'Mute audio cues' : 'Enable audio cues'}
          className="btn btn-secondary"
          style={{ padding: '6px 10px', fontSize: '11.5px', borderRadius: 6 }}
        >
          {soundOn ? <Volume2 size={13} color="#0D9488" /> : <VolumeX size={13} color="#64748B" />}
          <span className="hide-on-mobile">{soundOn ? 'Sound' : 'Muted'}</span>
        </button>

        <div style={{ height: 20, width: 1, background: '#E2E8F0', margin: '0 2px' }} />

        {/* Officer Profile Menu */}
        <div style={{ position: 'relative' }}>
          <button
            id="officer_profile_button"
            onClick={() => setShowProfileMenu(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: showProfileMenu ? '#F0FDFA' : '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 6,
              padding: '4px 10px 4px 5px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              if (!showProfileMenu) e.currentTarget.style.background = '#F8FAFC';
            }}
            onMouseLeave={e => {
              if (!showProfileMenu) e.currentTarget.style.background = '#FFFFFF';
            }}
          >
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 5,
                background: currentRole === 'ADMIN'
                  ? 'linear-gradient(135deg, #FDE68A, #F59E0B)'
                  : 'linear-gradient(135deg, #0D9488, #0F766E)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                color: currentRole === 'ADMIN' ? '#78350F' : '#FFFFFF'
              }}>
                {initials}
              </div>
              <span style={{
                position: 'absolute',
                bottom: -1,
                right: -1,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isOnline ? '#10B981' : '#94A3B8',
                border: '1.5px solid #FFFFFF'
              }} />
            </div>

            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>{currentOfficerName.split(' ')[0]}</span>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: 3,
                  background: currentRole === 'ADMIN' ? '#FEF3C7' : '#F0FDFA',
                  color: currentRole === 'ADMIN' ? '#B45309' : '#0F766E',
                  border: currentRole === 'ADMIN' ? '1px solid #FCD34D' : '1px solid #99F6E4'
                }}>
                  {currentRole === 'ADMIN' ? 'Supervisor' : 'Inspector'}
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#64748B' }}>
                {isOnline ? 'On Duty' : 'Standby'}
              </div>
            </div>

            <ChevronDown size={12} color="#94A3B8" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              width: 220,
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              boxShadow: 'rgba(50,50,93,0.18) 0px 20px 40px -10px, rgba(0,0,0,0.06) 0px 8px 18px -4px',
              padding: '10px',
              zIndex: 100
            }}>
              <div style={{ paddingBottom: 8, borderBottom: '1px solid #F1F5F9', marginBottom: 8 }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>
                  {currentOfficerName}
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: 2 }}>
                  Badge: <span className="font-mono">{currentBadgeId}</span> • {currentCheckpoint}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <button
                  onClick={() => setIsOnline(prev => !prev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 9px',
                    borderRadius: 5,
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    fontSize: '11.5px',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  <span>{isOnline ? 'Status: On Duty' : 'Status: Standby'}</span>
                  <span style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: isOnline ? '#10B981' : '#94A3B8'
                  }} />
                </button>

                <button
                  id="officer_sign_out_dropdown_btn"
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '7px 9px',
                    borderRadius: 5,
                    background: 'transparent',
                    border: 'none',
                    fontSize: '11.5px',
                    color: '#DC2626',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: 600
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={12} color="#DC2626" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Direct Quick Logout */}
        <button
          id="navbar_logout_button"
          onClick={() => logout()}
          title="Sign out of checkpoint session"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 10px',
            borderRadius: 6,
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
          onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
        >
          <LogOut size={12} />
          <span className="hide-on-mobile">Logout</span>
        </button>
      </div>

      {/* Backend API Configuration Modal */}
      {showBackendModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(15,23,42,0.55)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 10,
            width: '100%',
            maxWidth: 480,
            boxShadow: 'rgba(50,50,93,0.25) 0px 30px 60px -12px, rgba(0,0,0,0.18) 0px 18px 36px -18px',
            border: '1px solid #E2E8F0',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '14px 18px',
              background: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Server size={16} color="#0D9488" />
                <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A' }}>
                  Backend API Connection
                </span>
              </div>
              <button
                onClick={() => setShowBackendModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                background: engineMode === 'LIVE_BACKEND' ? '#F0FDF4' : '#FFFBEB',
                border: `1px solid ${engineMode === 'LIVE_BACKEND' ? '#BBF7D0' : '#FDE68A'}`,
                borderRadius: 6,
                padding: '9px 12px',
                fontSize: '12px',
                color: engineMode === 'LIVE_BACKEND' ? '#15803D' : '#B45309',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                {engineMode === 'LIVE_BACKEND' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                <span>
                  Current: <strong>{engineMode === 'LIVE_BACKEND' ? 'Live Python AI Backend' : 'Demo Offline Engine'}</strong>
                </span>
              </div>

              <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                Set the address of your backend server to enable full AI-powered passport inspection — face matching, photo forgery detection, and security code verification.
              </p>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>
                  Backend API Base URL
                </label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={e => setCustomUrl(e.target.value)}
                  placeholder="http://localhost:8000/api/v1"
                  className="font-mono"
                  style={{ fontSize: '12px' }}
                />
              </div>

              {testStatus && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontSize: '11.5px',
                  background: testStatus === 'success' ? '#F0FDF4' : testStatus === 'testing' ? '#F0F9FF' : '#FEF2F2',
                  color: testStatus === 'success' ? '#16A34A' : testStatus === 'testing' ? '#0369A1' : '#DC2626',
                  border: `1px solid ${testStatus === 'success' ? '#BBF7D0' : testStatus === 'testing' ? '#BAE6FD' : '#FECACA'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  {testStatus === 'testing' && <RefreshCw size={13} className="animate-spin" />}
                  {testStatus === 'success' && <CheckCircle2 size={13} />}
                  {testStatus === 'failed' && <AlertCircle size={13} />}
                  <span>{testMessage}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                <button
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '9px 14px' }}
                >
                  {testStatus === 'testing' ? 'Connecting...' : 'Test & Save URL'}
                </button>
                <button
                  onClick={handleResetDefault}
                  className="btn btn-secondary"
                  style={{ padding: '9px 14px' }}
                >
                  Reset Default
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How It Works Guide Modal */}
      <HowItWorksModal
        isOpen={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
      />
    </header>
  );
}
