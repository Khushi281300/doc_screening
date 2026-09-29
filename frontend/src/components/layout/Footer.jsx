import React from 'react';
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

export default function Footer({ online }) {
  return (
    <footer className="border-t border-border bg-card/60 backdrop-blur-md px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 font-medium">
          <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-400 pulse-glow' : 'bg-amber-500'}`} />
          {online ? (
            <span className="text-foreground/80 flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-400" />
              <span>Zero-Trust Cryptographic Ledger Active</span>
            </span>
          ) : (
            <span className="text-amber-400">Server offline — backend unreachable</span>
          )}
        </span>
        <span className="text-border">|</span>
        <span className="hidden md:inline">BSA 2023 §63 & BNS §72 Certified</span>
      </div>

      <div className="flex items-center gap-2 font-medium">
        <span className="text-foreground/90 font-bold">CHRONICLE</span>
        <span>·</span>
        <span>Ministry of Home Affairs / NCRB</span>
        <span>·</span>
        <span className="text-primary font-mono text-[11px]">PS 26190</span>
      </div>
    </footer>
  );
}
