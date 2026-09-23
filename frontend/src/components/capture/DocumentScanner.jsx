import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Camera, 
  Loader2, 
  CheckCircle2, 
  RefreshCw, 
  ChevronRight, 
  ShieldCheck, 
  User, 
  ShieldAlert, 
  Edit3,
  FileCheck,
  Zap,
  Globe,
  Lock,
  FileCode2,
  Microscope,
  Users,
  AlertTriangle,
  FlaskConical,
  ChevronDown,
  X
} from 'lucide-react';
import { PRESET_SCENARIOS } from '../../data/presetSamples';
import CuteSelfieStudio from './CuteSelfieStudio';
import ActiveLivenessModal from '../biometrics/ActiveLivenessModal';
import { playPop, playCameraShutter } from '../../utils/soundEffects';

const STEPS = [
  'Straightening document image and checking clarity...',
  'Verifying passport bottom security numbers...',
  'Checking for photo editing, cuts, or Photoshop...',
  'Checking if photo was taken off a computer or phone screen...',
  'Matching traveler face to passport photo...'
];

export default function DocumentScanner({
  documentImage,
  liveFaceImage,
  onDocumentChange,
  onLiveFaceChange,
  onRunInspection,
  loading,
  currentScenario,
  customMetadata = {},
  onCustomMetadataChange,
  isBlacklisted = false,
  onToggleWatchlist
}) {
  const fileInputRef  = useRef(null);
  const videoRef      = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [step, setStep]                 = useState(0);
  const [showMetaBox, setShowMetaBox]     = useState(true);
  const [showLivenessModal, setShowLivenessModal] = useState(false);
  const [showTestingTools, setShowTestingTools]   = useState(false);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => setStep(s => (s + 1) % STEPS.length), 650);
    return () => clearInterval(interval);
  }, [loading]);

  const handleDocFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    playPop();
    const reader = new FileReader();
    reader.onload = ev => onDocumentChange(ev.target.result, null);
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setCameraActive(true);
    playPop();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Direct document camera failed, opening picker:', err);
      fileInputRef.current?.click();
      setCameraActive(false);
    }
  };

  const captureCamera = () => {
    playCameraShutter();
    const canvas = document.createElement('canvas');
    canvas.width  = videoRef.current?.videoWidth  || 640;
    canvas.height = videoRef.current?.videoHeight || 480;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const b64 = canvas.toDataURL('image/jpeg', 0.95);
    onDocumentChange(b64, null);
    videoRef.current?.srcObject?.getTracks().forEach(track => track.stop());
    setCameraActive(false);
  };

  const resetScanner = () => {
    playPop();
    onDocumentChange(null, null);
    if (onLiveFaceChange) onLiveFaceChange(null);
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Top Header & Scenario Selector Bar */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: '#F0FDFA',
                color: '#0D9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                  Passport &amp; Identity Document Screening
                </h1>
                <span className="pill pill-teal">
                  Step 1: Document Upload
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#64748B' }}>
                Upload or photograph traveler credentials, attach live photo, and run security checks
              </p>
            </div>
          </div>

          {(documentImage || liveFaceImage || currentScenario) && (
            <button
              onClick={resetScanner}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '11.5px' }}
            >
              <RefreshCw size={12} />
              <span>Reset Desk</span>
            </button>
          )}
        </div>

      </div>

      {/* Testing Tools Panel — collapsed by default */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowTestingTools(v => !v)}
          className="btn btn-secondary"
          title="Open test scenario loader (for demonstration only)"
          style={{ fontSize: '11px', padding: '5px 10px', color: '#64748B', border: '1px solid #E2E8F0', gap: 5 }}
        >
          <FlaskConical size={13} />
          <span>Testing Tools</span>
          <ChevronDown size={12} style={{ transform: showTestingTools ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {showTestingTools && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 200,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            padding: '14px 16px',
            minWidth: 320,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0F172A' }}>Load a Test Scenario</span>
              <button
                onClick={() => setShowTestingTools(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#64748B' }}
              >
                <X size={14} />
              </button>
            </div>
            <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>
              These are pre-loaded demonstration cases for testing purposes only. Not visible to travelers.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRESET_SCENARIOS.map((scenario) => {
                const active = currentScenario?.id === scenario.id;
                return (
                  <button
                    key={scenario.id}
                    onClick={() => {
                      playPop();
                      onDocumentChange(scenario.documentImage, scenario);
                      if (onLiveFaceChange) onLiveFaceChange(scenario.liveFace);
                      setShowTestingTools(false);
                    }}
                    className={active ? 'btn btn-primary' : 'btn btn-secondary'}
                    style={{ padding: '4px 10px', fontSize: '11px', borderRadius: 6 }}
                  >
                    {scenario.title.split('(')[0].trim()}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Wide 2-Column Workstation Grid */}
      <div className="grid-responsive-2col" style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 16 }}>

        {/* LEFT COLUMN: Document Scanner & Metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Document Inspection Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="od-card-header">
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                Passport / ID Document Viewfinder
              </span>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                Accepted: Passport, National ID, Visa
              </span>
            </div>

            <div className="od-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Document Viewfinder Screen */}
              <div
                style={{
                  position: 'relative',
                  borderRadius: 8,
                  background: '#0F172A',
                  minHeight: 270,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #E2E8F0'
                }}
              >
                {/* Corner Alignment Brackets */}
                <div style={{ position: 'absolute', top: 12, left: 12, width: 22, height: 22, borderTop: '3px solid #14B8A6', borderLeft: '3px solid #14B8A6', borderTopLeftRadius: 4, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderTop: '3px solid #14B8A6', borderRight: '3px solid #14B8A6', borderTopRightRadius: 4, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: 12, left: 12, width: 22, height: 22, borderBottom: '3px solid #14B8A6', borderLeft: '3px solid #14B8A6', borderBottomLeftRadius: 4, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: 12, right: 12, width: 22, height: 22, borderBottom: '3px solid #14B8A6', borderRight: '3px solid #14B8A6', borderBottomRightRadius: 4, pointerEvents: 'none' }} />

                {cameraActive ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                    <video ref={videoRef} autoPlay playsInline muted style={{ maxHeight: 240, maxWidth: '100%', borderRadius: 6 }} />
                    <button
                      onClick={captureCamera}
                      className="btn btn-primary"
                      style={{ marginTop: 10, padding: '7px 20px' }}
                    >
                      Capture Passport Image
                    </button>
                  </div>
                ) : documentImage ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                    <img
                      src={documentImage}
                      alt="Scanned Passport"
                      style={{ maxHeight: 250, maxWidth: '100%', objectFit: 'contain', borderRadius: 6 }}
                    />
                    {loading && <div className="scan-line" />}
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      textAlign: 'center',
                      padding: '24px 20px',
                      cursor: 'pointer',
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    {/* Real Unsplash Photo for Passport Sample */}
                    <div style={{
                      position: 'relative',
                      width: 140,
                      height: 90,
                      borderRadius: 6,
                      overflow: 'hidden',
                      marginBottom: 14,
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      <img
                        src="https://images.unsplash.com/photo-1578874691223-a4962645b926?auto=format&fit=crop&w=400&q=80"
                        alt="Passport inspection sample"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                      />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(15,23,42,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <UploadCloud size={24} color="#2DD4BF" />
                      </div>
                    </div>

                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#FFFFFF', marginBottom: 4 }}>
                      Click or Drag to Upload Passport Photo
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                      JPG, PNG image • Place passport flat under even lighting
                    </div>
                  </div>
                )}

                {/* Scanning Progress Overlay */}
                {loading && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 12,
                      left: 14,
                      right: 14,
                      background: 'rgba(255, 255, 255, 0.96)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: 6,
                      padding: '9px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 12px rgba(15,23,42,0.1)'
                    }}
                  >
                    <Loader2 size={16} color="#0D9488" className="animate-spin" />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                      {STEPS[step]}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px' }}
                >
                  <UploadCloud size={14} color="#0D9488" />
                  <span>Choose File</span>
                </button>

                <button
                  onClick={startCamera}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px' }}
                >
                  <Camera size={14} color="#0D9488" />
                  <span>Use Camera</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleDocFile} style={{ display: 'none' }} />
              </div>
            </div>
          </div>

          {/* Document Holder Information Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="od-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit3 size={15} color="#0D9488" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                  Passport Details &amp; Traveler Information
                </span>
              </div>
              <button
                onClick={() => setShowMetaBox(prev => !prev)}
                className="btn btn-ghost"
                style={{ padding: '3px 8px', fontSize: '11px', color: '#0D9488' }}
              >
                {showMetaBox ? 'Collapse' : 'Edit Details'}
              </button>
            </div>

            {showMetaBox && (
              <div className="od-card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={customMetadata.fullName || ''}
                    onChange={e => onCustomMetadataChange(prev => ({ ...prev, fullName: e.target.value }))}
                    style={{ marginTop: 3 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Passport Number
                  </label>
                  <input
                    type="text"
                    value={customMetadata.documentNumber || ''}
                    onChange={e => onCustomMetadataChange(prev => ({ ...prev, documentNumber: e.target.value }))}
                    className="font-mono"
                    style={{ marginTop: 3 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Issuing Country / Nationality
                  </label>
                  <input
                    type="text"
                    value={customMetadata.country || ''}
                    onChange={e => onCustomMetadataChange(prev => ({ ...prev, country: e.target.value }))}
                    style={{ marginTop: 3 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Expiry Date (YYYY-MM-DD)
                  </label>
                  <input
                    type="text"
                    value={customMetadata.expiryDate || ''}
                    onChange={e => onCustomMetadataChange(prev => ({ ...prev, expiryDate: e.target.value }))}
                    style={{ marginTop: 3 }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Watchlist Cross-Check Alert Strip */}
          <div
            style={{
              background: isBlacklisted ? '#FEF2F2' : '#F0FDF4',
              border: `1px solid ${isBlacklisted ? '#FECACA' : '#BBF7D0'}`,
              borderRadius: 8,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {isBlacklisted ? (
                <ShieldAlert size={18} color="#DC2626" />
              ) : (
                <ShieldCheck size={18} color="#16A34A" />
              )}
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: isBlacklisted ? '#991B1B' : '#166534' }}>
                  {isBlacklisted ? 'Police Alert Notice: Flagged on Watchlist' : 'Police & Stolen ID Check: Clear'}
                </div>
                <div style={{ fontSize: '11px', color: isBlacklisted ? '#B91C1C' : '#475569' }}>
                  {isBlacklisted ? 'Person flagged for border enforcement action' : 'No matches on Interpol or lost passport database'}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                playPop();
                onToggleWatchlist();
              }}
              className="btn btn-secondary"
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                color: isBlacklisted ? '#DC2626' : '#166534',
                borderColor: isBlacklisted ? '#FECACA' : '#BBF7D0'
              }}
            >
              {isBlacklisted ? 'Clear Test Alert' : 'Simulate Alert (Test Only)'}
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            disabled={!documentImage || loading}
            onClick={() => {
              playPop();
              if (onRunInspection) onRunInspection();
            }}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '13px 20px',
              fontSize: '14px',
              borderRadius: 8
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Running all security checks...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={17} />
                <span>Run Comprehensive Inspection</span>
                <ChevronRight size={15} />
              </>
            )}
          </button>
        </div>

        {/* RIGHT COLUMN: Checkpoint Live Selfie Studio & Inspection Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Dedicated Live Selfie & Facial Studio */}
          <CuteSelfieStudio
            liveFaceImage={liveFaceImage}
            onLiveFaceChange={onLiveFaceChange}
            onOpenLivenessModal={() => setShowLivenessModal(true)}
          />

          {/* Checkpoint Multi-Factor Pipeline Overview */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="od-card-header">
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                Automated Verification Steps
              </span>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                Multi-Pillar Check
              </span>
            </div>

            <div className="od-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { title: 'Security Codes (MRZ)', desc: 'Validates numbers at bottom of passport', icon: FileCode2, status: 'Active' },
                { title: 'Photo Tampering Analysis', desc: 'Scans for Photoshop edits, cuts, or screen photos', icon: Microscope, status: 'Active' },
                { title: '1:1 Face Match Check', desc: 'Compares live traveler photo to passport portrait', icon: Users, status: liveFaceImage ? 'Photo Ready' : 'Optional' },
                { title: 'Interpol & Stolen ID Search', desc: 'Checks national and Interpol alert registries', icon: ShieldAlert, status: isBlacklisted ? 'Alert' : 'Active' },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 6,
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 26,
                        height: 26,
                        borderRadius: 5,
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        color: '#0D9488',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={14} />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: item.status === 'Alert' ? '#FEF2F2' : '#F0FDF4',
                        color: item.status === 'Alert' ? '#DC2626' : '#16A34A',
                        border: `1px solid ${item.status === 'Alert' ? '#FECACA' : '#BBF7D0'}`
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Active Liveness Modal */}
      {showLivenessModal && (
        <ActiveLivenessModal
          onClose={() => setShowLivenessModal(false)}
          onCapture={(b64) => {
            if (onLiveFaceChange) onLiveFaceChange(b64);
            setShowLivenessModal(false);
          }}
        />
      )}
    </div>
  );
}
