import React from 'react';
import { CheckCircle2, XCircle, FileCode2, Info } from 'lucide-react';
import EmptyStationState from '../layout/EmptyStationState';

export default function MRZCard({ documentFields, onGoToScanner, onSelectSample }) {
  if (!documentFields) {
    return (
      <EmptyStationState
        title="No Passport Security Code Scanned"
        subtitle="Verifies the 2 lines of numbers and letters at the bottom of the passport using mathematical check digits."
        explanation="Scan a passport or choose a test scenario to inspect document number, birth date, and expiry date check codes."
        onGoToScanner={onGoToScanner}
        onSelectSample={onSelectSample}
      />
    );
  }

  const mrz = documentFields || {};
  const checkDigits = mrz.check_digits || {};
  const rawMRZ = mrz.raw_mrz || [
    'P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<',
    'L898902C36UTO7408122F3004159ZE184226B<<<<<10'
  ];
  const allValid = mrz.all_check_digits_valid !== false;

  const checks = [
    {
      id: 'doc',
      name: 'Passport Number Security Digit',
      subtitle: 'Document Number Code',
      item: checkDigits.document_number || { expected: '6', calculated: '6', valid: true },
      explanation: 'Verifies the passport number matches its built-in security checksum. Catches any number that was altered.'
    },
    {
      id: 'dob',
      name: 'Date of Birth Security Digit',
      subtitle: 'Birth Date Code',
      item: checkDigits.date_of_birth || { expected: '2', calculated: '2', valid: true },
      explanation: "Confirms the traveler's birth date has not been modified or falsified."
    },
    {
      id: 'exp',
      name: 'Expiry Date Security Digit',
      subtitle: 'Expiration Date Code',
      item: checkDigits.expiry_date || { expected: '9', calculated: '9', valid: true },
      explanation: 'Confirms the expiry year and month have not been changed to extend passport validity.'
    },
    {
      id: 'com',
      name: 'Master Combined Security Code',
      subtitle: 'Composite Checksum',
      item: checkDigits.composite || { expected: '0', calculated: '0', valid: true },
      explanation: 'A master security calculation across all passport numbers combined — final seal of mathematical authenticity.'
    }
  ];

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Card Header */}
      <div className="od-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: '#F0FDFA',
            color: '#0D9488',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileCode2 size={16} />
          </div>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Passport Bottom Security Codes (MRZ Check)
            </h2>
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              MRZ = Machine Readable Zone — the two lines of text printed at the bottom of every passport
            </div>
          </div>
        </div>

        <span className={allValid ? 'pill pill-green' : 'pill pill-red'}>
          {allValid ? 'All Security Codes Match' : 'Security Code Mismatch Detected'}
        </span>
      </div>

      <div className="od-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Explanatory banner for non-technical officers */}
        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 6,
          padding: '12px 14px',
          display: 'flex',
          gap: 10,
          alignItems: 'center'
        }}>
          <Info size={16} color="#0D9488" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
            <strong>How this protects border security:</strong> The two lines of text printed at the bottom of official passports contain hidden mathematical check numbers. If someone changes a date or document number on the passport, these calculated numbers will immediately fail to match.
          </div>
        </div>

        {/* Raw MRZ Box */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Extracted Security Code Lines:
          </label>
          <div style={{
            background: '#0F172A',
            borderRadius: 6,
            padding: '12px 16px',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '12px',
            color: '#2DD4BF',
            letterSpacing: '0.08em',
            lineHeight: 1.7,
            overflowX: 'auto',
            border: '1px solid #1E293B'
          }}>
            {rawMRZ.map((line, idx) => (
              <div key={idx} style={{ whiteSpace: 'nowrap' }}>
                <span style={{ color: '#64748B', userSelect: 'none', marginRight: 12 }}>
                  Line {idx + 1}:
                </span>
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Check Digits Grid */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Check Digit Verification Breakdown:
          </label>
          <div className="grid-responsive-2col" style={{ gap: 12 }}>
            {checks.map(chk => {
              const valid = chk.item?.valid !== false;
              return (
                <div
                  key={chk.id}
                  style={{
                    background: valid ? '#FFFFFF' : '#FEF2F2',
                    border: `1px solid ${valid ? '#E2E8F0' : '#FECACA'}`,
                    borderRadius: 6,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: valid ? '#0F172A' : '#991B1B' }}>
                      {chk.name}
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '11px',
                      fontWeight: 700,
                      color: valid ? '#16A34A' : '#DC2626'
                    }}>
                      {valid ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      {valid ? 'Valid Match' : 'Mismatch'}
                    </span>
                  </div>

                  <p style={{ fontSize: '11.5px', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                    {chk.explanation}
                  </p>

                  <div style={{
                    marginTop: 4,
                    padding: '6px 10px',
                    background: valid ? '#F8FAFC' : '#FEE2E2',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}>
                    <span style={{ color: '#64748B' }}>
                      Printed Code: <strong>{chk.item?.expected ?? '-'}</strong>
                    </span>
                    <span style={{ color: valid ? '#16A34A' : '#DC2626' }}>
                      Calculated Code: <strong>{chk.item?.calculated ?? '-'}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
