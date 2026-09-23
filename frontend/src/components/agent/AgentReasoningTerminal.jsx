import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Camera, 
  FileText, 
  Binary, 
  Microscope, 
  UserCheck, 
  Search, 
  Scale, 
  ShieldCheck, 
  Clock, 
  Cpu, 
  CheckCircle2 
} from 'lucide-react';

// Maps technical agent/action names to friendly step titles and Lucide icons
const getFriendlyStepDetails = (item, idx) => {
  const agent = (item.agent || '').toLowerCase();
  const action = (item.action || '').toLowerCase();
  const thought = (item.thought || '').toLowerCase();

  if (idx === 0 || agent.includes('ingest') || action.includes('ingest') || thought.includes('quality') || thought.includes('preprocess')) {
    return { icon: Camera, label: 'Document Ingestion & Image Quality', desc: 'Preprocesses the frame, validates lighting, resolution, and tilt geometry.' };
  }
  if (agent.includes('ocr') || action.includes('ocr') || thought.includes('ocr') || thought.includes('text')) {
    return { icon: FileText, label: 'OCR & Visual Field Extraction', desc: 'Parses traveler names, passport numbers, birth dates, and expiration dates.' };
  }
  if (agent.includes('mrz') || action.includes('mrz') || thought.includes('mrz') || thought.includes('checksum') || thought.includes('check digit')) {
    return { icon: Binary, label: 'ICAO Checksum Validation', desc: 'Computes TD3 7-3-1 weight algorithms across all check digits.' };
  }
  if (agent.includes('forensic') || action.includes('ela') || action.includes('forensic') || thought.includes('tamper') || thought.includes('ela')) {
    return { icon: Microscope, label: 'Multi-Spectral Tampering & ELA', desc: 'Executes Error Level Analysis, FFT Moiré, and noise inconsistency scans.' };
  }
  if (agent.includes('biometric') || action.includes('face') || action.includes('liveness') || thought.includes('face') || thought.includes('biometric')) {
    return { icon: UserCheck, label: 'Biometric Face Match & Liveness', desc: 'Extracts deep facial embeddings and validates against live selfie.' };
  }
  if (agent.includes('blacklist') || action.includes('watchlist') || thought.includes('watchlist') || thought.includes('interpol')) {
    return { icon: Search, label: 'Watchlist & Interpol Screening', desc: 'Cross-checks traveler record against stolen documents and alert registries.' };
  }
  if (agent.includes('risk') || action.includes('risk') || thought.includes('risk') || thought.includes('score')) {
    return { icon: Scale, label: 'Bayesian Risk Synthesis', desc: 'Fuses forensic, mathematical, and biometric scores into final outcome.' };
  }
  if (agent.includes('blockchain') || action.includes('blockchain') || thought.includes('blockchain') || thought.includes('audit')) {
    return { icon: ShieldCheck, label: 'Cryptographic Audit Commitment', desc: 'Generates SHA-256 state seal and stores immutable inspection event.' };
  }
  return { icon: Cpu, label: `Pipeline Stage ${idx + 1}`, desc: item.action || 'Executing automated screening routine...' };
};

export default function AgentReasoningTerminal({ trace = [] }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeStep, setActiveStep] = useState(null);

  if (!trace || trace.length === 0) return null;

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '16px',
      border: '1px solid #E2E8F0',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid #E2E8F0',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #F0FDFA 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, 
            height: 36, 
            borderRadius: 8,
            background: '#0D9488',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <Cpu size={18} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
              ARGUS Autonomous Reasoning Pipeline
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
              {trace.length} verified micro-decisions executed in this inspection
            </div>
          </div>
          <span style={{
            fontSize: 11, 
            fontWeight: 700, 
            padding: '3px 10px', 
            borderRadius: 999,
            background: '#F0FDF4', 
            color: '#166534', 
            border: '1px solid #BBF7D0',
            display: 'flex',
            alignItems: 'center',
            gap: 5
          }}>
            <CheckCircle2 size={12} color="#16A34A" />
            <span>{trace.length} Pipeline Stages Completed</span>
          </span>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            background: '#FFFFFF', 
            border: '1px solid #CBD5E1',
            color: '#0F766E', 
            borderRadius: 8, 
            padding: '6px 12px',
            fontSize: 12, 
            fontWeight: 700, 
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F0FDFA'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; }}
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span>{isExpanded ? 'Hide Trace' : 'View Trace'}</span>
        </button>
      </div>

      {/* Steps List */}
      {isExpanded && (
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {trace.map((item, idx) => {
            const isSelected = activeStep === idx;
            const step = getFriendlyStepDetails(item, idx);
            const StepIcon = step.icon;
            const isDone = (item.status || 'COMPLETED').toUpperCase() === 'COMPLETED';

            return (
              <div
                key={idx}
                onClick={() => setActiveStep(isSelected ? null : idx)}
                style={{
                  background: isSelected ? '#F0FDFA' : '#FAFAFA',
                  border: isSelected ? '1px solid #14B8A6' : '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#F8FAFC';
                    e.currentTarget.style.borderColor = '#CBD5E1';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#FAFAFA';
                    e.currentTarget.style.borderColor = '#E2E8F0';
                  }
                }}
              >
                {/* Step header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Step number badge */}
                    <span style={{
                      fontSize: 10, 
                      fontWeight: 800, 
                      background: '#0D9488', 
                      color: '#FFFFFF',
                      padding: '2px 7px', 
                      borderRadius: 4, 
                      letterSpacing: '0.04em', 
                      whiteSpace: 'nowrap'
                    }}>
                      Step {item.step || idx + 1}
                    </span>

                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: '#E6FFFA',
                      color: '#0D9488',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <StepIcon size={14} />
                    </div>

                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                      {step.label}
                    </span>
                  </div>

                  {/* Status pill */}
                  <span style={{
                    fontSize: 11, 
                    fontWeight: 700, 
                    padding: '2px 8px', 
                    borderRadius: 999,
                    background: isDone ? '#F0FDF4' : '#FFFBEB',
                    color: isDone ? '#166534' : '#B45309',
                    border: `1px solid ${isDone ? '#BBF7D0' : '#FDE68A'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    {isDone ? (
                      <>
                        <CheckCircle2 size={12} color="#16A34A" />
                        <span>Complete</span>
                      </>
                    ) : (
                      <>
                        <Clock size={12} color="#D97706" />
                        <span>In Progress</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Brief description */}
                <p style={{
                  margin: '6px 0 0 0', 
                  fontSize: 12, 
                  color: '#64748B', 
                  lineHeight: 1.45,
                  paddingLeft: 34,
                }}>
                  {step.desc}
                </p>

                {/* Expanded detail on click */}
                {isSelected && (
                  <div style={{ marginTop: 10, paddingLeft: 34, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {item.thought && (
                      <div style={{
                        background: '#FFFFFF', 
                        border: '1px solid #CCFBF1', 
                        borderRadius: 6,
                        padding: '8px 12px', 
                        fontSize: 12, 
                        color: '#334155', 
                        lineHeight: 1.5
                      }}>
                        <strong style={{ color: '#0F766E' }}>Agent Thought: </strong>
                        {item.thought}
                      </div>
                    )}
                    {item.tool_calls && (
                      <div style={{
                        background: '#0F172A', 
                        color: '#38BDF8', 
                        borderRadius: 6,
                        padding: '8px 12px', 
                        fontSize: 11, 
                        fontFamily: "'JetBrains Mono', monospace", 
                        overflowX: 'auto'
                      }}>
                        {JSON.stringify(item.tool_calls, null, 2)}
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
