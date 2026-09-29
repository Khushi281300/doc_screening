// Plain-language labels used across the UI. Legal references stay in brackets so the jury still sees them.

export const ROLE = {
  INVESTIGATING_OFFICER: { short: 'IO', label: 'Investigating Officer', pill: 'pill-primary' },
  STATION_HOUSE_OFFICER: { short: 'SHO', label: 'Station House Officer', pill: 'pill-warning' },
  FSL_EXAMINER: { short: 'Lab', label: 'Forensic Lab (FSL)', pill: 'pill-success' },
  PUBLIC_PROSECUTOR: { short: 'Prosecutor', label: 'Public Prosecutor', pill: 'pill-neutral' },
  MAGISTRATE: { short: 'Court', label: 'Court (Magistrate)', pill: 'pill-court' },
};
export const roleInfo = (r) => ROLE[r] || { short: r, label: r, pill: 'pill-neutral' };

export const STATUS = {
  UNDER_INVESTIGATION: { label: 'Under investigation', pill: 'pill-primary' },
  FSL_PENDING: { label: 'With forensic lab', pill: 'pill-success' },
  CHARGE_SHEET_DRAFTED: { label: 'Charge sheet in draft', pill: 'pill-warning' },
  CHARGE_SHEET_FILED: { label: 'Filed in court', pill: 'pill-court' },
  IN_TRIAL: { label: 'Trial ongoing', pill: 'pill-court' },
  DISPOSED: { label: 'Closed', pill: 'pill-neutral' },
};
export const statusLabel = (s) => STATUS[s]?.label || (s || '').replace(/_/g, ' ').toLowerCase();
export const statusPill = (s) => STATUS[s]?.pill || 'pill-neutral';

export const DOC_TYPE = {
  FIR: 'FIR',
  CASE_DIARY: 'Case diary',
  WITNESS_STATEMENT: 'Witness statement',
  SEIZURE_MEMO: 'Seizure memo',
  EVIDENCE_EXHIBIT: 'Evidence photo / scan',
  FORENSIC_REPORT: 'Forensic lab report',
  CHARGE_SHEET: 'Charge sheet',
  LEGAL_NOTICE: 'Legal notice',
  COURT_ORDER: 'Court order',
  JUDGMENT: 'Judgment',
};
export const docTypeLabel = (t) => DOC_TYPE[t] || (t || '').replace(/_/g, ' ').toLowerCase();

export const ACTION = {
  CREATED: { label: 'Case opened', pill: 'pill-primary' },
  UPLOADED: { label: 'File added', pill: 'pill-primary' },
  REVISED: { label: 'New version added', pill: 'pill-primary' },
  FSL_REPORT_ATTACHED: { label: 'Lab report added', pill: 'pill-success' },
  VIEWED: { label: 'Opened', pill: 'pill-neutral' },
  DOWNLOADED: { label: 'Downloaded', pill: 'pill-neutral' },
  REDACTED: { label: 'Victim details hidden', pill: 'pill-shield' },
  CERTIFIED: { label: 'Court certificate issued', pill: 'pill-court' },
  TRANSFERRED_FSL: { label: 'Sent to forensic lab', pill: 'pill-success' },
  TRANSFERRED_PROSECUTOR: { label: 'Sent to prosecutor', pill: 'pill-warning' },
  FILED_COURT: { label: 'Filed in court', pill: 'pill-court' },
  STATUS_CHANGED: { label: 'Status changed', pill: 'pill-warning' },
  LOCKED: { label: 'Case locked', pill: 'pill-warning' },
  UNLOCKED: { label: 'Case unlocked', pill: 'pill-warning' },
  VERIFIED: { label: 'Tamper check run', pill: 'pill-success' },
  FORENSIC_FLAG: { label: 'Possible edited image', pill: 'pill-danger' },
  INTEGRITY_ALERT: { label: 'Tampering detected', pill: 'pill-danger' },
};
export const actionLabel = (a) => ACTION[a]?.label || (a || '').replace(/_/g, ' ').toLowerCase();
export const actionPill = (a) => ACTION[a]?.pill || 'pill-neutral';

export const TAMPER = {
  CLEAN: { label: 'No signs of editing', pill: 'pill-success' },
  SUSPICIOUS: { label: 'Possible editing', pill: 'pill-warning' },
  TAMPER_DETECTED: { label: 'Likely edited', pill: 'pill-danger' },
  NOT_APPLICABLE: { label: 'Not a photo', pill: 'pill-neutral' },
};
export const tamperLabel = (s) => TAMPER[s]?.label || s;
export const tamperPill = (s) => TAMPER[s]?.pill || 'pill-neutral';
