import React, { useState } from 'react';
import { Info, AlertCircle, Microscope, CheckCircle2, ShieldAlert } from 'lucide-react';
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
      </div>
    </div>
  );
}
