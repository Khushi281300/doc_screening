import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Upload, CheckCircle2, User, SwitchCamera, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { playCameraShutter, playPop } from '../../utils/soundEffects';
import { createLiveSelfie } from '../../data/presetSamples';

export default function CuteSelfieStudio({
  liveFaceImage,
  onLiveFaceChange,
  onOpenLivenessModal,
  compact = false
}) {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [countdown, setCountdown] = useState(null);
  const [flash, setFlash] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [streamObj, setStreamObj] = useState(null);

  const stopCamera = () => {
    if (streamObj) {
      streamObj.getTracks().forEach(t => t.stop());
      setStreamObj(null);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCountdown(null);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async (facing = facingMode) => {
    setCameraError(null);
    setCameraActive(true);
    playPop();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      if (streamObj) {
        streamObj.getTracks().forEach(t => t.stop());
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch (errFallback) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      setStreamObj(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Camera initiation failed:', err);
      setCameraError('Could not open camera. Please check permissions or upload an image file.');
      setCameraActive(false);
      fileInputRef.current?.click();
    }
  };

  const toggleCameraFacing = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  const handleCountdownAndSnap = () => {
    setCountdown(3);
    playPop();

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        playPop();
      } else {
        clearInterval(interval);
        setCountdown(null);
        snapPhoto();
      }
    }, 800);
  };

  const snapPhoto = () => {
    playCameraShutter();
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const b64 = canvas.toDataURL('image/jpeg', 0.95);

    onLiveFaceChange(b64);
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playPop();
    const reader = new FileReader();
    reader.onload = (event) => {
      onLiveFaceChange(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = (type) => {
    playPop();
    const b64 = createLiveSelfie(type);
    onLiveFaceChange(b64);
  };

  return (
    <div
      className="card"
      style={{
        padding: '16px 18px',
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}
    >
      {/* Studio Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
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
            <User size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                Traveler Live Photo Capture
              </span>
              <span className="pill pill-teal">
                Face Match
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>
              Capture or upload traveler photo to compare with passport photo
            </p>
          </div>
        </div>

        {liveFaceImage && !cameraActive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {onOpenLivenessModal && (
              <button
                onClick={onOpenLivenessModal}
                className="btn btn-secondary"
                style={{ padding: '4px 9px', fontSize: '11px' }}
              >
                <ShieldCheck size={13} color="#0D9488" />
                <span>Liveness Test</span>
              </button>
            )}
            <button
              onClick={() => onLiveFaceChange(null)}
              className="btn btn-ghost"
              style={{ padding: '4px 8px', fontSize: '11px', color: '#DC2626' }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Main Studio Viewport */}
      {cameraActive ? (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '260px',
            background: '#0F172A',
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #14B8A6'
          }}
        >
          {flash && (
            <div style={{ position: 'absolute', inset: 0, background: '#FFFFFF', zIndex: 30 }} />
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
            }}
          />

          {/* Oval Biometric Facial Guide */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                width: '140px',
                height: '180px',
                borderRadius: '50%',
                border: '2px dashed #14B8A6',
                boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.5)',
                position: 'relative'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '10%',
                  right: '10%',
                  height: '1px',
                  background: 'rgba(20, 184, 166, 0.6)'
                }}
              />
            </div>

            <div
              style={{
                marginTop: '8px',
                background: 'rgba(15, 23, 42, 0.85)',
                padding: '3px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#FFF'
              }}
            >
              Align traveler's face within the frame
            </div>
          </div>

          {countdown !== null && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 25
              }}
            >
              <span
                style={{
                  fontSize: '64px',
                  fontWeight: 800,
                  color: '#FFFFFF'
                }}
              >
                {countdown}
              </span>
            </div>
          )}

          {/* Camera Viewport Floating Controls */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '14px',
              right: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 20
            }}
          >
            <button
              onClick={toggleCameraFacing}
              className="btn btn-secondary"
              style={{ padding: '5px 10px', fontSize: '11px', background: 'rgba(255,255,255,0.95)' }}
            >
              <SwitchCamera size={13} />
              <span>Flip</span>
            </button>

            <button
              onClick={handleCountdownAndSnap}
              disabled={countdown !== null}
              className="btn btn-primary"
              style={{ padding: '7px 20px', fontSize: '12px' }}
            >
              <Camera size={14} />
              <span>{countdown !== null ? 'Capturing...' : 'Capture Photo'}</span>
            </button>

            <button
              onClick={stopCamera}
              className="btn btn-secondary"
              style={{ padding: '6px 8px', background: 'rgba(255,255,255,0.95)' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : liveFaceImage ? (
        /* Captured Photo Preview */
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '12px 14px'
          }}
        >
          <div
            style={{
              position: 'relative',
              width: 76,
              height: 96,
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid #14B8A6',
              flexShrink: 0
            }}
          >
            <img
              src={liveFaceImage}
              alt="Live traveler"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(15, 23, 42, 0.85)',
                padding: '2px 0',
                textAlign: 'center',
                color: '#FFF',
                fontSize: '8.5px',
                fontWeight: 700
              }}
            >
              CHECKPOINT
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="pill pill-green" style={{ alignSelf: 'flex-start' }}>
              <CheckCircle2 size={12} /> Ready for 1:1 Matching
            </span>
            <p style={{ margin: 0, fontSize: '11.5px', color: '#475569', lineHeight: 1.4 }}>
              Photo captured. The system will compare this face against the photo extracted from the passport.
            </p>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                onClick={() => startCamera()}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '11px' }}
              >
                <RefreshCw size={11} /> Retake
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-ghost"
                style={{ padding: '4px 10px', fontSize: '11px' }}
              >
                Upload File
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cameraError && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '11.5px',
                color: '#B91C1C',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>{cameraError}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              onClick={() => startCamera()}
              className="btn btn-secondary"
              style={{
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                borderRadius: 8
              }}
            >
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
                <Camera size={16} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                Open Camera
              </span>
              <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                Capture traveler selfie
              </span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary"
              style={{
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                borderRadius: 8
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: '#F1F5F9',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Upload size={16} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                Upload Photo
              </span>
              <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                JPG or PNG image
              </span>
            </button>
          </div>

          {/* Quick Demo Preset Face Selector */}
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 6
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
              Quick Samples:
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => handlePresetSelect('authentic')}
                className="btn btn-secondary"
                style={{ padding: '3px 8px', fontSize: '10.5px' }}
              >
                Matching Traveler
              </button>
              <button
                onClick={() => handlePresetSelect('impersonator')}
                className="btn btn-secondary"
                style={{ padding: '3px 8px', fontSize: '10.5px', color: '#B91C1C' }}
              >
                Impersonator / Mismatch
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
}
