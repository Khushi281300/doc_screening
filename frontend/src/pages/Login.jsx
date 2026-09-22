import React, { useState } from 'react';
import { UserCheck, AlertTriangle, Eye, EyeOff, Lock, ArrowRight, Shield, ShieldCheck, Scan } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { playPop, playSuccessFanfare } from '@/utils/soundEffects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const ROLES = [
  {
    id: 'officer',
    badgeId: 'BC-1001',
    password: 'demo1234',
    title: 'Passport Inspector',
    roleTag: 'Officer',
    desc: 'Document inspection & verification access',
    icon: <UserCheck size={20} color="#0D9488" />,
  },
  {
    id: 'admin',
    badgeId: 'ADM-001',
    password: 'demo1234',
    title: 'Supervisor / Manager',
    roleTag: 'Manager',
    desc: 'Full access including reports & watchlist',
    icon: <Shield size={20} color="#D97706" />,
  },
];

export default function Login({ onLoginSuccess }) {
  const { login, error: authError } = useAuth();
  const [selectedRole, setSelectedRole] = useState('officer');
  const [username, setUsername]         = useState('BC-1001');
  const [password, setPassword]         = useState('demo1234');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError]     = useState('');

  const handleSelectRole = (role) => {
    playPop();
    setSelectedRole(role.id);
    setUsername(role.badgeId);
    setPassword(role.password);
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!username.trim() || !password) {
      setLocalError('Please enter both your account ID and password.');
      return;
    }
    setLocalError('');
    setIsSubmitting(true);
    playPop();
    try {
      await login(username, password);
      playSuccessFanfare();
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setLocalError(err.message || 'Incorrect credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInstantSignIn = async (role) => {
    playPop();
    setSelectedRole(role.id);
    setUsername(role.badgeId);
    setPassword(role.password);
    setLocalError('');
    setIsSubmitting(true);
    try {
      await login(role.badgeId, role.password);
      playSuccessFanfare();
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setLocalError(err.message || 'Could not sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = localError || authError;

  return (
    <div style={{
      minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '24px 16px',
      background: 'linear-gradient(135deg, #F0FDFA 0%, #F1F5F9 50%, #F0FDFA 100%)',
      backgroundImage: `
        radial-gradient(ellipse 70% 50% at 10% 10%, rgba(13,148,136,0.08) 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 90% 90%, rgba(20,184,166,0.06) 0%, transparent 55%)
      `
    }}>
      {/* Card */}
      <div className="login-split-card" style={{
        width: '100%', maxWidth: 920, background: '#FFFFFF',
        borderRadius: 22, border: '1px solid #E2E8F0',
        boxShadow: '0 20px 48px rgba(15,23,42,0.10), 0 4px 12px rgba(15,23,42,0.06)',
        display: 'grid', gridTemplateColumns: '1fr 1.2fr', overflow: 'hidden',
      }}>

        {/* LEFT PANEL WITH REAL UNSPLASH BORDER CONTROL PHOTOGRAPHY */}
        <div className="hide-on-mobile" style={{
          position: 'relative',
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 24,
          overflow: 'hidden'
        }}>
          {/* Real Unsplash Photo Background */}
          <img
            src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80"
            alt="Border security inspection station"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 1
            }}
          />
          {/* Professional Teal-Slate Brand Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(160deg, rgba(15, 118, 110, 0.92) 0%, rgba(19, 78, 74, 0.96) 100%)',
              zIndex: 2
            }}
          />

          {/* Brand */}
          <div style={{ position: 'relative', zIndex: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.25)'
              }}>
                <Shield size={22} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em' }}>
                  ARGUS
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Passport &amp; Identity Screening
                </div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginTop: 4 }}>
              Automated document verification, photo forgery forensics, and live biometric matching for border checkpoints.
            </p>
          </div>

          {/* Key Features */}
          <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: <Scan size={15} />, text: 'Photo editing & Photoshop tampering detection' },
              { icon: <ShieldCheck size={15} />, text: 'Passport bottom security code verification' },
              { icon: <UserCheck size={15} />, text: 'Live face comparison & identity verification' },
              { icon: <AlertTriangle size={15} />, text: 'Interpol alert list & stolen passport search' },
            ].map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5,
                color: '#FFFFFF', fontWeight: 600,
                background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)', padding: '9px 14px',
                borderRadius: 8, border: '1px solid rgba(255,255,255,0.18)'
              }}>
                <span style={{ color: '#2DD4BF', flexShrink: 0 }}>{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div style={{ position: 'relative', zIndex: 3, fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={12} color="#2DD4BF" />
            <span>Official law enforcement &amp; immigration screening station</span>
          </div>
        </div>

        {/* RIGHT SIGN IN PANEL */}
        <div className="login-right-panel" style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#FFFFFF' }}>

          {/* Mobile Header */}
          <div className="show-on-mobile" style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, margin: '0 auto 12px',
              background: 'linear-gradient(135deg, #0D9488, #0F766E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(13,148,136,0.3)'
            }}>
              <Shield size={22} color="#FFFFFF" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A' }}>ARGUS</div>
            <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Border Security Screening</p>
          </div>

          {/* Desktop Header */}
          <div className="hide-on-mobile" style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', margin: 0 }}>
              Officer Sign In
            </h1>
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.55, marginTop: 6 }}>
              Select a role for quick access, or sign in with your credentials.
            </p>
          </div>

          {/* Error */}
          {activeError && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 10, padding: '10px 14px', marginBottom: 18,
              display: 'flex', alignItems: 'center', gap: 9,
              fontSize: 12.5, fontWeight: 600, color: '#B91C1C'
            }}>
              <AlertTriangle size={15} color="#DC2626" style={{ flexShrink: 0 }} />
              <span>{activeError}</span>
            </div>
          )}

          {/* Role Cards */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Select Role
              </span>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#0D9488' }}>Demo Access</span>
            </div>

            <div className="role-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {ROLES.map(role => {
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleSelectRole(role)}
                    style={{
                      borderRadius: 14, padding: '14px 14px', display: 'flex',
                      flexDirection: 'column', alignItems: 'flex-start', gap: 6,
                      textAlign: 'left', cursor: 'pointer',
                      border: isSelected ? '1.5px solid #0D9488' : '1px solid #E2E8F0',
                      background: isSelected ? '#F0FDFA' : '#FAFAFA',
                      boxShadow: isSelected ? '0 0 0 3px rgba(13,148,136,0.1)' : 'none',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 8,
                        background: role.id === 'admin' ? '#FFFBEB' : '#F0FDFA',
                        border: `1px solid ${role.id === 'admin' ? '#FDE68A' : '#CCFBF1'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {role.icon}
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                        background: role.id === 'admin' ? '#FEF3C7' : '#F0FDFA',
                        color: role.id === 'admin' ? '#B45309' : '#0F766E',
                        border: `1px solid ${role.id === 'admin' ? '#FCD34D' : '#CCFBF1'}`
                      }}>
                        {role.roleTag}
                      </span>
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                      {role.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>
                      {role.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Separator */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
              <Separator />
            </div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <span style={{ background: '#FFFFFF', padding: '0 12px', fontSize: 11, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                or sign in manually
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <Label htmlFor="badge_id_input" style={{ fontSize: 11.5, fontWeight: 700, color: '#334155' }}>
                Account ID / Badge Number
              </Label>
              <div style={{ position: 'relative', marginTop: 6 }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }}>
                  <UserCheck size={15} />
                </div>
                <Input
                  id="badge_id_input"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. BC-1001"
                  required
                  className="pl-10 h-11"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password_input" style={{ fontSize: 11.5, fontWeight: 700, color: '#334155' }}>
                Password
              </Label>
              <div style={{ position: 'relative', marginTop: 6 }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }}>
                  <Lock size={15} />
                </div>
                <Input
                  id="password_input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  style={{ paddingLeft: '38px', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 2
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login_submit_btn"
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%', padding: '13px 20px', borderRadius: 12,
                background: isSubmitting ? '#94A3B8' : 'linear-gradient(135deg, #0D9488, #0F766E)',
                color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 14,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: isSubmitting ? 'none' : '0 6px 20px rgba(13,148,136,0.3)',
                transition: 'all 0.2s ease', marginTop: 4
              }}
            >
              {isSubmitting ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In &amp; Enter Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick access */}
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => handleInstantSignIn(ROLES.find(r => r.id === selectedRole) || ROLES[0])}
              style={{
                fontSize: 12, fontWeight: 700, color: '#0D9488', background: 'none',
                border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px'
              }}
            >
              Quick access — skip password entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
