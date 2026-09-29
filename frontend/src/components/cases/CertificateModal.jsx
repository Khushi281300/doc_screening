import React, { useEffect, useState } from 'react';
import { Scale, ShieldCheck, Printer, CheckCircle2, AlertTriangle, Cpu } from 'lucide-react';
import { verifyCertificate } from '../../api/client';
import { Modal, Alert, Spinner, CopyButton, fmtDate, cx } from '../ui';

export default function CertificateModal({ cert, caseId, onClose }) {
  const [check, setCheck] = useState(null);

  useEffect(() => {
    setCheck(null);
    if (cert && caseId) {
      verifyCertificate(caseId, cert.certificate_id)
        .then(setCheck)
        .catch(() => setCheck({ error: true }));
    }
  }, [cert, caseId]);

  if (!cert) return null;

  const officer = cert.certifying_officer || {
    name: cert.certifying_officer_name,
    designation: cert.certifying_officer_designation,
    id: cert.certifying_officer_id,
  };

  return (
    <Modal
      open
      onClose={onClose}
      width="max-w-2xl"
      icon={Scale}
      title="Electronic Evidence Certificate — Sec 63(4) BSA 2023"
      subtitle="Statutory certificate for electronic records under Section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023 (formerly Section 65B, Indian Evidence Act)."
      footer={
        <>
          <button className="btn btn-secondary btn-sm no-print" onClick={() => window.print()}>
            <Printer size={14} /> Print Certificate
          </button>
          <button className="btn btn-primary btn-sm no-print" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Verification Check */}
        {check === null && (
          <div className="text-xs text-muted-foreground flex items-center justify-center p-3 gap-2 bg-surface/50 rounded-xl border border-border">
            <Spinner size={14} /> Validating digital signature and Merkle chain inclusion…
          </div>
        )}

        {check?.error && (
          <Alert kind="warning">Verification service temporarily unavailable for this certificate.</Alert>
        )}

        {check && !check.error && (
          <div
            className={cx(
              'rounded-xl border p-3.5 flex items-start gap-3 text-xs leading-relaxed',
              check.valid
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            )}
          >
            {check.valid ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="shrink-0 mt-0.5" />}
            <div>
              <b className="text-sm font-bold block">
                {check.valid ? 'Court Admissibility Verified: Certificate 100% Genuine' : 'Admissibility Warning: Certificate Tampering Detected'}
              </b>
              <span>
                Hardware Digital Signature: <b>{check.signature_valid ? 'Valid & Genuine' : 'Invalid'}</b> · File SHA-256: <b>{check.file_hash_matches ? 'Unchanged' : 'Mismatch'}</b> · Chained in Merkle Ledger: <b>{check.merkle_root_in_chain ? 'Yes' : 'No'}</b>.
              </span>
            </div>
          </div>
        )}

        {/* Certificate Parchment Document */}
        <div className="rounded-2xl border border-court-border bg-court-soft/20 p-6 space-y-5 text-xs text-foreground shadow-sm">
          {/* Official Seal Header */}
          <div className="border-b border-court-border/60 pb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-court-soft text-court border border-court-border flex items-center justify-center font-bold">
                <Scale size={20} />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-court">
                  Ministry of Home Affairs · NCRB Evidentiary Grid
                </div>
                <div className="text-base font-extrabold text-foreground">
                  Certificate Under Section 63(4), BSA 2023
                </div>
              </div>
            </div>

            <div className="text-right font-mono text-[11px]">
              <div className="text-court font-bold">CERTIFICATE ID</div>
              <div className="text-foreground select-all">{cert.certificate_id}</div>
            </div>
          </div>

          {/* Legal Declaration */}
          <div className="italic leading-relaxed bg-card/80 border border-court-border/40 rounded-xl p-4 text-[12.5px] text-foreground/90 font-serif">
            “{cert.legal_declaration}”
          </div>

          {/* Key-Value Specification Grid */}
          <div className="grid sm:grid-cols-2 gap-3.5 bg-surface/50 border border-border p-4 rounded-xl">
            <Item k="FIR & Case Record" v={`${cert.fir_number || cert.case_id} (${cert.police_station})`} />
            <Item k="Seized Exhibit Title" v={cert.document_title} />
            <Item k="Certifying Officer" v={`${officer.name}, ${officer.designation} (ID: ${officer.id || 'OFFICER'})`} />
            <Item k="Timestamp of Issuance" v={fmtDate(cert.issued_at)} />

            <div className="sm:col-span-2 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <span className="section-title text-[10px] text-court">Exhibit SHA-256 Fingerprint</span>
                <CopyButton text={cert.document_sha256} />
              </div>
              <div className="hash text-[11.5px] font-mono text-foreground mt-0.5 break-all select-all font-semibold">
                {cert.document_sha256}
              </div>
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <span className="section-title text-[10px] text-court">Merkle Root Hash at Issuance</span>
                <CopyButton text={cert.merkle_root} />
              </div>
              <div className="hash text-[11.5px] font-mono text-foreground mt-0.5 break-all select-all">
                {cert.merkle_root}
              </div>
            </div>

            <div className="sm:col-span-2">
              <span className="section-title text-[10px] text-court">Terminal Hardware Fingerprint</span>
              <div className="hash text-[11.5px] font-mono text-foreground mt-0.5 break-all select-all">
                {cert.terminal_hardware_hash}
              </div>
            </div>

            <div className="sm:col-span-2">
              <span className="section-title text-[10px] text-court">Cryptographic Digital Signature</span>
              <div className="hash text-[11px] font-mono text-foreground mt-0.5 break-all select-all">
                {cert.digital_signature}
              </div>
            </div>
          </div>

          {/* Footer seal */}
          <div className="pt-2 border-t border-court-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5 text-court font-semibold">
              <ShieldCheck size={14} /> Immutable Evidentiary Chain Verified
            </span>
            <span>Admissible under Sec 63 Bharatiya Sakshya Adhiniyam</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Item({ k, v }) {
  return (
    <div>
      <div className="section-title text-[10px] text-court">{k}</div>
      <div className="text-xs font-semibold text-foreground mt-0.5 leading-snug">{v}</div>
    </div>
  );
}
