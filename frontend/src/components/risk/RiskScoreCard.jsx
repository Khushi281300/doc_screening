import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, FileText, ClipboardList } from 'lucide-react';
import { playPop } from '../../utils/soundEffects';

// Helper to convert technical jargon into crystal clear plain English
const simplifyFinding = (text = '') => {
  const lower = text.toLowerCase();
  if (lower.includes('ela') || lower.includes('compression') || lower.includes('tamper') || lower.includes('splice')) {
    return 'Digital editing detected: The photo or text has been modified with photo editing software.';
  }
  if (lower.includes('copy') || lower.includes('clone') || lower.includes('vector')) {
    return 'Duplicated elements detected: Stamps or text elements appear to have been copied and pasted.';
  }
  if (lower.includes('noise') || lower.includes('srm') || lower.includes('ghost')) {
    return 'Paper texture anomaly: Background paper grain does not match across the document.';
  }
  if (lower.includes('checksum') || lower.includes('check digit') || lower.includes('icao') || lower.includes('mrz')) {
    return 'Security code mismatch: The numbers at the bottom do not add up correctly, meaning document numbers were changed.';
  }
  if (lower.includes('moire') || lower.includes('recapture') || lower.includes('raster') || lower.includes('screen')) {
    return 'Screen photo detected: This is a photo of a computer or phone screen, not a real paper passport.';
  }
  if (lower.includes('face') || lower.includes('biometric') || lower.includes('similarity') || lower.includes('impersonat')) {
    return 'Face mismatch: The person standing at the checkpoint does not match the photo on the passport.';
  }
  if (lower.includes('watchlist') || lower.includes('interpol') || lower.includes('stolen') || lower.includes('red notice')) {
    return 'Security alert: This document is flagged on international alert lists or reported stolen.';
  }
  return text;
};

export default function RiskScoreCard({ riskEvaluation, onViewAudit }) {
  if (!riskEvaluation) {
    return null;
  }

  const data = riskEvaluation;
  const isPass   = data.outcome === 'VERIFIED';
  const isReview = data.outcome === 'MANUAL_REVIEW';
  const factors  = data.factor_breakdown || {};

  const theme = isPass ? {
    bg: '#F0FDF4',
    border: '#BBF7D0',
    iconBg: '#16A34A',
    icon: <CheckCircle2 size={26} color="#FFFFFF" />,
    badgeBg: '#DCFCE7',
    badgeText: '#15803D',
    title: 'Passport Genuine & Valid',
    titleColor: '#166534',
    simpleSummary: 'All security checks passed. The photo, security codes, and identity details are authentic.',
    action: 'Safe to proceed: Authorize passenger entry.',
    actionBg: '#ECFDF5',
    actionBorder: '#A7F3D0',
    actionColor: '#065F46'
  } : isReview ? {
    bg: '#FFFBEB',
    border: '#FDE68A',
    iconBg: '#D97706',
    icon: <AlertTriangle size={26} color="#FFFFFF" />,
    badgeBg: '#FEF3C7',
    badgeText: '#92400E',
    title: 'Needs Officer Check',
    titleColor: '#92400E',
    simpleSummary: 'The document image is uncertain or incomplete. Please inspect the physical document.',
    action: 'Recommended Action: Inspect physical security features (watermark, UV glow, and holograms).',
    actionBg: '#FFFBEB',
    actionBorder: '#FDE68A',
    actionColor: '#92400E'
  } : {
    bg: '#FEF2F2',
    border: '#FECACA',
    iconBg: '#DC2626',
    icon: <XCircle size={26} color="#FFFFFF" />,
    badgeBg: '#FEE2E2',
    badgeText: '#991B1B',
    title: 'Passport Rejected — Forgery or Alert Found',
    titleColor: '#991B1B',
    simpleSummary: 'One or more major security checks failed. This document should not be accepted.',
    action: 'Action Required: Deny entry and notify supervisor immediately.',
    actionBg: '#FEF2F2',
    actionBorder: '#FECACA',
    actionColor: '#991B1B'
  };

  const CHECKS = [
    {
      key: 'forensic_integrity',
      title: 'Photo & Tamper Check',
      desc: 'Checks if photos, text, or dates were photoshopped or edited',
    },
    {
      key: 'mrz_integrity',
      title: 'Passport Security Codes',
      desc: 'Verifies the bottom numbers match the document information',
    },
    {
      key: 'document_quality',
      title: 'Image & Quality Check',
      desc: 'Ensures photo is sharp, readable, and not a screen photo',
    },
    {
      key: 'biometric_verification',
      title: 'Face Match Verification',
      desc: "Compares traveler's live camera face to the passport portrait",
    },
    {
      key: 'database_watchlist',
      title: 'Stolen ID & Alert Search',
      desc: 'Cross-checks against lost, stolen, and travel-ban lists',
    },
  ];

  return (
    <div
      id="inspection_findings_card"
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif"
      }}
    >
      {/* 1. Full-Width Verdict Banner */}
      <div style={{
        background: theme.bg,
        border: `1.5px solid ${theme.border}`,
        borderRadius: 14,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 260 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: theme.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            {theme.icon}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: theme.titleColor }}>
                {theme.title}
              </h2>
              <span style={{
                background: theme.badgeBg,
                color: theme.badgeText,
                padding: '3px 10px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 800,
                border: `1px solid ${theme.border}`
              }}>
                Safety Score: {data.overall_risk_score} / 100
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#374151', lineHeight: 1.4 }}>
              {theme.simpleSummary}
            </p>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
              Scores above 80 indicate an authentic, verified document.
            </div>
          </div>
        </div>

        {onViewAudit && (
          <button
            onClick={() => {
              playPop();
              onViewAudit();
            }}
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: '7px 12px' }}
          >
            <FileText size={14} />
            <span>Audit History</span>
          </button>
        )}
      </div>

      {/* 2. Critical Issue Alert (If failed) */}
      {data.critical_failures?.length > 0 && (
        <div style={{
          background: '#FEF2F2',
          border: '1.5px solid #FECACA',
          borderRadius: 12,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 7 }}>
            <AlertTriangle size={15} color="#DC2626" />
            <span>Why This Passport Was Flagged:</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.critical_failures.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                fontSize: 13,
                color: '#7F1D1D',
                background: '#FFFFFF',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #FEE2E2',
                fontWeight: 600
              }}>
                <XCircle size={15} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{simplifyFinding(item)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. The 5 Security Checks (Clean Plain-English Grid, quiet icons for pass) */}
      <div>
        <div style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
            Inspection Findings — What Was Checked:
          </h3>
          <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#64748B' }}>
            The AI automatically checked these 5 safety points on the passport.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          {CHECKS.map(c => {
            const factor = factors[c.key] || { score: 95, status: 'PASS' };
            const isPending = factor.status === 'PENDING' || factor.status === 'NOT_CAPTURED';
            const passed = factor.status === 'PASS' || (!isPending && factor.score >= 70);

            return (
              <div
                key={c.key}
                style={{
                  background: isPending ? '#FFFBEB' : passed ? '#F8FAFC' : '#FEF2F2',
                  border: `1px solid ${isPending ? '#FDE68A' : passed ? '#E2E8F0' : '#FECACA'}`,
                  borderRadius: 10,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 10
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1F2937' }}>
                    {c.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, lineHeight: 1.35 }}>
                    {c.desc}
                  </div>
                </div>

                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600 }}>
                  {isPending ? (
                    <span style={{ color: '#D97706', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <AlertTriangle size={13} /> Pending
                    </span>
                  ) : passed ? (
                    <span style={{ color: '#16A34A', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <CheckCircle2 size={13} /> Passed
                    </span>
                  ) : (
                    <span className="pill pill-red" style={{ fontSize: 10.5, padding: '2px 7px' }}>
                      <XCircle size={12} /> Failed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Action Recommendation Box */}
      <div style={{
        background: theme.actionBg,
        border: `1px solid ${theme.actionBorder}`,
        borderRadius: 10,
        padding: '11px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12.5,
        fontWeight: 600,
        color: theme.actionColor
      }}>
        <ClipboardList size={16} style={{ flexShrink: 0 }} />
        <span>{theme.action}</span>
      </div>
    </div>
  );
}
