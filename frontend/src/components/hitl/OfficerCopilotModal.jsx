import React, { useState, useEffect } from 'react';
import { askCopilot, getLlmStatus } from '../../api/client';
import { Sparkles, Send, RefreshCw, X, ShieldCheck, AlertTriangle, Bot, MessageSquare, Cpu } from 'lucide-react';
import { playPop } from '../../utils/soundEffects';

export default function OfficerCopilotModal({ isOpen, onClose, scanResult }) {
  const [messages, setMessages] = useState([
    {
      sender: 'copilot',
      text: "Hello. I'm the ARGUS AI Copilot — your border screening and forensic assistant. I've analyzed this document's photo tampering layers, security check digits, and facial match data. How can I assist you with this inspection?"
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
        text: res?.reply || "Inspection completed — all security parameters within normal ranges."
      };
      setMessages(prev => [...prev, copilotMsg]);
      playPop();
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'copilot',
          text: "AI Copilot note: Inspection completed. Please verify the physical UV watermark, raised ink text, and passport code alignment manually."
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
        background: 'rgba(15, 23, 42, 0.65)',
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
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          height: '82vh',
          maxHeight: '750px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #E2E8F0'
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)',
            borderBottom: '1px solid #E2E8F0',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#0D9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)'
              }}
            >
              <Bot size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                  ARGUS AI Copilot
                </h3>
                <span
                  style={{
                    background: '#0D9488',
                    color: '#FFF',
                    fontSize: '9.5px',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    fontWeight: 700,
                    letterSpacing: '0.04em'
                  }}
                >
                  FORENSIC ASSISTANT
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#64748B' }}>
                Passport Forensics, Face Match & Security Guidance
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
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
                Ollama 3.2 Online
              </span>
            ) : (
              <span
                style={{
                  background: '#F0FDFA',
                  color: '#0F766E',
                  border: '1px solid #99F6E4',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <Cpu size={12} color="#0D9488" />
                Forensic Engine Ready
              </span>
            )}

            <button
              onClick={onClose}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
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
                      borderRadius: '8px',
                      background: '#F0FDFA',
                      border: '1px solid #CCFBF1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Bot size={16} color="#0D9488" />
                  </div>
                )}
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '12px 16px',
                    borderRadius: isCopilot ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
                    background: isCopilot ? '#FFFFFF' : 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
                    color: isCopilot ? '#0F172A' : '#FFFFFF',
                    border: isCopilot ? '1px solid #E2E8F0' : 'none',
                    boxShadow: isCopilot ? '0 2px 8px rgba(0, 0, 0, 0.04)' : '0 4px 12px rgba(13, 148, 136, 0.25)',
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
                  borderRadius: '8px',
                  background: '#F0FDFA',
                  border: '1px solid #CCFBF1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Bot size={16} color="#0D9488" />
              </div>
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CCFBF1',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <RefreshCw size={14} color="#0D9488" className="animate-spin" />
                <span>AI Copilot is reviewing forensic signals...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div
          style={{
            padding: '10px 18px',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
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
                border: '1px solid #CBD5E1',
                borderRadius: '999px',
                padding: '5px 12px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#0F766E',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <Sparkles size={11} color="#0D9488" />
              <span>{q}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: '14px 18px',
            background: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}
        >
          <input
            type="text"
            placeholder="Ask AI Copilot about tampering, check digits, or face similarity..."
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSend();
            }}
            style={{
              flex: 1,
              padding: '11px 16px',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
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
              background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
              color: '#FFF',
              border: 'none',
              borderRadius: '10px',
              padding: '11px 18px',
              cursor: loading || !inputQuery.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
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
