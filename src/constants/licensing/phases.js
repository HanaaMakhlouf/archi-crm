// ── LICENSING DATA (single JSONB column on clients) ──
// client.licensing_data holds all 4 phases nested:
// { info: {...}, application: {...}, conditions: {...}, confirmation: {...} }
export const FIELD_LICENSING_DATA = 'licensing_data';

export const LICENSING_PHASE_INFO = 'info';
export const LICENSING_PHASE_APPLICATION = 'application';
export const LICENSING_PHASE_CONDITIONS = 'conditions';
export const LICENSING_PHASE_CONFIRMATION = 'confirmation';
export const LICENSING_PHASE_FORM4 = 'form4';
export const LICENSING_PHASES = [
  { key: LICENSING_PHASE_INFO, label: 'מידע' },
  { key: LICENSING_PHASE_APPLICATION, label: 'בקשה' },
  { key: LICENSING_PHASE_CONDITIONS, label: 'תנאים' },
  { key: LICENSING_PHASE_CONFIRMATION, label: 'אישור התחלת עבודה' },
  { key: LICENSING_PHASE_FORM4, label: 'תנאים טופס 4' },
];

// The steps this client has: אישור התחלת עבודה and תנאים טופס 4 only when
// תנאים answered "yes" to needing them.
export const licensingPhasesFor = (conditions) => LICENSING_PHASES.filter(p =>
  (p.key !== LICENSING_PHASE_CONFIRMATION || conditions?.needs_start_approval === 'yes')
  && (p.key !== LICENSING_PHASE_FORM4 || conditions?.open_form4 === 'yes'));
