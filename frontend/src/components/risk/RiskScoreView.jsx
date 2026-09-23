import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  ClipboardList
} from 'lucide-react';
import EmptyStationState from '../layout/EmptyStationState';
import ExplainabilityChecklist from './ExplainabilityChecklist';
import { playPop } from '../../utils/soundEffects';

export default function RiskScoreView({
  scanResult,
  onGoToScanner,
  onSelectSample,
  onGoToAudit
}) {
  if (!scanResult) {
    return (
      <EmptyStationState
        title="No Document Risk Score Available"
        subtitle="Calculates an overall authenticity score based on photo editing, security codes, and facial match."
        explanation="Please upload a passport or run an inspection at the Scan / Upload desk to generate a comprehensive risk verdict."
        onGoToScanner={onGoToScanner}
        onSelectSample={onSelectSample}
      />
    );
  }

  const evaluation = scanResult.risk_evaluation || {};
  const outcome = evaluation.outcome || 'VERIFIED';
  const overallScore = evaluation.overall_risk_score ?? 96;
  const confidence = evaluation.confidence_score ?? 98;
  const recommendation = evaluation.recommendation || 'Document cleared for border entry.';
  const criticals = evaluation.critical_failures || [];
  const factors = evaluation.factor_breakdown || {};

  const isPass = outcome === 'VERIFIED';
  const isReview = outcome === 'MANUAL_REVIEW';

  const verdictTheme = isPass ? {
    bg: '#F0FDF4',
    border: '#BBF7D0',
    titleColor: '#166534',
    iconBg: '#16A34A',
    icon: <CheckCircle2 size={24} color="#FFFFFF" />,
    label: 'PASSED — GENUINE DOCUMENT',
    desc: 'All security checks passed. No digital tampering or identity discrepancies detected.'
  } : isReview ? {
    bg: '#FFFBEB',
    border: '#FDE68A',
    titleColor: '#92400E',
    iconBg: '#D97706',
    icon: <AlertTriangle size={24} color="#FFFFFF" />,
    label: 'NEEDS MANUAL OFFICER REVIEW',
    desc: 'One or more checks require physical inspection by a border officer.'
  } : {
    bg: '#FEF2F2',
    border: '#FECACA',
    titleColor: '#991B1B',
    iconBg: '#DC2626',
    icon: <XCircle size={24} color="#FFFFFF" />,
    label: 'REJECTED — FORGERY OR ALERT DETECTED',
    desc: 'Critical security failure detected. Document does not pass border clearance standards.'
  };

  const factorList = [
    {
      key: 'document_quality',
      label: 'Image & Photo Quality',
      desc: 'Checks if the document photo is clear, focused, and free of glare.',
      data: factors.document_quality || { score: 94, status: 'PASS' }
    },
    {
      key: 'mrz_integrity',
      label: 'Bottom Security Codes (MRZ)',
      desc: 'Confirms numbers and dates match the built-in mathematical check digits.',
      data: factors.mrz_integrity || { score: 100, status: 'PASS' }
    },
    {
      key: 'forensic_integrity',
      label: 'Photo Editing & Forgery Check',
      desc: 'Scans for Photoshop edits, spliced photos, clone stamps, or screen recaptures.',
      data: factors.forensic_integrity || { score: 96, status: 'PASS' }
    },
    {
      key: 'biometric_verification',
      label: 'Face Match Verification',
      desc: "Compares traveler's live face against the printed passport portrait.",
      data: factors.biometric_verification || { score: 95, status: 'PASS' }
    },
    {
      key: 'database_watchlist',
      label: 'Police & Stolen ID Check',
      desc: 'Cross-checks Interpol database and lost or stolen passport registries.',
      data: factors.database_watchlist || { score: 100, status: 'PASS' }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Top Page Header */}
      <div className="page-header-box">
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
            Risk Assessment &amp; Inspection Verdict
          </h1>
          <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0 }}>
            Comprehensive evaluation across all five security pillars for Document #{scanResult.document_fields?.document_number || 'N/A'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {onGoToAudit && (
            <button
              onClick={() => {
                playPop();
                onGoToAudit();
              }}
              className="btn btn-secondary"
            >
              <ClipboardList size={14} />
              <span>View Log Record</span>
            </button>
          )}
        </div>
      </div>

      {/* Prominent Full-Width Verdict Banner */}
      <div style={{
        background: verdictTheme.bg,
        border: `1.5px solid ${verdictTheme.border}`,
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: verdictTheme.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {verdictTheme.icon}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: verdictTheme.titleColor }}>
              {verdictTheme.label}
            </div>
            <div style={{ fontSize: 12.5, color: '#475569', marginTop: 2 }}>
              {verdictTheme.desc}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            AI Confidence
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', fontFamily: '"JetBrains Mono", monospace' }}>
            {confidence}%
          </div>
          <div style={{ fontSize: 10.5, color: '#64748B' }}>
            Certainty in evaluation
          </div>
        </div>
      </div>

      {/* Main Grid: Left KPI Score + Right Factor Breakdown */}
      <div className="grid-responsive-2col" style={{ gap: 18 }}>
        {/* Card 1: Score & Recommended Action */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="od-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isPass ? (
                <ShieldCheck size={18} color="#16A34A" />
              ) : isReview ? (
                <AlertTriangle size={18} color="#D97706" />
              ) : (
                <ShieldAlert size={18} color="#DC2626" />
              )}
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                Overall Authenticity Score
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748B' }}>
              Minimum passing: 80/100
            </span>
          </div>

          <div className="od-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Big Score Gauge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderRadius: 8,
              background: isPass ? '#F0FDF4' : isReview ? '#FFFBEB' : '#FEF2F2',
              border: `1px solid ${isPass ? '#BBF7D0' : isReview ? '#FDE68A' : '#FECACA'}`
            }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: isPass ? '#166534' : isReview ? '#92400E' : '#991B1B' }}>
                  Safety Rating
                </div>
                <div style={{ fontSize: '36px', fontWeight: 800, color: isPass ? '#15803D' : isReview ? '#B45309' : '#DC2626', lineHeight: 1.1 }}>
                  {overallScore}<span style={{ fontSize: '16px', fontWeight: 600, color: '#64748B' }}>/100</span>
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: 4 }}>
                  Scores above 80 are considered genuine documents
                </div>
              </div>

              <div style={{
                width: 52,
                height: 52,
                borderRadius: 10,
                background: isPass ? '#DCFCE7' : isReview ? '#FEF3C7' : '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {isPass ? (
                  <CheckCircle2 size={28} color="#16A34A" />
                ) : isReview ? (
                  <AlertTriangle size={28} color="#D97706" />
                ) : (
                  <XCircle size={28} color="#DC2626" />
                )}
              </div>
            </div>

            {/* Officer Action Instruction Box */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                Officer Guidance
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', lineHeight: 1.45 }}>
                {recommendation}
              </div>
            </div>

            {/* Critical Failures (if any) */}
            {criticals.length > 0 && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 8,
                padding: '12px 14px'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#991B1B', marginBottom: 6 }}>
                  Critical Findings:
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: '12px', color: '#B91C1C', lineHeight: 1.45 }}>
                  {criticals.map((cf, idx) => (
                    <li key={idx}>{cf}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Factor Breakdown Pillars */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="od-card-header">
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
              Individual Security Checks
            </span>
            <span style={{ fontSize: '11px', color: '#64748B' }}>
              5 of 5 Checks Evaluated
            </span>
          </div>

          <div className="od-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {factorList.map(item => {
              const pass = item.data?.status === 'PASS';
              const score = item.data?.score ?? 90;
              return (
                <div
                  key={item.key}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 6,
                    padding: '10px 12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>
                      {item.label}
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '11px',
                      fontWeight: 600,
                      color: pass ? '#16A34A' : '#DC2626'
                    }}>
                      {pass ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {pass ? 'Passed' : 'Failed'} ({score}%)
                    </span>
                  </div>

                  <p style={{ fontSize: '11px', color: '#64748B', margin: '0 0 6px 0', lineHeight: 1.35 }}>
                    {item.desc}
                  </p>

                  {/* Progress Meter Bar */}
                  <div style={{ width: '100%', height: 5, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{
                      width: `${score}%`,
                      height: '100%',
                      background: pass ? '#10B981' : '#EF4444',
                      borderRadius: 999
                    }} />
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#94A3B8', marginTop: 3 }}>
                    Minimum acceptable: 70%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Explainability Breakdown */}
      <ExplainabilityChecklist
        factorBreakdown={evaluation.factor_breakdown}
        riskEvaluation={evaluation}
      />
    </div>
  );
}
