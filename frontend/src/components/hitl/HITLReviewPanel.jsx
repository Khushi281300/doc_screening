import React, { useState } from 'react';
import { submitHITLOverride } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { UserCheck, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, FileText } from 'lucide-react';
import { playPop } from '../../utils/soundEffects';

export default function HITLReviewPanel({ scanResult, onOverrideSuccess }) {
  const { officer } = useAuth();
  const [justification, setJustification] = useState('');
  const [checklist, setChecklist] = useState({
    uv_fluorescence: false,
    tactile_microtext: false,
    watermark: false,
    ovd_foil: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [overrideResult, setOverrideResult] = useState(null);

  if (!scanResult) return null;

  const scanId = scanResult.scan_id || 'SCAN-ACTIVE';
  const currentOutcome = scanResult.risk_evaluation?.outcome || 'MANUAL_REVIEW';

  const officerName = officer?.name || 'Officer on Duty';
  const officerBadge = officer?.badge_id || 'BC-1001';

  const handleCheckboxChange = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOverride = async (decision) => {
    if (!justification.trim()) {
      alert('Please write a brief note explaining your inspection decision before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitHITLOverride({
        scan_id: scanId,
        officer_id: officerName,
        badge_id: officerBadge,
        override_decision: decision,
        justification: justification,
        physical_checklist: checklist
      });
      setOverrideResult(res);
      playPop();
      if (onOverrideSuccess) onOverrideSuccess(res);
    } catch (err) {
      alert('Could not submit decision — backend may be offline: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const outcomeColor = currentOutcome === 'VERIFIED'
    ? { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' }
    : currentOutcome === 'REJECTED'
      ? { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' }
      : { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' };

  const PHYSICAL_CHECKS = [
    {
      key: 'uv_fluorescence',
      label: 'UV Light & Glow Fibres',
      desc: 'Shine a UV light on the document — genuine security paper has security threads and logos that fluoresce.'
    },
    {
      key: 'tactile_microtext',
      label: 'Raised Ink Feel (Intaglio)',
      desc: 'Run a finger over the document text — official passport lettering feels raised and bumpy, not smooth like a desktop print.'
    },
    {
      key: 'watermark',
      label: 'Watermark in Backlight',
      desc: 'Hold the page up to a ceiling light — an embedded watermark should be visible inside the paper mesh.'
    },
    {
      key: 'ovd_foil',
      label: 'Shifting Hologram Foil',
      desc: 'Tilt the document back and forth — the metallic hologram should change colors and show official seals.'
    }
  ];

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="od-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: '#F0FDFA',
            color: '#0D9488',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UserCheck size={16} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
              Manual Officer Review &amp; Override
            </h3>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>
              Physically inspect passport security features and record your official judgment
            </p>
          </div>
        </div>

        <span style={{
          padding: '4px 10px',
          borderRadius: 4,
          fontSize: '11px',
          fontWeight: 700,
          background: outcomeColor.bg,
          color: outcomeColor.color,
          border: `1px solid ${outcomeColor.border}`
        }}>
          Current Automated Finding: {currentOutcome === 'VERIFIED' ? 'Passed' : currentOutcome === 'REJECTED' ? 'Rejected' : 'Needs Review'}
        </span>
      </div>

      <div className="od-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Physical Security Checklist */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Physical Document Checks (Performed in Person):
          </label>
          <div className="grid-responsive-2col" style={{ gap: 10 }}>
            {PHYSICAL_CHECKS.map(c => (
              <label
                key={c.key}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  cursor: 'pointer',
                  padding: '11px 13px',
                  borderRadius: 6,
                  background: checklist[c.key] ? '#F0FDF4' : '#F8FAFC',
                  border: `1px solid ${checklist[c.key] ? '#BBF7D0' : '#E2E8F0'}`,
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="checkbox"
                  checked={checklist[c.key]}
                  onChange={() => handleCheckboxChange(c.key)}
                  style={{ marginTop: 2, flexShrink: 0, accentColor: '#0D9488', width: 16, height: 16 }}
                />
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>
                    {c.label}
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748B', lineHeight: 1.4 }}>
                    {c.desc}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Decision Notes */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Officer Justification &amp; Notes (Required for Override):
          </label>
          <textarea
            rows={2}
            value={justification}
            onChange={e => setJustification(e.target.value)}
            placeholder="e.g., Physical watermark verified under backlight. Raised ink confirmed intact. Allowing traveler entry."
            style={{ fontSize: '12.5px', borderRadius: 6 }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => handleOverride('VERIFIED')}
            disabled={submitting}
            className="btn btn-primary"
            style={{
              flex: 1,
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
              borderColor: '#15803D'
            }}
          >
            <CheckCircle2 size={15} />
            <span>Authorize &amp; Clear Entry</span>
          </button>

          <button
            onClick={() => handleOverride('REJECTED')}
            disabled={submitting}
            className="btn"
            style={{
              flex: 1,
              padding: '10px 16px',
              background: '#DC2626',
              color: '#FFFFFF',
              borderColor: '#B91C1C'
            }}
          >
            <XCircle size={15} />
            <span>Deny &amp; Flag for Secondary Inspection</span>
          </button>
        </div>

        {overrideResult && (
          <div style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 6,
            padding: '10px 14px',
            fontSize: '12px',
            color: '#15803D',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <CheckCircle2 size={16} />
            <span>Decision recorded successfully: <strong>{overrideResult.final_outcome || 'Decision Updated'}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
