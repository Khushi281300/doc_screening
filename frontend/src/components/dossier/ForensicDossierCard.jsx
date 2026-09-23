import React, { useState } from 'react';
import { FileText, Check, Copy } from 'lucide-react';

export default function ForensicDossierCard({ dossierText, outcome }) {
  const [copied, setCopied] = useState(false);

  if (!dossierText) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(dossierText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBorderColor = () => {
    if (outcome === 'VERIFIED') return '#10B981';
    if (outcome === 'REJECTED') return '#EF4444';
    return '#F59E0B';
  };

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '16px',
      border: `2px solid ${getBorderColor()}`,
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            background: '#F0FDFA',
            border: '1px solid #CCFBF1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileText size={20} color="#0D9488" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0F172A' }}>
              Forensic Intelligence Briefing
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
              Courtroom-ready natural language analysis • DPDP &amp; ICAO compliant
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? '#ECFDF5' : '#F1F5F9',
              color: copied ? '#059669' : '#334155',
              border: copied ? '1px solid #10B981' : '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Briefing</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dossier Text Box */}
      <div style={{
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '18px 20px',
        color: '#334155',
        fontSize: '13.5px',
        lineHeight: 1.65,
        whiteSpace: 'pre-wrap',
        fontFamily: "'JetBrains Mono', monospace"
      }}>
        {dossierText}
      </div>
    </div>
  );
}
