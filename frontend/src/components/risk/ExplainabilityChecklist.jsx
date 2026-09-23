import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const CHECKS = [
  { key: 'document_quality',       name: 'Photo Quality',        weight: '10%', what: 'Checks if the document photo is clear, sharp, and easy to read.' },
  { key: 'mrz_integrity',          name: 'Security Codes',       weight: '20%', what: 'Confirms that the bottom line numbers mathematically match the passport data.' },
  { key: 'forensic_integrity',     name: 'Tampering Check',      weight: '25%', what: 'Scans for cut-and-paste edits, altered text, or cloned elements.' },
  { key: 'biometric_verification', name: 'Face Match',           weight: '25%', what: "Compares the passport portrait with the traveler's live camera shot." },
  { key: 'database_watchlist',     name: 'Alert List Check',     weight: '20%', what: 'Checks against lost, stolen, and travel-ban databases.' },
];

export default function ExplainabilityChecklist({ factorBreakdown, riskEvaluation }) {
  const factors = factorBreakdown || riskEvaluation?.factor_breakdown || null;

  if (!factors) {
    return null;
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="od-card-header">
        <div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
            Decision Factors &amp; Weighting
          </span>
          <div style={{ fontSize: '11px', color: '#64748B' }}>
            How ARGUS computed the authenticity verdict across each security category
          </div>
        </div>
      </div>

      <div className="od-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {CHECKS.map(item => {
          const factor = factors[item.key] || { score: 90, status: 'PASS' };
          const isPending = factor.status === 'PENDING' || factor.status === 'NOT_CAPTURED';
          const ok = factor.status === 'PASS' || (!isPending && factor.score >= 70);
          const scoreText = isPending ? '--' : `${factor.score}%`;

          return (
            <div
              key={item.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 16px',
                borderRadius: 8,
                background: isPending ? '#FFFBEB' : ok ? '#F8FAFC' : '#FEF2F2',
                border: `1px solid ${isPending ? '#FDE68A' : ok ? '#E2E8F0' : '#FECACA'}`,
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ flexShrink: 0 }}>
                {isPending ? (
                  <AlertCircle size={18} color="#D97706" />
                ) : ok ? (
                  <CheckCircle2 size={18} color="#16A34A" />
                ) : (
                  <XCircle size={18} color="#DC2626" />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                    {item.name}
                  </span>
                  <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>
                    ({item.weight} contribution)
                  </span>
                </div>
                <p style={{ fontSize: 11.5, color: '#475569', margin: '2px 0 0 0', lineHeight: 1.35 }}>
                  {item.what}
                </p>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontSize: 15,
                  fontWeight: 800,
                  fontFamily: '"JetBrains Mono", monospace',
                  color: isPending ? '#D97706' : ok ? '#16A34A' : '#DC2626',
                }}>
                  {scoreText}
                </div>
                <div style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: isPending ? '#D97706' : ok ? '#16A34A' : '#DC2626',
                  textTransform: 'uppercase',
                }}>
                  {isPending ? 'Pending' : ok ? 'Passed' : 'Failed'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
