import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Scan, 
  Binary, 
  Layers, 
  UserCheck, 
  ShieldAlert, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Zap,
  Activity
} from 'lucide-react';

const PIPELINE_STEPS = [
  {
    step: "01",
    title: "Step 1 — Scan & Straighten the Document",
    badge: "Photo Quality Check",
    icon: Scan,
    color: "cyan",
    summary: "The system captures the passport scan, straightens any tilt or angle, and checks that the photo is sharp, clear, and free of glare — just like a scanner at a bank or airport.",
    tech: "Laplacian Variance > 80 | Tenengrad Focus Energy | Specular Glare < 8%"
  },
  {
    step: "02",
    title: "Step 2 — Read the Bottom Security Numbers (MRZ)",
    badge: "Security Code Check",
    icon: Binary,
    color: "sky",
    summary: "Reads the two lines of numbers and letters printed at the bottom of the passport (called MRZ — Machine Readable Zone) and runs a mathematical check to verify no date or number was tampered with.",
    tech: "7-3-1 Weight Sum Modulo 10 | ICAO TD3 Format | Strict Field Reconciliation"
  },
  {
    step: "03",
    title: "Step 3 — Check for Photo Edits & Forgery",
    badge: "Forgery Detection",
    icon: Layers,
    color: "purple",
    summary: "Runs 6 separate digital checks to detect any photo editing, Photoshop changes, copied stamps, screen recaptures (photo of a screen), or glued-on portraits that a human eye might miss.",
    tech: "ELA Compression Residuals | SRM 30-Filter Bank | 2D FFT Frequency Peaks | ORB Match"
  },
  {
    step: "04",
    title: "Step 4 — Face Match & Liveness Check",
    badge: "Face Verification",
    icon: UserCheck,
    color: "emerald",
    summary: "Compares the passport photo to the live camera selfie to confirm it is the same person. Also checks the selfie is a real live person — not a printout, mask, or screen replay.",
    tech: "512-D Cosine Metric > 0.65 Match | High-Freq Texture PAD | 3-Step Active Challenge"
  },
  {
    step: "05",
    title: "Step 5 — Check Police & Interpol Alert Lists",
    badge: "Watchlist Check",
    icon: ShieldAlert,
    color: "rose",
    summary: "Instantly searches the document number and traveler name against lost/stolen passport lists, Interpol Red Notices, and travel bans to flag any known alerts.",
    tech: "O(1) Indexed In-Memory Cache | Fuzzy Name Levenshtein Matching | Severity Hard-Stops"
  },
  {
    step: "06",
    title: "Step 6 — Final Decision & Secure Audit Log",
    badge: "Decision & Log",
    icon: Lock,
    color: "amber",
    summary: "Combines all findings into a clear Pass / Fail verdict with plain officer instructions. Every inspection decision is permanently saved with a tamper-proof security seal for audit purposes.",
    tech: "Multi-Factor Weighted Scoring | Hard-Stop Rules | Cryptographic Merkle Anchoring"
  }
];

export default function HowItWorksModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#0a1024] border border-cyan-500/40 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 bg-[#0c142c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-md">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                How ARGUS Works — Passport Inspection in 6 Steps
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Each passport goes through 6 automatic checks before a Pass or Fail verdict is given
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Intro Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/30 border border-cyan-500/30 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-slate-100">
                How AEGIS-ID Intercepts Counterfeits & Identity Fraud:
              </p>
              <p className="text-slate-400 leading-relaxed">
                Traditional checkpoint scanners rely purely on visual inspection or simple barcode reads. AEGIS-ID processes every document through a 6-stage multi-modal pipeline combining physical optical checks, cryptographic checksum verification, forensic spectral heatmaps, deep biometric facial embeddings, and live watchlist intelligence.
              </p>
            </div>
          </div>

          {/* 6 Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PIPELINE_STEPS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center">
                        {item.step}
                      </span>
                      <span className="text-sm font-bold text-slate-200">{item.title}</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
                      {item.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.summary}
                  </p>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[10px] font-mono text-cyan-300/90">
                    <span className="text-slate-500 block mb-0.5 font-sans uppercase font-bold text-[9px]">ENGINE SPEC:</span>
                    {item.tech}
                  </div>
                </div>
              );
            })}
          </div>

          {/* How To Test in Demo Mode */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> How to Test & Demo Different Scenarios
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300 pt-1">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-1">1. Authentic Passports</span>
                <p className="text-slate-400 text-[11px]">Click "Authentic Passport" vector to see how genuine ICAO checksums, clean ELA heatmaps, and biometric matches produce a 95+ score.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-rose-400 block mb-1">2. Tampered & Forged</span>
                <p className="text-slate-400 text-[11px]">Select "Altered Expiry" or "Fake MRZ" to see ELA thermal heatmaps highlight edited digits and mathematical check sums fail.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-purple-400 block mb-1">3. Screen Replay & Watchlist</span>
                <p className="text-slate-400 text-[11px]">Select "Screen Recapture" to see 2D FFT Moiré detection, or "Interpol Blacklist" to see immediate security hard-stops.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-[#0c142c] flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Compliant with ICAO 9303, ISO/IEC 19794-5 & ISO/IEC 30107-3
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-lg shadow-cyan-500/20 transition"
          >
            Got It, Launch Screening
          </button>
        </div>
      </div>
    </div>
  );
}
