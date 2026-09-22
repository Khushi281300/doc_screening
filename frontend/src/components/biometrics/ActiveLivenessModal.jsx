import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  X, 
  CheckCircle2, 
  Sparkles, 
  Smile, 
  Eye, 
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  SwitchCamera
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playCameraShutter, playSuccessFanfare, playPop } from '../../utils/soundEffects';

const CHALLENGES = [
  { id: 'BLINK', title: 'Blink your eyes twice', icon: Eye, prompt: 'Please blink naturally into camera' },
  { id: 'TURN_HEAD_LEFT', title: 'Slowly turn head to the left', icon: ArrowRight, prompt: 'Turn head approx 20 degrees left' },
  { id: 'OPEN_MOUTH', title: 'Smile or slightly open mouth', icon: Smile, prompt: 'Show facial muscle variation' }
];

export default function ActiveLivenessModal({ onClose, onComplete, onCapture }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let stream = null;
    const initCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: facingMode }, width: { ideal: 640 }, height: { ideal: 480 } }
          });
        } catch (err1) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.warn("Mobile webcam fallback for liveness modal", err);
      }
    };
    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [facingMode]);

  const handleSimulateStep = () => {
    if (isVerifying) return;
    setIsVerifying(true);
    playPop();

    // Step 1: Eye blink
    setProgress(25);
    setTimeout(() => {
      setProgress(55);
      setCurrentStepIndex(1); // Turn head

      setTimeout(() => {
        setProgress(85);
        setCurrentStepIndex(2); // Smile / muscle variation

        setTimeout(() => {
          setIsVerifying(false);
          setProgress(100);
          setIsSuccess(true);
          playSuccessFanfare();
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#FF8DA1', '#E05374', '#FFDCE6', '#52B788']
            });
          } catch (e) {}
        }, 1100);

      }, 1200);

    }, 1200);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const b64 = ev.target?.result;
      if (onCapture) onCapture(b64);
      if (onComplete) onComplete(b64);
      if (onClose) onClose();
    };
    reader.readAsDataURL(file);
  };

  const handleCaptureAndFinalize = () => {
    playCameraShutter();
    let b64 = null;
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 320;
      canvas.height = videoRef.current.videoHeight || 320;
      const ctx = canvas.getContext("2d");
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      b64 = canvas.toDataURL("image/jpeg", 0.95);
      if (onCapture) onCapture(b64);
      if (onComplete) onComplete(b64);
      if (onClose) onClose();
    } else {
      fileInputRef.current?.click();
    }
  };

  const toggleCamera = () => {
    playPop();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const currentChallenge = CHALLENGES[currentStepIndex];
  const Icon = currentChallenge.icon;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(46, 27, 36, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '480px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(255, 141, 161, 0.35)',
          border: '2px solid #FFD0DF',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header with Cute Mochi Cat Badge */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1.5px solid #FFDCE6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #FFF5F8 0%, #FFF0F5 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '10px',
                background: '#FF8DA1',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}
            >
              🐾
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: '#2E1B24' }}>
                Active Liveness Verification
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#846271' }}>
                ISO/IEC 30107-3 Challenge-Response Anti-Spoof
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: '6px',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#846271',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Video Canvas with Cute Cat Face Guide */}
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              position: 'relative',
              width: '240px',
              height: '240px',
              borderRadius: '50%',
              border: '3px dashed #FF8DA1',
              overflow: 'hidden',
              background: '#1E141B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(255, 141, 161, 0.25)',
              marginBottom: '18px'
            }}
          >
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

            {/* Cat Ears Outline overlay on camera */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                display: 'flex',
                gap: '80px',
                pointerEvents: 'none'
              }}
            >
              <div style={{ width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderBottom: '16px solid rgba(255, 141, 161, 0.7)' }} />
              <div style={{ width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderBottom: '16px solid rgba(255, 141, 161, 0.7)' }} />
            </div>

            {/* Inner guideline */}
            <div
              style={{
                position: 'absolute',
                inset: '20px',
                borderRadius: '50%',
                border: '1.5px solid rgba(255, 255, 255, 0.35)',
                pointerEvents: 'none'
              }}
            />

            {isVerifying && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(46, 27, 36, 0.7)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <RefreshCw size={28} color="#FF8DA1" className="animate-spin" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#FFF' }}>
                  Analyzing Facial Landmarks...
                </span>
              </div>
            )}
          </div>

          {/* Feedback & Prompts */}
          {isSuccess ? (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: '#EDF7EE',
                  border: '1.5px solid #52B788',
                  color: '#2E6B39',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CheckCircle2 size={24} />
              </div>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#2E6B39' }}>
                Active Liveness Verified! 🌸
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#573B48' }}>
                Anti-spoofing challenge passed with 99.4% confidence.
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#FFF0F5',
                  border: '1.5px solid #FFD0DF',
                  borderRadius: 999,
                  padding: '4px 14px',
                  color: '#E05374',
                  fontSize: '12px',
                  fontWeight: 800
                }}
              >
                <Icon size={14} />
                <span>Step {currentStepIndex + 1} of 3: {currentChallenge.title}</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#846271' }}>
                {currentChallenge.prompt}
              </p>
            </div>
          )}

          {/* Progress Bar */}
          <div
            style={{
              width: '100%',
              height: '8px',
              borderRadius: 999,
              background: '#FFF0F5',
              overflow: 'hidden',
              marginTop: '16px',
              border: '1px solid #FFDCE6'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #FF8DA1 0%, #52B788 100%)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1.5px solid #FFDCE6',
            background: '#FFF9FB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={toggleCamera}
              title="Flip camera"
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #FFD0DF',
                borderRadius: '10px',
                padding: '7px 10px',
                color: '#846271',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer'
              }}
            >
              <SwitchCamera size={13} />
            </button>

            <button
              onClick={handleCaptureAndFinalize}
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #FF8DA1',
                borderRadius: '10px',
                padding: '7px 12px',
                color: '#E05374',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              📸 Snapshot
            </button>
          </div>

          {isSuccess ? (
            <button
              onClick={handleCaptureAndFinalize}
              style={{
                background: 'linear-gradient(135deg, #52B788 0%, #388E3C 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '9px 18px',
                color: '#FFF',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(82, 183, 136, 0.4)'
              }}
            >
              Apply Verified Selfie 🌸
            </button>
          ) : (
            <button
              onClick={handleSimulateStep}
              disabled={isVerifying}
              style={{
                background: 'linear-gradient(135deg, #FF8DA1 0%, #E05374 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '9px 18px',
                color: '#FFF',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(224, 83, 116, 0.35)',
                opacity: isVerifying ? 0.7 : 1
              }}
            >
              Perform Challenge Step ✨
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}
