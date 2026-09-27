import React, { useState } from "react";
import {
  ChevronDown, ChevronUp, Camera, FileText, Binary, Microscope,
  Search, Scale, ShieldCheck, Clock, Cpu, CheckCircle2,
  Brain, Fingerprint, GitMerge, Layers, CalendarCheck, Lock,
  ArrowRight, Sparkles, AlertTriangle
} from "lucide-react";

const STEP_DEFINITIONS = [
  {
    stepNumber: 1,
    match: (item, idx) => (item.step === 1) || (item.agent || "").toLowerCase().includes("ingest") || (item.action || "").toLowerCase().includes("quality") || idx === 0,
    icon: Camera,
    label: "Document Ingestion & Skew Correction",
    module: "INGEST",
    badgeLabel: "Ingest",
    desc: "Decodes raw image bytes, corrects perspective skew, and verifies image quality (glare, blur, and resolution).",
    color: "#0D9488"
  },
  {
    stepNumber: 2,
    match: (item) => (item.step === 2) || (item.agent || "").toLowerCase().includes("classif") || (item.action || "").toLowerCase().includes("classify"),
    icon: Layers,
    label: "Document Type Classification (Deep CNN)",
    module: "M1",
    badgeLabel: "Module 1 • Classification",
    desc: "Deep ResNet classifier identifies and routes document type: Passport, Visa, Driver's License, or National ID.",
    color: "#7C3AED"
  },
  {
    stepNumber: 3,
    match: (item) => (item.step === 3) || (item.agent || "").toLowerCase().includes("ocr") || (item.thought || "").toLowerCase().includes("field extraction"),
    icon: FileText,
    label: "Dual-Zone OCR & Text Extraction",
    module: "M1",
    badgeLabel: "Module 1 • Vision OCR",
    desc: "Adaptive 6-pass EasyOCR reads Visual Zone text and Machine Readable Zone (MRZ) chevrons with error correction.",
    color: "#7C3AED"
  },
  {
    stepNumber: 4,
    match: (item) => (item.step === 4) || (item.agent || "").toLowerCase().includes("validation") || (item.agent || "").toLowerCase().includes("standard") || (item.action || "").toLowerCase().includes("validate_document_standards"),
    icon: CalendarCheck,
    label: "ICAO 9303 & Chronological Standards",
    module: "M2",
    badgeLabel: "Module 2 • Standards",
    desc: "Validates chronological timelines (DOB < Issue < Expiry), ISO 3166-1 country codes, and ICAO 7-3-1 modulo checksums.",
    color: "#0891B2"
  },
  {
    stepNumber: 5,
    match: (item) => (item.step === 5) || (item.agent || "").toLowerCase().includes("forensic") || (item.agent || "").toLowerCase().includes("signal"),
    icon: Microscope,
    label: "8-Layer Multi-Vector Signal Forensics",
    module: "M3",
    badgeLabel: "Module 3 • Forensics",
    desc: "Detects digital manipulation via ELA compression delta, SRM texture residue, JPEG Ghost, 2D-FFT Moiré, and Deepfake CNN.",
    color: "#D97706"
  },
  {
    stepNumber: 6,
    match: (item) => (item.step === 6) || (item.agent || "").toLowerCase().includes("biometric") || ((item.thought || "").toLowerCase().includes("facenet") && !(item.agent || "").toLowerCase().includes("watchlist")),
    icon: Fingerprint,
    label: "FaceNet 512-D Biometrics & Liveness",
    module: "M4",
    badgeLabel: "Module 4 • Biometrics",
    desc: "Calculates cosine distance between live checkpoint camera and document crop with passive micro-texture anti-spoofing.",
    color: "#059669"
  },
  {
    stepNumber: 7,
    match: (item) => (item.step === 7) || (item.agent || "").toLowerCase().includes("watchlist") || (item.agent || "").toLowerCase().includes("intelligence"),
    icon: Search,
    label: "Watchlist Interrogation & 1:N Vector Search",
    module: "M4",
    badgeLabel: "Module 4 • Watchlist",
    desc: "Sub-millisecond query against Interpol Red Notices and SLTD database plus 1:N face vector duplicate identity search.",
    color: "#059669"
  },
  {
    stepNumber: 8,
    match: (item) => (item.step === 8) || (item.agent || "").toLowerCase().includes("risk") || (item.agent || "").toLowerCase().includes("supervisor"),
    icon: Scale,
    label: "Autonomous Risk Supervisor & ReAct Dossier",
    module: "RISK",
    badgeLabel: "Risk Engine",
    desc: "Calibrated Bayesian ML risk fusion outputs VERIFIED / MANUAL_REVIEW / REJECTED with explainable officer copilot trace.",
    color: "#DC2626"
  },
  {
    stepNumber: 9,
    match: (item) => (item.step === 9) || (item.agent || "").toLowerCase().includes("audit") || (item.agent || "").toLowerCase().includes("ledger") || (item.agent || "").toLowerCase().includes("blockchain") || (item.action || "").toLowerCase().includes("record_verification"),
    icon: Lock,
    label: "Cryptographic SHA-256 Merkle Audit Seal",
    module: "AUDIT",
    badgeLabel: "Blockchain Ledger",
    desc: "Cryptographically anchors all forensic vectors, officer badge ID, and risk verdict into an immutable Merkle audit ledger.",
    color: "#166534"
  }
];

const getStepConfig = (item, idx) => {
  for (const def of STEP_DEFINITIONS) {
    if (def.match(item, idx)) return def;
  }
  return {
    stepNumber: idx + 1,
    icon: Cpu,
    label: `Pipeline Stage ${idx + 1}: ${item.agent || "Autonomous Agent"}`,
    module: null,
    badgeLabel: "Agent Step",
    desc: item.thought || item.action || "Executing specialized screening sub-routine...",
    color: "#64748B"
  };
};

const MODULE_PILLS = {
  M1: { bg: "#F5F3FF", border: "#DDD6FE", text: "#6D28D9", label: "Module 1 • OCR & Classification" },
  M2: { bg: "#ECFEFF", border: "#BAE6FD", text: "#0369A1", label: "Module 2 • Standards & ICAO" },
  M3: { bg: "#FFFBEB", border: "#FDE68A", text: "#B45309", label: "Module 3 • Signal Forensics" },
  M4: { bg: "#ECFDF5", border: "#A7F3D0", text: "#047857", label: "Module 4 • Biometrics & Watchlist" },
};

export default function AgentReasoningTerminal({ trace = [] }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeStep, setActiveStep] = useState(null);

  if (!trace || trace.length === 0) return null;

  const completedCount = trace.filter(t => (t.status || "").toUpperCase() === "COMPLETED").length;
  const progressPct = Math.round((completedCount / trace.length) * 100);

  return (
    <div style={{
      background: "#FFFFFF",
      borderRadius: "16px",
      border: "1px solid #E2E8F0",
      boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
      overflow: "hidden",
      fontFamily: "'Plus Jakarta Sans', Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Header Banner */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 22px",
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
        borderBottom: "1px solid #334155"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "linear-gradient(135deg, #0D9488, #7C3AED)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            boxShadow: "0 4px 12px rgba(13,148,136,0.35)"
          }}>
            <Brain size={22} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
                ARGUS Autonomous Reasoning Pipeline
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 999,
                background: "rgba(13,148,136,0.2)",
                color: "#2DD4BF",
                border: "1px solid rgba(45,212,191,0.3)"
              }}>
                9 Agents Active
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 3 }}>
              4-Module Screening System • {trace.length} Autonomous Pipeline Stages Executed
            </div>
          </div>
        </div>

        {/* Module Legend Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.entries(MODULE_PILLS).map(([key, val]) => (
              <span key={key} style={{
                fontSize: 9.5,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 6,
                background: val.bg,
                color: val.text,
                border: `1px solid ${val.border}`
              }}>
                {val.label}
              </span>
            ))}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#E2E8F0",
              borderRadius: 8,
              padding: "7px 12px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{isExpanded ? "Collapse" : "Expand All"}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: 3, background: "#E2E8F0" }}>
        <div style={{
          height: "100%",
          width: `${progressPct}%`,
          background: "linear-gradient(90deg, #0D9488, #7C3AED, #2563EB)",
          transition: "width 0.4s ease"
        }} />
      </div>

      {/* Steps List */}
      {isExpanded && (
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 9 }}>
          {trace.map((item, idx) => {
            const isSelected = activeStep === idx;
            const step = getStepConfig(item, idx);
            const StepIcon = step.icon;
            const isDone = (item.status || "COMPLETED").toUpperCase() === "COMPLETED";

            return (
              <div
                key={idx}
                onClick={() => setActiveStep(isSelected ? null : idx)}
                style={{
                  background: isSelected ? "#F8FAFC" : "#FAFAFA",
                  border: `1px solid ${isSelected ? step.color : "#E2E8F0"}`,
                  borderLeft: `4px solid ${step.color}`,
                  borderRadius: 10,
                  padding: "11px 14px",
                  cursor: "pointer",
                  transition: "all 0.18s ease"
                }}
              >
                {/* Step Top Row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    {/* Step Number Tag */}
                    <span style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      background: step.color,
                      color: "#FFFFFF",
                      padding: "2px 7px",
                      borderRadius: 4,
                      letterSpacing: "0.06em",
                      whiteSpace: "nowrap"
                    }}>
                      STEP {item.step || idx + 1}
                    </span>

                    {/* Module Pill */}
                    {step.badgeLabel && (
                      <span style={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 4,
                        background: `${step.color}15`,
                        color: step.color,
                        border: `1px solid ${step.color}35`
                      }}>
                        {step.badgeLabel}
                      </span>
                    )}

                    {/* Step Icon */}
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: `${step.color}20`,
                      color: step.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <StepIcon size={14} />
                    </div>

                    {/* Step Title */}
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                      {step.label}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "3px 9px",
                    borderRadius: 999,
                    background: isDone ? "#F0FDF4" : "#FFFBEB",
                    color: isDone ? "#166534" : "#B45309",
                    border: `1px solid ${isDone ? "#BBF7D0" : "#FDE68A"}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 5
                  }}>
                    {isDone ? (
                      <>
                        <CheckCircle2 size={12} color="#16A34A" />
                        <span>Complete</span>
                      </>
                    ) : (
                      <>
                        <Clock size={12} color="#D97706" />
                        <span>Running</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Step Subtext */}
                <p style={{
                  margin: "6px 0 0 0",
                  fontSize: 11.5,
                  color: "#64748B",
                  lineHeight: 1.5,
                  paddingLeft: 6
                }}>
                  {step.desc}
                </p>

                {/* Expanded Inspection Observation & Chain of Thought */}
                {isSelected && (
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 7 }}>
                    {item.observation && (
                      <div style={{
                        background: "#F1F5F9",
                        border: `1px solid ${step.color}45`,
                        borderRadius: 8,
                        padding: "10px 14px",
                        fontSize: 11.5,
                        color: "#1E293B",
                        lineHeight: 1.6,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
                      }}>
                        <div style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: step.color,
                          marginBottom: 4,
                          letterSpacing: "0.06em",
                          display: "flex",
                          alignItems: "center",
                          gap: 5
                        }}>
                          <Sparkles size={11} /> AGENT OBSERVATION & TELEMETRY
                        </div>
                        {item.observation}
                      </div>
                    )}

                    {item.thought && (
                      <div style={{
                        background: "#FFFFFF",
                        border: "1px solid #CBD5E1",
                        borderRadius: 8,
                        padding: "9px 13px",
                        fontSize: 11.5,
                        color: "#334155",
                        lineHeight: 1.55
                      }}>
                        <strong style={{ color: "#7C3AED", fontSize: 10.5 }}>REASONING TRACE: </strong>
                        {item.thought}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Bottom Summary Bar with clean, uncorrupted flow */}
          <div style={{
            marginTop: 6,
            padding: "12px 16px",
            background: "linear-gradient(135deg, #F0FDFA, #F5F3FF)",
            borderRadius: 10,
            border: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={16} color="#16A34A" />
              <span style={{ fontSize: 12.5, fontWeight: 800, color: "#0F172A" }}>
                {completedCount} / {trace.length} Pipeline Stages Completed
              </span>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 600,
              color: "#475569",
              flexWrap: "wrap"
            }}>
              <span>Ingestion</span>
              <ArrowRight size={11} color="#94A3B8" />
              <span>Classification</span>
              <ArrowRight size={11} color="#94A3B8" />
              <span>Vision OCR</span>
              <ArrowRight size={11} color="#94A3B8" />
              <span>ICAO Standards</span>
              <ArrowRight size={11} color="#94A3B8" />
              <span>Signal Forensics</span>
              <ArrowRight size={11} color="#94A3B8" />
              <span>Biometrics</span>
              <ArrowRight size={11} color="#94A3B8" />
              <span>Risk Supervisor</span>
              <ArrowRight size={11} color="#94A3B8" />
              <span style={{ color: "#166534", fontWeight: 700 }}>Blockchain Seal</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
