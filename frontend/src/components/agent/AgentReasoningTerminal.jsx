import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Maps technical agent/action names to friendly step titles
const getFriendlyStepName = (item, idx) => {
  const agent = (item.agent || '').toLowerCase();
  const action = (item.action || '').toLowerCase();
  const thought = (item.thought || '').toLowerCase();

  if (idx === 0 || agent.includes('ingest') || action.includes('ingest') || thought.includes('quality') || thought.includes('preprocess')) {
    return { icon: 'ðŸ“·', label: 'Photo & Quality Check', desc: 'Checks the document image is clear, readable, and not distorted.' };
  }
  if (agent.includes('ocr') || action.includes('ocr') || thought.includes('ocr') || thought.includes('text')) {
    return { icon: 'ðŸ“', label: 'Text & Code Scanner', desc: 'Reads all the printed text, names, dates, and numbers from the document.' };
  }
  if (agent.includes('mrz') || action.includes('mrz') || thought.includes('mrz') || thought.includes('checksum') || thought.includes('check digit')) {
    return { icon: 'ðŸ”¢', label: 'Official Code Math Check', desc: 'Verifies the security codes at the bottom of the passport add up correctly.' };
  }
  if (agent.includes('forensic') || action.includes('ela') || action.includes('forensic') || thought.includes('tamper') || thought.includes('ela')) {
    return { icon: 'ðŸ”¬', label: 'Photoshop & Edit Detection', desc: 'Scans for signs of digital editing, photo splicing, or altered text using AI forensic tools.' };
  }
  if (agent.includes('biometric') || action.includes('face') || action.includes('liveness') || thought.includes('face') || thought.includes('biometric')) {
    return { icon: 'ðŸ‘¤', label: 'Face Match & Real Person Test', desc: 'Compares the live face against the passport photo and checks for a real person (not a printout).' };
  }
  if (agent.includes('blacklist') || action.includes('watchlist') || thought.includes('watchlist') || thought.includes('interpol')) {
    return { icon: 'ðŸ”Ž', label: 'Police & Stolen ID Search', desc: 'Cross-checks the passport against national stolen ID lists, Interpol notices, and travel bans.' };
  }
  if (agent.includes('risk') || action.includes('risk') || thought.includes('risk') || thought.includes('score')) {
    return { icon: 'âš–ï¸', label: 'Final Risk Decision', desc: 'Combines all findings and issues a final VERIFIED, REVIEW, or REJECTED decision.' };
  }
  if (agent.includes('blockchain') || action.includes('blockchain') || thought.includes('blockchain') || thought.includes('audit')) {
    return { icon: 'ðŸ”—', label: 'Secure Audit Log', desc: 'Saves the screening result permanently into the tamper-proof blockchain log.' };
  }
  // Fallback
  return { icon: 'ðŸ¾', label: `Step ${idx + 1}`, desc: item.action || 'Processing...' };
};

export default function AgentReasoningTerminal({ trace = [] }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeStep, setActiveStep] = useState(null);

  if (!trace || trace.length === 0) return null;

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '20px',
      border: '1.5px solid #CCFBF1',
      boxShadow: '0 8px 28px rgba(255,141,161,0.12)',
      overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 22px',
        borderBottom: '1.5px solid #CCFBF1',
        background: 'linear-gradient(135deg, #F0FDFA 0%, #FFECF3 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'linear-gradient(135deg, #14B8A6, #0D9488)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 4px 12px rgba(224,83,116,0.28)',
          }}>ðŸ¾</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
              AI Detective Investigation Steps
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>
              {trace.length} automated steps performed during this inspection
            </div>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
            background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0'
          }}>
            â— {trace.length} Steps Done
          </span>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: '#FFFFFF', border: '1.5px solid #CCFBF1',
            color: '#0F766E', borderRadius: 10, padding: '6px 14px',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F0FDFA'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; }}
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {isExpanded ? 'Hide Steps' : 'Show Steps'}
        </button>
      </div>

      {/* Steps */}
      {isExpanded && (
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {trace.map((item, idx) => {
            const isSelected = activeStep === idx;
            const step = getFriendlyStepName(item, idx);
            const isDone = (item.status || 'COMPLETED').toUpperCase() === 'COMPLETED';

            return (
              <div
                key={idx}
                onClick={() => setActiveStep(isSelected ? null : idx)}
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, #F0FDFA, #FFEEF4)'
                    : '#FAFAFA',
                  border: isSelected ? '1.5px solid #14B8A6' : '1.5px solid #CCFBF1',
                  borderRadius: 14,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#FFF8FB';
                    e.currentTarget.style.borderColor = '#FFB7CC';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#FAFAFA';
                    e.currentTarget.style.borderColor = '#CCFBF1';
                  }
                }}
              >
                {/* Step header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Step number badge */}
                    <span style={{
                      fontSize: 10, fontWeight: 800, background: '#14B8A6', color: '#FFFFFF',
                      padding: '2px 8px', borderRadius: 6, letterSpacing: '0.04em', whiteSpace: 'nowrap'
                    }}>
                      Step {item.step || idx + 1}
                    </span>
                    {/* Icon + Friendly name */}
                    <span style={{ fontSize: 17 }}>{step.icon}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>
                      {step.label}
                    </span>
                  </div>
                  {/* Status pill */}
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 999,
                    background: isDone ? '#F0FDF4' : '#FFFBEB',
                    color: isDone ? '#15803D' : '#B45309',
                    border: `1px solid ${isDone ? '#BBF7D0' : '#FDE68A'}`,
                    whiteSpace: 'nowrap',
                  }}>
                    {isDone ? 'âœ“ Done' : 'â³ Processing'}
                  </span>
                </div>

                {/* Brief description */}
                <p style={{
                  margin: '6px 0 0 0', fontSize: 12, color: '#64748B', lineHeight: 1.45,
                  paddingLeft: 42,
                }}>
                  {step.desc}
                </p>

                {/* Expanded detail on click */}
                {isSelected && (
                  <div style={{ marginTop: 12, paddingLeft: 42, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {item.thought && (
                      <div style={{
                        background: '#FFF8FB', border: '1px solid #E2E8F0', borderRadius: 10,
                        padding: '8px 12px', fontSize: 12, color: '#334155', lineHeight: 1.5
                      }}>
                        <strong style={{ color: '#0F766E' }}>AI Thought: </strong>
                        {item.thought}
                      </div>
                    )}
                    {item.observation && (
                      <div style={{
                        background: '#F6FFF9', border: '1px solid #BBF7D0', borderRadius: 10,
                        padding: '8px 12px', fontSize: 12, color: '#15803D', lineHeight: 1.5,
                        fontFamily: 'monospace'
                      }}>
                        <strong>Finding: </strong>
                        {item.observation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

