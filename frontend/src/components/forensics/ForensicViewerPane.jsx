import React, { useState } from 'react';
import { Info, AlertCircle, Microscope, CheckCircle2, ShieldAlert, GitMerge, Stamp, Sparkles } from 'lucide-react';
import EmptyStationState from '../layout/EmptyStationState';

const LAYERS = [
  {
    id: 'ela',
    name: 'Photo Editing Check',
    technicalTag: 'ELA Filter',
    imgKey: 'ela_heatmap_base64',
    flagKey: ['ela', 'is_spliced'],
    what: 'Highlights areas that were digitally altered, brushed, or modified with Photoshop.'
  },
  {
    id: 'recapture',
    name: 'Screen Photo Check',
    technicalTag: 'Moiré Pattern',
    imgKey: 'fft_moire_base64',
    flagKey: ['recapture', 'is_screen_recaptured'],
    what: 'Detects if this is a photo of a phone or computer monitor rather than real physical passport paper.'
  },
  {
    id: 'srm',
    name: 'Paper Texture Consistency',
    technicalTag: 'Noise Model',
    imgKey: 'srm_noise_base64',
    flagKey: ['srm', 'has_noise_inconsistency'],
    what: 'Checks the micro-grain of the paper to reveal patched or glued-over passport regions.'
  },
  {
    id: 'copy_move',
    name: 'Copied Stamp / Clone Check',
    technicalTag: 'Keypoint Match',
    imgKey: 'copy_move_base64',
    flagKey: ['copy_move', 'copy_move_detected'],
    what: 'Detects duplicated sections, copied security stamps, or repeated signatures.'
  },
  {
    id: 'jpeg_ghost',
    name: 'Pasted Elements Check',
    technicalTag: 'Compression Ghost',
    imgKey: 'jpeg_ghost_base64',
    flagKey: ['jpeg_ghost', 'ghosts_detected'],
    what: 'Reveals images or dates cut out from a different photo with different quality.'
  },
  {
    id: 'gradcam',
    name: 'Suspicious Area Map',
    technicalTag: 'AI Heatmap',
    imgKey: 'gradcam_saliency_base64',
    flagKey: ['deep_tamper', 'is_deep_forged'],
    what: 'Shows the exact coordinate areas the AI flagged as suspicious or artificial.'
  }
];

export default function ForensicViewerPane({
  inspectionResult,
  originalImage,
  onGoToScanner,
  onSelectSample
}) {
  const [selectedLayer, setSelectedLayer] = useState('ela');

  if (!originalImage && !inspectionResult) {
    return (
      <EmptyStationState
        title="No Document Loaded for Forensics"
        subtitle="Applies 6 optical and digital filters to catch Photoshop edits, screen photos, and spliced portraits."
        explanation="Scan a document or load a sample scenario to view side-by-side forensic analysis."
        onGoToScanner={onGoToScanner}
        onSelectSample={onSelectSample}
      />
    );
  }

  const layers  = inspectionResult?.layers || {};
  const metrics = inspectionResult?.forensics_metrics || {};

  const isFlagged = layer => Boolean(metrics[layer.flagKey[0]]?.[layer.flagKey[1]]);
  const activeLayer = LAYERS.find(l => l.id === selectedLayer) || LAYERS[0];
  const activeImage = layers[activeLayer.imgKey] || originalImage;
  const flagged = isFlagged(activeLayer);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Card Header */}
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
            <Microscope size={16} />
          </div>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Forensic Forgery &amp; Tamper Analysis
            </h2>
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              Side-by-side comparative inspection under spectral and digital filters
            </div>
          </div>
        </div>

        <span className={flagged ? 'pill pill-red' : 'pill pill-green'}>
          {flagged ? 'Suspicious Tampering Detected' : 'All Forensic Filters Clean'}
        </span>
      </div>

      <div className="od-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Layer Selector Toolbar */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Choose Forensic Filter:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
            {LAYERS.map(layer => {
              const hasAlert = isFlagged(layer);
              const active = selectedLayer === layer.id;
              return (
                <button
                  key={layer.id}
                  onClick={() => setSelectedLayer(layer.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: active ? '#F0FDFA' : '#FFFFFF',
                    color: active ? '#0F766E' : '#334155',
                    border: `1px solid ${active ? '#14B8A6' : '#E2E8F0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: active ? 700 : 600 }}>
                      {layer.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94A3B8' }}>
                      {layer.technicalTag}
                    </div>
                  </div>
                  <span style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: hasAlert ? '#DC2626' : '#16A34A',
                    boxShadow: hasAlert ? '0 0 6px #DC2626' : 'none',
                    flexShrink: 0
                  }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Side-by-side comparison grid */}
        <div className="grid-responsive-2col" style={{ gap: 14 }}>
          {/* Original View */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            padding: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                Original Document Photo
              </span>
              <span className="pill pill-teal" style={{ fontSize: '10.5px' }}>
                Reference View
              </span>
            </div>
            <div style={{
              background: '#0F172A',
              borderRadius: 6,
              minHeight: 230,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 8
            }}>
              {originalImage ? (
                <img
                  src={originalImage}
                  alt="Original Document"
                  style={{ maxHeight: 215, maxWidth: '100%', objectFit: 'contain', borderRadius: 4 }}
                />
              ) : (
                <span style={{ fontSize: '12px', color: '#64748B' }}>No photo loaded</span>
              )}
            </div>
          </div>

          {/* Active Filter View */}
          <div style={{
            background: flagged ? '#FEF2F2' : '#F8FAFC',
            border: `1px solid ${flagged ? '#FECACA' : '#E2E8F0'}`,
            borderRadius: 8,
            padding: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: flagged ? '#991B1B' : '#334155' }}>
                {activeLayer.name} Filter
              </span>
              <span className={flagged ? 'pill pill-red' : 'pill pill-green'} style={{ fontSize: '10.5px' }}>
                {flagged ? 'Anomaly Detected' : 'Normal / Passed'}
              </span>
            </div>
            {activeImage === originalImage && !flagged && (
              <div style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 6,
                padding: '7px 10px',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '11px',
                color: '#166534',
                fontWeight: 600
              }}>
                <CheckCircle2 size={14} color="#16A34A" style={{ flexShrink: 0 }} />
                <span>No visual differences detected — image appears unaltered under this filter</span>
              </div>
            )}
            <div style={{
              background: '#0F172A',
              borderRadius: 6,
              minHeight: 230,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 8
            }}>
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={activeLayer.name}
                  style={{ maxHeight: 215, maxWidth: '100%', objectFit: 'contain', borderRadius: 4 }}
                />
              ) : (
                <span style={{ fontSize: '12px', color: '#64748B' }}>Filter view unavailable</span>
              )}
            </div>
          </div>
        </div>

        {/* Plain Language Explanation Callout */}
        <div style={{
          background: '#F0FDFA',
          border: '1px solid #CCFBF1',
          borderRadius: 6,
          padding: '12px 14px',
          display: 'flex',
          gap: 10,
          alignItems: 'center'
        }}>
          <Info size={16} color="#0D9488" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '12px', color: '#134E4A', lineHeight: 1.5 }}>
            <strong>What this check examines:</strong> {activeLayer.what}
          </div>
        </div>

        {/* Editing Software Warning (e.g. Adobe Photoshop Tag) */}
        {metrics.exif?.software_tag && metrics.exif.software_tag !== 'None' && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 6,
            padding: '10px 14px',
            fontSize: '12px',
            color: '#B91C1C',
            display: 'flex',
            gap: 8,
            alignItems: 'center'
          }}>
            <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
            <span>Digital editing software metadata detected: <strong>{metrics.exif.software_tag}</strong></span>
          </div>
        )}

        {/* ML Forensic Signal Fusion & Advanced Forensics (Morph, Deepfake, Stamp) */}
        {(() => {
          const mlFusion = metrics.ml_fusion || inspectionResult?.ml_tamper_fusion;
          const stamp = metrics.stamp;
          const morph = metrics.morph;
          const deepfake = metrics.deepfake;

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {/* ML Forensic Signal Fusion Summary Banner */}
              {mlFusion && (
                <div style={{
                  background: mlFusion.verdict === 'TAMPERED' ? '#FEF2F2' : mlFusion.verdict === 'SUSPICIOUS' ? '#FFFBEB' : '#F0FDF4',
                  border: `1px solid ${mlFusion.verdict === 'TAMPERED' ? '#FECACA' : mlFusion.verdict === 'SUSPICIOUS' ? '#FDE68A' : '#BBF7D0'}`,
                  borderRadius: 8,
                  padding: '12px 14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <GitMerge size={16} color={mlFusion.verdict === 'TAMPERED' ? '#DC2626' : mlFusion.verdict === 'SUSPICIOUS' ? '#D97706' : '#16A34A'} />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>
                        ML Forensic Signal Fusion (11 Multi-Spectral Signals)
                      </span>
                      <span style={{ fontSize: '10px', color: '#64748B', background: '#F1F5F9', padding: '1px 6px', borderRadius: 4 }}>
                        {mlFusion.model_name?.includes('RandomForest') ? 'RandomForest Ensemble' : 'Logistic Fusion Engine'}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 20,
                      background: mlFusion.verdict === 'TAMPERED' ? '#FEE2E2' : mlFusion.verdict === 'SUSPICIOUS' ? '#FEF3C7' : '#DCFCE7',
                      color: mlFusion.verdict === 'TAMPERED' ? '#991B1B' : mlFusion.verdict === 'SUSPICIOUS' ? '#92400E' : '#166534'
                    }}>
                      {mlFusion.verdict}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'center', marginBottom: mlFusion.primary_contributors?.length ? 8 : 0 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', marginBottom: 4 }}>
                        <span>Forensic Integrity Score:</span>
                        <strong style={{ color: '#0F172A' }}>{(mlFusion.forensic_integrity_score || 0).toFixed(0)} / 100</strong>
                      </div>
                      <div style={{ width: '100%', height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(100, Math.max(0, mlFusion.forensic_integrity_score || 0))}%`,
                          height: '100%',
                          background: (mlFusion.forensic_integrity_score || 0) < 50 ? '#DC2626' : (mlFusion.forensic_integrity_score || 0) < 75 ? '#F59E0B' : '#16A34A',
                          borderRadius: 3
                        }} />
                      </div>
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#475569' }}>
                      Calibrated Tamper Probability: <strong style={{ color: mlFusion.tamper_probability > 0.4 ? '#DC2626' : '#16A34A' }}>
                        {((mlFusion.tamper_probability || 0) * 100).toFixed(1)}%
                      </strong>
                    </div>
                  </div>

                  {mlFusion.primary_contributors && mlFusion.primary_contributors.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center', marginTop: 4 }}>
                      <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>Key Contributing Signals:</span>
                      {mlFusion.primary_contributors.map((c, i) => (
                        <span key={i} style={{
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: c.severity === 'CRITICAL' ? '#FEE2E2' : c.severity === 'HIGH' ? '#FEF3C7' : '#EFF6FF',
                          color: c.severity === 'CRITICAL' ? '#991B1B' : c.severity === 'HIGH' ? '#92400E' : '#1E40AF',
                          fontWeight: 500
                        }}>
                          {c.signal.replace(/_/g, ' ')} ({c.severity})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Grid of Sub-Forensics: Morph, Deepfake, Stamp */}
              {(morph || deepfake || stamp) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                  {/* Face Morphing Attack Card */}
                  {morph && (
                    <div style={{
                      background: morph.is_morphed ? '#FEF2F2' : morph.verdict === 'SUSPICIOUS_MORPH' ? '#FFFBEB' : '#F0FDF4',
                      border: `1px solid ${morph.is_morphed ? '#FECACA' : morph.verdict === 'SUSPICIOUS_MORPH' ? '#FDE68A' : '#BBF7D0'}`,
                      borderRadius: 8,
                      padding: '12px 14px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Sparkles size={13} color="#7C3AED" /> Face Morph Attack
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 20,
                          background: morph.is_morphed ? '#FEE2E2' : morph.verdict === 'SUSPICIOUS_MORPH' ? '#FEF3C7' : '#DCFCE7',
                          color: morph.is_morphed ? '#991B1B' : morph.verdict === 'SUSPICIOUS_MORPH' ? '#92400E' : '#166534'
                        }}>
                          {morph.verdict}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginBottom: 4 }}>
                        Morph probability: <strong style={{ color: '#334155' }}>{((morph.morph_probability || 0) * 100).toFixed(1)}%</strong>
                        &nbsp;&bull;&nbsp;FFT: <strong>{morph.fft_symmetry_score?.toFixed(3) ?? 'N/A'}</strong>
                      </div>
                      {morph.contributing_factors?.length > 0 && (
                        <div style={{ fontSize: '10.5px', color: '#7C3AED', fontStyle: 'italic', lineHeight: 1.4 }}>
                          • {morph.contributing_factors[0]}
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Deepfake / Synthetic Face Card */}
                  {deepfake && (
                    <div style={{
                      background: deepfake.is_synthetic ? '#FEF2F2' : '#F0FDF4',
                      border: `1px solid ${deepfake.is_synthetic ? '#FECACA' : '#BBF7D0'}`,
                      borderRadius: 8,
                      padding: '12px 14px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <ShieldAlert size={13} color="#DC2626" /> AI / Deepfake Face
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 20,
                          background: deepfake.is_synthetic ? '#FEE2E2' : '#DCFCE7',
                          color: deepfake.is_synthetic ? '#991B1B' : '#166534'
                        }}>
                          {deepfake.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginBottom: 4 }}>
                        Synthetic prob: <strong style={{ color: '#334155' }}>{((deepfake.synthetic_probability || 0) * 100).toFixed(1)}%</strong>
                        &nbsp;&bull;&nbsp;Chroma: <strong>{deepfake.chroma_coherence?.toFixed(3) ?? 'N/A'}</strong>
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748B', fontStyle: 'italic', lineHeight: 1.4 }}>
                        {deepfake.explanation?.slice(0, 85)}{(deepfake.explanation?.length > 85) ? '...' : ''}
                      </div>
                    </div>
                  )}

                  {/* Official Stamp & Security Seal Card */}
                  {stamp && (
                    <div style={{
                      background: stamp.status === 'SUSPICIOUS' ? '#FEF2F2' : stamp.status === 'NO_STAMP' ? '#F8FAFC' : '#F0FDF4',
                      border: `1px solid ${stamp.status === 'SUSPICIOUS' ? '#FECACA' : stamp.status === 'NO_STAMP' ? '#E2E8F0' : '#BBF7D0'}`,
                      borderRadius: 8,
                      padding: '12px 14px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Stamp size={13} color="#0891B2" /> Stamp & Seal Verifier
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 20,
                          background: stamp.status === 'SUSPICIOUS' ? '#FEE2E2' : stamp.status === 'NO_STAMP' ? '#F1F5F9' : '#DCFCE7',
                          color: stamp.status === 'SUSPICIOUS' ? '#991B1B' : stamp.status === 'NO_STAMP' ? '#475569' : '#166534'
                        }}>
                          {stamp.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginBottom: 4 }}>
                        Stamps: <strong style={{ color: '#334155' }}>{stamp.stamp_count || 0}</strong>
                        &nbsp;&bull;&nbsp;Seal Match: <strong>{((stamp.similarity_to_reference || 0) * 100).toFixed(0)}%</strong>
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748B', fontStyle: 'italic', lineHeight: 1.4 }}>
                        {stamp.explanation?.slice(0, 85)}{(stamp.explanation?.length > 85) ? '...' : ''}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
