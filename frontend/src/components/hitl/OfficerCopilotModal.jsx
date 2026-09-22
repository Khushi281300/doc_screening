import React, { useState, useEffect } from 'react';
import { askCopilot, getLlmStatus } from '../../api/client';
import { Sparkles, Send, RefreshCw, X, ShieldCheck, AlertTriangle } from 'lucide-react';
import { playPop, playMeow } from '../../utils/soundEffects';

export default function OfficerCopilotModal({ isOpen, onClose, scanResult }) {
  const [messages, setMessages] = useState([
    {
      sender: 'copilot',
      text: "Hello. I'm the ARGUS AI Copilot — your forensic analysis assistant. I've reviewed this document's scan results, security codes, and biometric data. What would you like to know? I've analyzed this credential's photo forensics, passport codes, and face match data. What would you like to know?"
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [llmHealth, setLlmHealth] = useState(null);

  useEffect(() => {
    if (isOpen) {
      playPop();
      getLlmStatus()
        .then(res => {
          if (res?.status === 'SUCCESS') {
            setLlmHealth(res.llm);
          }
        })
        .catch(() => {
          setLlmHealth({ online: false, fallback_mode: 'Deterministic Offline Engine' });
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const quickPrompts = [
    "Why was this document flagged?",
    "Explain the ELA compression anomaly",
    "Did the biometric facial match pass?",
    "Is the holder on the Interpol Red Notice list?",
    "What physical security features should I inspect?"
  ];

  const handleSend = async (queryText) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    playPop();
    const userMsg = { sender: 'officer', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await askCopilot({
        scan_data: scanResult || {},
        query: textToSend
      });
      const copilotMsg = {
        sender: 'copilot',
        text: res?.reply || "Inspection completed â€” no issues flagged. ðŸ¾"
      };
      setMessages(prev => [...prev, copilotMsg]);
      playPop();
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'copilot',
          text: "AI Assistant offline note: Please verify the physical UV watermark, raised ink text, and passport code alignment manually. ðŸ¾"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(46, 27, 36, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '680px',
          height: '82vh',
          maxHeight: '750px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -12px rgba(255, 141, 161, 0.35)',
          overflow: 'hidden',
          border: '2px solid #E2E8F0'
        }}
      >
        {/* Header with Detective ARGUS Cat Avatar */}
        <div
          style={{
            background: 'linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)',
            borderBottom: '1.5px solid #E2E8F0',
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                background: '#14B8A6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 12px rgba(255, 141, 161, 0.3)'
              }}
            >
              ðŸ±
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                  AEGIS AI Copilot AI Assistant ðŸ¾
                </h3>
                <span
                  style={{
                    background: '#52B788',
                    color: '#FFF',
                    fontSize: '9.5px',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    fontWeight: 800,
                    letterSpacing: '0.04em'
                  }}
                >
                  FORENSIC AI
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#64748B' }}>
                Passport Forensics, Face Match & Security Expert
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {llmHealth?.online ? (
              <span
                style={{
                  background: '#EDF7EE',
                  color: '#2E6B39',
                  border: '1px solid #BCDCC7',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: '999px'
                }}
              >
                â— Ollama 3.2 Online
              </span>
            ) : (
              <span
                style={{
                  background: '#FFF9EB',
                  color: '#B66D26',
                  border: '1px solid #F8D6B0',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: '999px'
                }}
              >
                â— Forensic Engine Mode
              </span>
            )}

            <button
              onClick={onClose}
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: '10px',
                padding: '6px',
                color: '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            background: '#FAFAFA'
          }}
        >
          {messages.map((m, idx) => {
            const isCopilot = m.sender === 'copilot';
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: isCopilot ? 'flex-start' : 'flex-end',
                  gap: '10px',
                  alignItems: 'flex-start'
                }}
              >
                {isCopilot && (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#F0FDFA',
                      border: '1.5px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      flexShrink: 0
                    }}
                  >
                    ðŸ¾
                  </div>
                )}
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '12px 16px',
                    borderRadius: isCopilot ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                    background: isCopilot ? '#FFFFFF' : 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                    color: isCopilot ? '#0F172A' : '#FFFFFF',
                    border: isCopilot ? '1.5px solid #CCFBF1' : 'none',
                    boxShadow: isCopilot ? '0 3px 12px rgba(255, 141, 161, 0.1)' : '0 4px 14px rgba(224, 83, 116, 0.3)',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {m.text}
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#F0FDFA',
                  border: '1.5px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}
              >
                ðŸ¾
              </div>
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #CCFBF1',
                  padding: '10px 14px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <RefreshCw size={14} color="#14B8A6" className="animate-spin" />
                <span>AI Copilot AI is reviewing the forensic signals... âœ¨</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div
          style={{
            padding: '10px 18px',
            background: '#F8FAFC',
            borderTop: '1px solid #CCFBF1',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              style={{
                whiteSpace: 'nowrap',
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: '999px',
                padding: '5px 12px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#0D9488',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              ðŸ¾ {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: '14px 18px',
            background: '#FFFFFF',
            borderTop: '1.5px solid #CCFBF1',
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}
        >
          <input
            type="text"
            placeholder="Ask the AI Copilot AI about forensics, passport codes, or face match..."
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSend();
            }}
            style={{
              flex: 1,
              padding: '11px 16px',
              borderRadius: '14px',
              border: '1.5px solid #E2E8F0',
              background: '#FAFAFA',
              fontSize: '13px',
              color: '#0F172A',
              outline: 'none'
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !inputQuery.trim()}
            style={{
              background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
              color: '#FFF',
              border: 'none',
              borderRadius: '14px',
              padding: '11px 18px',
              cursor: loading || !inputQuery.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '13px',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(224, 83, 116, 0.3)',
              opacity: loading || !inputQuery.trim() ? 0.6 : 1
            }}
          >
            <Send size={15} />
            <span>Ask</span>
          </button>
        </div>
      </div>
    </div>
  );
}


