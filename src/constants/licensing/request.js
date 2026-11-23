import {
  CONDITION_TRANSPORT, CONDITION_CONTROL_INSTITUTE,
} from './conditions';

// ── REQUEST (APPLICATION) PHASE ──
// Submission (הגשה)
export const SUBMISSION_NOT_STARTED = 'not_started';
export const SUBMISSION_IN_PROGRESS = 'in_progress';
export const SUBMISSION_NEEDS_FIX = 'submission_needs_fix';
export const SUBMISSION_DONE = 'done';
export const SUBMISSION_OPTIONS = [
  { value: SUBMISSION_NOT_STARTED, label: 'לא התחלנו' },
  { value: SUBMISSION_IN_PROGRESS, label: 'בסדר עבודה' },
  { value: SUBMISSION_NEEDS_FIX, label: 'נדרש תיקון' },
  { value: SUBMISSION_DONE, label: 'מוכן' },
];

// Actions table
export const ACTION_STATUS_NOT_SENT = 'not_sent';
export const ACTION_STATUS_SENT = 'sent';
export const ACTION_STATUS_PRESENT = 'present';
export const ACTION_STATUS_NOT_REQUIRED = 'not_required';

export const ACTION_STATUS_OPTIONS = [
  { value: ACTION_STATUS_NOT_SENT, label: 'לא נשלח' },
  { value: ACTION_STATUS_SENT, label: 'נשלח' },
  { value: ACTION_STATUS_PRESENT, label: 'מוכן' },
  { value: ACTION_STATUS_NOT_REQUIRED, label: 'לא נדרש' },
];

// The פקדון row has its own dropdown instead of ACTION_STATUS_OPTIONS.
// "not received" / "not required" reuse the generic codes so existing rows stay valid.
export const ACTION_LABEL_DEPOSIT = 'פקדון';
export const DEPOSIT_STATUS_NOT_RECEIVED = ACTION_STATUS_NOT_SENT;
export const DEPOSIT_STATUS_RECEIVED = 'deposit_received';
export const DEPOSIT_STATUS_PAID = 'deposit_paid';
export const DEPOSIT_STATUS_UPDATED = 'deposit_updated';
export const DEPOSIT_STATUS_NOT_REQUIRED = ACTION_STATUS_NOT_REQUIRED;

export const DEPOSIT_STATUS_OPTIONS = [
  { value: DEPOSIT_STATUS_NOT_RECEIVED, label: 'לא התקבל' },
  { value: DEPOSIT_STATUS_RECEIVED, label: 'התקבל' },
  { value: DEPOSIT_STATUS_PAID, label: 'שולם' },
  { value: DEPOSIT_STATUS_UPDATED, label: 'עודכן' },
  { value: DEPOSIT_STATUS_NOT_REQUIRED, label: 'לא נדרש' },
];

// The בעלות row has its own dropdown too; all three reuse the generic codes.
export const ACTION_LABEL_OWNERSHIP = 'בעלות';
export const OWNERSHIP_STATUS_OPTIONS = [
  { value: ACTION_STATUS_NOT_SENT, label: 'חסר' },
  { value: ACTION_STATUS_SENT, label: 'בטיפול לקוח' },
  { value: ACTION_STATUS_PRESENT, label: 'מוכן' },
];

// בקשה לרישוי זמין: here נשלח is the finished state (green).
export const ACTION_LABEL_ONLINE_PERMIT = 'בקשה לרישוי זמין';
export const ONLINE_PERMIT_STATUS_DRAFT = 'draft';
export const ONLINE_PERMIT_STATUS_RETURNED = 'returned_for_fixes';
export const ONLINE_PERMIT_STATUS_OPTIONS = [
  { value: ACTION_STATUS_NOT_SENT, label: 'לא נשלח' },
  { value: ONLINE_PERMIT_STATUS_DRAFT, label: 'טיוטה' },
  { value: ACTION_STATUS_SENT, label: 'נשלח' },
  { value: ONLINE_PERMIT_STATUS_RETURNED, label: 'חזר לתיקון' },
  { value: ACTION_STATUS_NOT_REQUIRED, label: 'לא נדרש' },
];

export const ACTION_LABEL_SUPERVISION = 'פיקוח';
export const SUPERVISION_STATUS_DELIVERED = 'delivered';
export const SUPERVISION_STATUS_OPTIONS = [
  { value: ACTION_STATUS_NOT_SENT, label: 'לא נשלח' },
  { value: ACTION_STATUS_SENT, label: 'נשלח' },
  { value: SUPERVISION_STATUS_DELIVERED, label: 'נמסר' },
];

// שיוך מבנים: "not delivered" / "not required" reuse the generic codes.
export const ACTION_LABEL_BUILDING_ASSIGN = 'שיוך מבנים';
export const BUILDING_ASSIGN_STATUS_SIGNED = 'signed';
export const BUILDING_ASSIGN_STATUS_OPTIONS = [
  { value: ACTION_STATUS_NOT_SENT, label: 'לא נמסר ללקוח' },
  { value: SUPERVISION_STATUS_DELIVERED, label: 'נמסר' },
  { value: BUILDING_ASSIGN_STATUS_SIGNED, label: 'נחתם' },
  { value: ACTION_STATUS_NOT_REQUIRED, label: 'לא נדרש' },
];
// Statuses saved under the old generic dropdown, in the new list's terms.
export const BUILDING_ASSIGN_STATUS_FROM_OLD = {
  [ACTION_STATUS_SENT]: SUPERVISION_STATUS_DELIVERED,
  [ACTION_STATUS_PRESENT]: BUILDING_ASSIGN_STATUS_SIGNED,
};

// תקנה and פרסום עזבון share "הפקת נוסח" (setting it on תקנה sets it on
// פרסום עזבון too) and "התקבל".
export const ACTION_LABEL_TAKANA = 'תקנה';
export const ACTION_LABEL_ESTATE_NOTICE = 'פרסום עזבון';
export const TEXT_STATUS_PREPARING = 'text_preparing';
export const TEXT_STATUS_READY = 'text_ready';
export const TEXT_STATUS_CONTACTED = 'contacted';
export const TEXT_STATUS_TO_COURIER = 'to_courier';
export const TEXT_STATUS_RECEIVED = 'received';
export const TEXT_STATUS_NOT_RECEIVED = 'not_received';
export const TAKANA_STATUS_OPTIONS = [
  { value: TEXT_STATUS_PREPARING, label: 'הפקת נוסח' },
  { value: TEXT_STATUS_READY, label: 'הופק נוסח' },
  { value: TEXT_STATUS_CONTACTED, label: 'נוצר קשר' },
  { value: TEXT_STATUS_TO_COURIER, label: 'נמסר לשליח' },
  { value: TEXT_STATUS_RECEIVED, label: 'התקבל' },
  { value: ACTION_STATUS_NOT_REQUIRED, label: 'לא נדרש' },
];
// פרסום עזבון has the same dropdown as תקנה.
export const ESTATE_NOTICE_STATUS_OPTIONS = TAKANA_STATUS_OPTIONS;
// No longer offered; kept so rows and history saved with it still read in Hebrew.
export const ESTATE_NOTICE_OLD_STATUS_OPTIONS = [
  { value: TEXT_STATUS_NOT_RECEIVED, label: 'לא התקבל' },
];
// Statuses saved under the old generic dropdown, in each row's new terms.
export const TAKANA_STATUS_FROM_OLD = {
  [ACTION_STATUS_NOT_SENT]: TEXT_STATUS_PREPARING,
  [ACTION_STATUS_SENT]: TEXT_STATUS_TO_COURIER,
  [ACTION_STATUS_PRESENT]: TEXT_STATUS_RECEIVED,
};
export const ESTATE_NOTICE_STATUS_FROM_OLD = {
  [ACTION_STATUS_NOT_SENT]: TEXT_STATUS_PREPARING,
  [ACTION_STATUS_PRESENT]: TEXT_STATUS_RECEIVED,
};

export const DEFAULT_REQUEST_ACTIONS = [
  ACTION_LABEL_OWNERSHIP,
  ACTION_LABEL_DEPOSIT,
  ACTION_LABEL_ONLINE_PERMIT,
  ACTION_LABEL_SUPERVISION,
  ACTION_LABEL_TAKANA,
  ACTION_LABEL_ESTATE_NOTICE,
  ACTION_LABEL_BUILDING_ASSIGN,
];

// Rows no longer used — dropped from existing clients when loaded.
export const REMOVED_REQUEST_ACTIONS = ['תצהירים'];

// נספח תחבורה (added by the public-use question) reuses the generic codes.
export const ACTION_LABEL_TRANSPORT = 'נספח תחבורה';
export const TRANSPORT_STATUS_OPTIONS = [
  { value: ACTION_STATUS_NOT_SENT, label: 'לא נשלח' },
  { value: ACTION_STATUS_SENT, label: 'נשלח' },
  { value: ACTION_STATUS_PRESENT, label: 'מוכן' },
  { value: ACTION_STATUS_NOT_REQUIRED, label: 'לא נדרש' },
];

// The three rows added by the הקלות / שימוש חורג question share one dropdown.
export const RELIEF_STATUS_MISSING_TEXT = 'missing_text';
export const RELIEF_STATUS_CONTACT = 'in_contact';
export const RELIEF_STATUS_SENT = ACTION_STATUS_SENT;
export const RELIEF_STATUS_RECEIVED = 'received';
export const RELIEF_STATUS_OPTIONS = [
  { value: RELIEF_STATUS_MISSING_TEXT, label: 'חסר נוסח' },
  { value: RELIEF_STATUS_CONTACT, label: 'התקשרות' },
  { value: RELIEF_STATUS_SENT, label: 'נשלח' },
  { value: RELIEF_STATUS_RECEIVED, label: 'התקבל' },
];
export const RELIEF_ACTIONS = ['פרסום הקלה', 'הודעה לגובלים', 'צילום בשטח'];

// First status for a new פעולות row.
export const actionRowDefaultStatus = (label) => {
  if (RELIEF_ACTIONS.includes(label)) return RELIEF_STATUS_MISSING_TEXT;
  if (label === ACTION_LABEL_TAKANA || label === ACTION_LABEL_ESTATE_NOTICE) return TEXT_STATUS_PREPARING;
  return ACTION_STATUS_NOT_SENT;
};

// Meeting (ישיבה)
export const MEETING_IN_COMMUNICATION = 'in_communication';
export const MEETING_SCHEDULED = 'scheduled';
export const MEETING_APPROVED = 'approved';

export const MEETING_OPTIONS = [
  { value: '', label: '—' },
  { value: MEETING_IN_COMMUNICATION, label: 'בתקשורת' },
  { value: MEETING_SCHEDULED, label: 'שובץ' },
  { value: MEETING_APPROVED, label: 'אושר' },
];

// ── Request questions (בקשה): a "yes" brings extra פעולות / תנאים rows.
// A "no" (or no answer) hides them; their statuses are kept in case it flips back.
export const Q_PUBLIC_USE = 'public_use';
export const Q_RELIEFS = 'reliefs';
export const ANSWER_YES = 'yes';
export const ANSWER_NO = 'no';
export const YES_NO_OPTIONS = [
  { value: ANSWER_YES, label: 'כן' },
  { value: ANSWER_NO, label: 'לא' },
];
export const REQUEST_QUESTIONS = [
  { key: Q_PUBLIC_USE, text: 'האם הבקשה כוללת שימוש ציבורי (מסחר, משרדים, מבנה ציבור או מבנה מעל 5 יח״ד)?' },
  { key: Q_RELIEFS, text: 'האם הבקשה כוללת הקלות או שימוש חורג?' },
];
export const QUESTION_ROWS = {
  [Q_PUBLIC_USE]: {
    actions: [ACTION_LABEL_TRANSPORT],
    conditions: ['בטיחות', 'נגישות', CONDITION_TRANSPORT, 'איכות הסביבה', CONDITION_CONTROL_INSTITUTE],
  },
  [Q_RELIEFS]: { actions: RELIEF_ACTIONS, conditions: [] },
};
// kind: 'actions' | 'conditions'; answers: the request (holds the answers).
export const isQuestionRowShown = (label, kind, answers) =>
  Object.entries(QUESTION_ROWS).every(([q, rows]) => !rows[kind].includes(label) || answers?.[q] === ANSWER_YES);
