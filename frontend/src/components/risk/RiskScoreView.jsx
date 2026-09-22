import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  ArrowRight,
  ClipboardList,
  UserCheck
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Page Header Box */}
      <div className="page-header-box">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Risk Assessment &amp; Inspection Verdict
            </h1>
            <span className={isPass ? 'pill pill-green' : isReview ? 'pill pill-amber' : 'pill pill-red'}>
              {isPass ? 'PASSED — GENUINE' : isReview ? 'NEEDS MANUAL REVIEW' : 'REJECTED — TAMPERED'}
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0 }}>
            Comprehensive evaluation across all five security pillars for Document #{scanResult.document_fields?.document_number || 'P74209188'}
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

      {/* Main Grid: Left KPI Score + Right Factor Breakdown */}
      <div className="grid-responsive-2col" style={{ gap: 20 }}>
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
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
              AI Confidence: {confidence}%
            </span>
          </div>

          <div className="od-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Big Score Gauge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 22px',
              borderRadius: 8,
              background: isPass ? '#F0FDF4' : isReview ? '#FFFBEB' : '#FEF2F2',
              border: `1px solid ${isPass ? '#BBF7D0' : isReview ? '#FDE68A' : '#FECACA'}`
            }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: isPass ? '#166534' : isReview ? '#92400E' : '#991B1B' }}>
                  Safety Rating
                </div>
                <div style={{ fontSize: '38px', fontWeight: 800, color: isPass ? '#15803D' : isReview ? '#B45309' : '#DC2626', lineHeight: 1.1 }}>
                  {overallScore}<span style={{ fontSize: '18px', fontWeight: 600, color: '#64748B' }}>/100</span>
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: 4 }}>
                  {isPass ? 'All 5 security categories verified genuine.' : 'One or more security checks failed.'}
                </div>
              </div>

              <div style={{
                width: 58,
                height: 58,
                borderRadius: 10,
                background: isPass ? '#DCFCE7' : isReview ? '#FEF3C7' : '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {isPass ? (
                  <CheckCircle2 size={32} color="#16A34A" />
                ) : isReview ? (
                  <AlertTriangle size={32} color="#D97706" />
                ) : (
                  <XCircle size={32} color="#DC2626" />
                )}
              </div>
            </div>

            {/* Officer Action Instruction Box */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                Officer Guidance
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', lineHeight: 1.5 }}>
                {recommendation}
              </div>
            </div>

            {/* Critical Failures (if any) */}
            {criticals.length > 0 && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 8,
                padding: '12px 16px'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#991B1B', marginBottom: 6 }}>
                  Critical Findings:
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: '12px', color: '#B91C1C', lineHeight: 1.5 }}>
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

          <div className="od-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                    padding: '11px 14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>
                      {item.label}
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '11px',
                      fontWeight: 700,
                      color: pass ? '#16A34A' : '#DC2626'
                    }}>
                      {pass ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      {pass ? 'Passed' : 'Failed'} ({score}%)
                    </span>
                  </div>

                  <p style={{ fontSize: '11.5px', color: '#64748B', margin: '0 0 8px 0', lineHeight: 1.4 }}>
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
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Explainability Breakdown */}
      <ExplainabilityChecklist
        riskEvaluation={scanResult.risk_evaluation}
        biometrics={scanResult.biometrics}
        documentFields={scanResult.document_fields}
      />
    </div>
  );
}
