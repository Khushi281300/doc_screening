import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Volume2, VolumeX, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { playMeow, playPop, isSoundEnabled, setSoundEnabled } from '../../utils/soundEffects';

export default function MochiCatMascot({ currentStatus = 'idle', scanResult = null }) {
  const [minimized, setMinimized] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [isSquishing, setIsSquishing] = useState(false);
  const [hearts, setHearts] = useState([]);
  const [customTip, setCustomTip] = useState(null);

  // Dynamic speech bubble reaction based on scanning state
  const getSpeechText = () => {
    if (customTip) return customTip;
    if (currentStatus === 'scanning') {
      return "Sniffing out edits & checking passport codes! 🐾✨";
    }
    if (scanResult) {
      const outcome = scanResult.risk_evaluation?.outcome;
      if (outcome === 'VERIFIED') {
        return "All clear! 🌸 Passport looks authentic — face match & codes all passed!";
      }
      if (outcome === 'REJECTED') {
        return "⚠️ Alert! Signs of tampering or a watchlist match detected! 🐾";
      }
      if (outcome === 'FLAGGED_FOR_REVIEW') {
        return "Please double check this one! Officer manual review required 🔍";
      }
    }
    return "Hello Officer! 🐾 Ready to scan documents — let's check this passport!";
  };

  const handlePet = () => {
    setIsSquishing(true);
    playMeow();
    
    // Generate floating hearts
    const newHeart = {
      id: Date.now() + Math.random(),
      x: 30 + (Math.random() * 40 - 20),
      y: -10
    };
    setHearts(prev => [...prev.slice(-4), newHeart]);

    setTimeout(() => setIsSquishing(false), 450);
  };

  const toggleSound = (e) => {
    e.stopPropagation();
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playPop();
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 850,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        pointerEvents: 'none',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
      }}
    >
      {/* Floating Interactive Speech Bubble */}
      {!minimized && (
        <div
          style={{
            pointerEvents: 'auto',
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(12px)',
            border: '1.5px solid #FFD0DF',
            borderRadius: '16px',
            padding: '10px 14px',
            maxWidth: '240px',
            marginBottom: '10px',
            boxShadow: '0 8px 24px rgba(255, 141, 161, 0.22)',
            fontSize: '12px',
            fontWeight: 600,
            color: '#3D2631',
            lineHeight: 1.4,
            position: 'relative',
            animation: 'bubbleFloat 3s ease-in-out infinite'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#E05374', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Detective Cat Companion 🐾
            </span>
            <span style={{ fontSize: '11px' }}>✨</span>
          </div>
          <div>{getSpeechText()}</div>

          {/* Speech pointer */}
          <div
            style={{
              position: 'absolute',
              bottom: '-7px',
              left: '32px',
              width: '12px',
              height: '12px',
              background: '#FFFFFF',
              borderRight: '1.5px solid #FFD0DF',
              borderBottom: '1.5px solid #FFD0DF',
              transform: 'rotate(45deg)'
            }}
          />
        </div>
      )}

      {/* Mochi Cat Mascot Body */}
      <div
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px'
        }}
      >
        <div
          onClick={handlePet}
          title="Click to pet the Detective Cat! 🐾"
          style={{
            cursor: 'pointer',
            position: 'relative',
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: isSquishing ? 'scale(1.15, 0.85)' : 'scale(1)',
            filter: 'drop-shadow(0 10px 18px rgba(255, 141, 161, 0.35))'
          }}
        >
          {/* Floating heart particles */}
          {hearts.map(h => (
            <div
              key={h.id}
              style={{
                position: 'absolute',
                top: `${h.y}px`,
                left: `${h.x}px`,
                pointerEvents: 'none',
                color: '#FF4D6D',
                fontSize: '16px',
                animation: 'floatUpAndFade 1.2s ease-out forwards'
              }}
            >
              💖
            </div>
          ))}

          {/* Scalable Vector Cute Mochi Cat */}
          <svg
            width={minimized ? "56" : "88"}
            height={minimized ? "52" : "80"}
            viewBox="0 0 100 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: 'visible' }}
          >
            {/* Soft Shadow */}
            <ellipse cx="50" cy="85" rx="38" ry="6" fill="#F3CAD8" opacity="0.6" />

            {/* Left Ear */}
            <path
              d="M20 34 C16 12, 34 8, 38 24 Z"
              fill="#FFFFFF"
              stroke="#FFBFD3"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path d="M24 30 C22 18, 32 16, 35 24 Z" fill="#FFAEC6" opacity="0.75" />

            {/* Right Ear */}
            <path
              d="M80 34 C84 12, 66 8, 62 24 Z"
              fill="#FFFFFF"
              stroke="#FFBFD3"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path d="M76 30 C78 18, 68 16, 65 24 Z" fill="#FFAEC6" opacity="0.75" />

            {/* Cute Tail */}
            <path
              d="M82 68 C96 68, 98 52, 92 48 C88 45, 86 52, 80 58"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M82 68 C96 68, 98 52, 92 48 C88 45, 86 52, 80 58"
              fill="none"
              stroke="#FFBFD3"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Mochi Cat Squishy Body */}
            <path
              d="M16 55 C14 36, 30 26, 50 26 C70 26, 86 36, 84 55 C82 76, 74 84, 50 84 C26 84, 18 76, 16 55 Z"
              fill="url(#mochiGradient)"
              stroke="#FFBFD3"
              strokeWidth="2.5"
            />

            {/* Rosy Blushing Cheeks */}
            <ellipse cx="28" cy="56" rx="6.5" ry="4" fill="#FF8DA1" opacity="0.55" />
            <ellipse cx="72" cy="56" rx="6.5" ry="4" fill="#FF8DA1" opacity="0.55" />

            {/* Big Cute Sparkling Eyes */}
            <g className="mochi-blink">
              {/* Left Eye */}
              <ellipse cx="36" cy="46" rx="5.5" ry="7" fill="#3D2631" />
              <circle cx="34" cy="43" r="2.4" fill="#FFFFFF" />
              <circle cx="38" cy="48" r="1.1" fill="#FFFFFF" />

              {/* Right Eye */}
              <ellipse cx="64" cy="46" rx="5.5" ry="7" fill="#3D2631" />
              <circle cx="62" cy="43" r="2.4" fill="#FFFFFF" />
              <circle cx="66" cy="48" r="1.1" fill="#FFFFFF" />
            </g>

            {/* Cute Little Nose and :3 Mouth */}
            <path d="M50 51 L48.5 49 L51.5 49 Z" fill="#FF8DA1" />
            <path
              d="M45 53 Q48 56 50 53 Q52 56 55 53"
              fill="none"
              stroke="#4A2E3D"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Whiskers */}
            <path d="M16 48 Q22 50 27 50" stroke="#FFBFD3" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M16 55 Q22 55 27 54" stroke="#FFBFD3" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M84 48 Q78 50 73 50" stroke="#FFBFD3" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M84 55 Q78 55 73 54" stroke="#FFBFD3" strokeWidth="1.8" strokeLinecap="round" />

            {/* Little Paws */}
            <ellipse cx="38" cy="80" rx="6" ry="4.5" fill="#FFFFFF" stroke="#FFBFD3" strokeWidth="2" />
            <ellipse cx="62" cy="80" rx="6" ry="4.5" fill="#FFFFFF" stroke="#FFBFD3" strokeWidth="2" />

            {/* Tiny Inspector Badge / Bow */}
            <circle cx="50" cy="74" r="5" fill="#FF8DA1" />
            <circle cx="50" cy="74" r="2.5" fill="#FFF0F5" />

            <defs>
              <linearGradient id="mochiGradient" x1="50" y1="26" x2="50" y2="84" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" />
                <stop offset="0.7" stopColor="#FFF9FB" />
                <stop offset="1" stopColor="#FFEBF2" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Small Control Capsule */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #FFD0DF',
            borderRadius: '12px',
            padding: '3px 6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 4px 12px rgba(255, 141, 161, 0.18)'
          }}
        >
          <button
            onClick={toggleSound}
            title={soundOn ? "Mute detective cat audio" : "Unmute detective cat audio"}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: soundOn ? '#E05374' : '#A08290',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '6px'
            }}
          >
            {soundOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>
          <button
            onClick={() => setMinimized(m => !m)}
            title={minimized ? "Expand speech bubble" : "Minimize speech bubble"}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#A08290',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '6px'
            }}
          >
            {minimized ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
}
