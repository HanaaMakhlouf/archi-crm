import {
  DOC_STATUS_MISSING, DOC_STATUS_PRESENT, DOC_STATUS_NOT_REQUIRED,
} from './info';

// רישוי → תנאים: the condition rows, אגרות and היתר.

// רישוי → תנאים rows: the document statuses plus נשלח (sent, waiting for an answer).
export const CONDITION_ROW_STATUS_SENT = 'sent';
export const CONDITION_ROW_STATUS_OPTIONS = [
  { value: DOC_STATUS_MISSING, label: 'חסר' },
  { value: CONDITION_ROW_STATUS_SENT, label: 'נשלח' },
  { value: DOC_STATUS_PRESENT, label: 'מוכן' },
  { value: DOC_STATUS_NOT_REQUIRED, label: 'לא נדרש' },
];

// ── CONDITIONS PHASE (Phase 3) ──
// אגרות (after the תנאים): the fee, then היתר (printed → signed).
export const FEE_STATUS_NOT_ISSUED = 'fee_not_issued';
export const FEE_STATUS_ISSUED = 'fee_issued';
export const FEE_STATUS_PAID = 'fee_paid';
export const FEE_STATUS_UPDATED = 'fee_updated';
export const FEE_STATUS_NOT_REQUIRED = 'fee_not_required';
export const FEE_STATUS_OPTIONS = [
  { value: FEE_STATUS_NOT_ISSUED, label: 'לא הופק' },
  { value: FEE_STATUS_ISSUED, label: 'הופק' },
  { value: FEE_STATUS_PAID, label: 'שולם' },
  { value: FEE_STATUS_UPDATED, label: 'עודכן' },
  { value: FEE_STATUS_NOT_REQUIRED, label: 'לא נדרש' },
];
// The fee is settled (and היתר opens) once it's paid, updated or not needed.
export const FEE_DONE_STATUSES = [FEE_STATUS_PAID, FEE_STATUS_UPDATED, FEE_STATUS_NOT_REQUIRED];

export const PERMIT_STATUS_NOT_PRINTED = 'not_printed'; // לא הודפס
export const PERMIT_STATUS_PRINTED = 'printed';       // הודפס
export const PERMIT_STATUS_SIGNED = 'signed';        // נחתם
export const PERMIT_STATUS_OPTIONS = [
  { value: PERMIT_STATUS_NOT_PRINTED, label: 'לא הודפס' },
  { value: PERMIT_STATUS_PRINTED, label: 'הודפס' },
  { value: PERMIT_STATUS_SIGNED, label: 'נחתם' },
];

// היתר counts as signed only once the fee is settled too (it opens after it).
export const isPermitSigned = (conditions) =>
  FEE_DONE_STATUSES.includes(conditions.fee_status) && conditions.permit_status === PERMIT_STATUS_SIGNED;

// Before אגרות had its own row, היתר's list began with the fee.
export const PERMIT_STATUS_FEE_NOT_GIVEN = 'fee_not_given'; // לא נמסרה אגרה
export const PERMIT_STATUS_FEE_GIVEN = 'fee_given';     // נמסרה אגרה
export const PERMIT_OLD_STATUS_OPTIONS = [
  { value: PERMIT_STATUS_FEE_NOT_GIVEN, label: 'לא נמסרה אגרה' },
  { value: PERMIT_STATUS_FEE_GIVEN, label: 'נמסרה אגרה' },
];

export const CONDITION_HASHBACHA = 'השבחה';
export const CONDITION_CORP = 'התייחסות תאגיד';
export const CONDITION_CORP_145D = '145 ד תאגיד';
export const CONDITION_MUNICIPALITY_145D = '145 ד עירייה';
export const CONDITION_HAGA = 'הג״א';
export const CONDITION_TRANSPORT = 'התייחסות לנספח תחבורה';
export const CONDITION_CONTROL_INSTITUTE = 'מכון בקרה';

export const DEFAULT_CONDITION_ROWS = [
  CONDITION_HASHBACHA, CONDITION_CORP, CONDITION_CORP_145D, CONDITION_MUNICIPALITY_145D, CONDITION_HAGA, 'בטון',
  'פסולת', 'סטטי/תצהיר',
];

// Old row names → current ones (existing clients are renamed when loaded).
// Reminders are keyed by row name — see the matching SQL migration.
export const RENAMED_CONDITION_ROWS = {
  'פטור 140': CONDITION_HASHBACHA,
  'תאגיד': CONDITION_CORP,
  'תחבורה': CONDITION_TRANSPORT,
  'עירייה': CONDITION_MUNICIPALITY_145D,
};

// מכון בקרה: "received" reuses the מוכן (present) code so it counts as done like the others.
export const INSTITUTE_STATUS_NOT_CHOSEN = 'not_chosen';
export const INSTITUTE_STATUS_CHOSEN = 'chosen';
export const INSTITUTE_STATUS_HANDLING = 'institute_handling';
export const INSTITUTE_STATUS_RECEIVED = DOC_STATUS_PRESENT;
export const INSTITUTE_STATUS_OPTIONS = [
  { value: INSTITUTE_STATUS_NOT_CHOSEN, label: 'לא נבחר' },
  { value: INSTITUTE_STATUS_CHOSEN, label: 'נבחר' },
  { value: INSTITUTE_STATUS_HANDLING, label: 'בטיפול המכון' },
  { value: INSTITUTE_STATUS_RECEIVED, label: 'התקבל' },
];

// Row-specific condition statuses (the other rows use CONDITION_ROW_STATUS_OPTIONS).
export const COND_MISSING_DOCS = 'missing_docs';
export const COND_SENT_COMMITTEE = 'sent_committee';
export const COND_TO_APPRAISER = 'to_appraiser';
export const COND_SENT_CORP = 'sent_corp';
export const COND_CHARGE_RECEIVED = 'charge_received';
export const COND_RETURNED_FOR_FIXES = 'returned_for_fixes';

export const HASHBACHA_STATUS_OPTIONS = [
  { value: COND_MISSING_DOCS, label: 'חסר מסמכים' },
  { value: COND_SENT_COMMITTEE, label: 'נשלח לועדה' },
  { value: COND_TO_APPRAISER, label: 'הועבר לשמאי' },
  { value: DOC_STATUS_PRESENT, label: 'מוכן' },
  { value: DOC_STATUS_NOT_REQUIRED, label: 'לא נדרש' },
];
export const CORP_STATUS_OPTIONS = [
  { value: DOC_STATUS_MISSING, label: 'חסר' },
  { value: CONDITION_ROW_STATUS_SENT, label: 'נשלח' },
  { value: DOC_STATUS_NOT_REQUIRED, label: 'לא נדרש' },
  { value: DOC_STATUS_PRESENT, label: 'מוכן' },
];
export const CORP_145D_STATUS_OPTIONS = [
  { value: DOC_STATUS_MISSING, label: 'חסר' },
  { value: COND_SENT_CORP, label: 'נשלח לתאגיד' },
  { value: COND_MISSING_DOCS, label: 'חסר מסמכים' },
  { value: COND_CHARGE_RECEIVED, label: 'התקבל חיוב' },
  { value: DOC_STATUS_PRESENT, label: 'מוכן' },
];
export const HAGA_STATUS_OPTIONS = [
  { value: DOC_STATUS_MISSING, label: 'חסר' },
  { value: CONDITION_ROW_STATUS_SENT, label: 'נשלח' },
  { value: COND_RETURNED_FOR_FIXES, label: 'חזר לתיקונים' },
  { value: DOC_STATUS_PRESENT, label: 'מוכן' },
  { value: DOC_STATUS_NOT_REQUIRED, label: 'לא נדרש' },
];
export const CONDITION_ROW_SELECT_OPTIONS = {
  [CONDITION_HASHBACHA]: HASHBACHA_STATUS_OPTIONS,
  [CONDITION_CORP]: CORP_STATUS_OPTIONS,
  [CONDITION_CORP_145D]: CORP_145D_STATUS_OPTIONS,
  [CONDITION_HAGA]: HAGA_STATUS_OPTIONS,
  'הג"א': HAGA_STATUS_OPTIONS, // same row typed with a plain quote
  [CONDITION_CONTROL_INSTITUTE]: INSTITUTE_STATUS_OPTIONS,
};
export const conditionRowOptions = (label) => CONDITION_ROW_SELECT_OPTIONS[label] || CONDITION_ROW_STATUS_OPTIONS;

// A condition counts as done (and unlocks היתר once all are) at מוכן or לא נדרש.
export const CONDITION_DONE_STATUSES = [DOC_STATUS_PRESENT, DOC_STATUS_NOT_REQUIRED];
// A row added with its own options is done at the last of them.
export const isConditionRowDone = (row) => CONDITION_DONE_STATUSES.includes(row.status)
  || (!!row.options?.length && row.status === row.options[row.options.length - 1].value);
