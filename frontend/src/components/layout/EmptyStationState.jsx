import React from 'react';
import { ScanLine, Play, ArrowRight, ShieldCheck } from 'lucide-react';
import { playPop } from '../../utils/soundEffects';

export default function EmptyStationState({
  title,
  subtitle,
  explanation,
  onGoToScanner,
  onSelectSample
}) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        minHeight: 380
      }}>
        {/* Left: Text & Action Controls */}
        <div style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <span className="pill pill-teal">Passport Station Ready</span>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', marginBottom: 8, letterSpacing: '-0.02em' }}>
            {title}
          </h2>

          <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.6, marginBottom: 16 }}>
            {explanation || 'To inspect security features and view the AI report, please scan a passport first or select one of the test scenarios below.'}
          </p>

          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 24,
            fontSize: '12px',
            color: '#475569',
            lineHeight: 1.5
          }}>
            <strong>What this check does:</strong> {subtitle}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {onGoToScanner && (
              <button
                onClick={() => {
                  playPop();
                  onGoToScanner();
                }}
                className="btn btn-primary"
                style={{ padding: '10px 18px' }}
              >
                <ScanLine size={15} />
                <span>Go to Scan / Upload Desk</span>
                <ArrowRight size={14} />
              </button>
            )}

            {onSelectSample && (
              <button
                onClick={() => {
                  playPop();
                  onSelectSample('tampered_expiry_ela');
                }}
                className="btn btn-secondary"
                style={{ padding: '10px 16px' }}
              >
                <Play size={14} color="#0D9488" />
                <span>Load Sample Inspection</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Real Unsplash Photograph of Border Control / Passport Inspection */}
        <div style={{
          position: 'relative',
          minHeight: 260,
          background: '#0F172A',
          overflow: 'hidden'
        }}>
          <img
            src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80"
            alt="Border control officer inspecting passport documents"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.92)'
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(255,255,255,0.05) 0%, rgba(15,23,42,0.4) 100%)'
          }} />
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            borderRadius: 6,
            padding: '10px 14px',
            color: '#FFFFFF',
            fontSize: '11.5px',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <ShieldCheck size={16} color="#2DD4BF" style={{ flexShrink: 0 }} />
            <span>Inspection checkpoint ready for live document processing.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
