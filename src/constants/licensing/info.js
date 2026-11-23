// רישוי → מידע.
// Licensing document types
export const DOC_SITE_IMAGE = 'site_image';
export const DOC_INFO_FEE = 'info_fee';
export const DOC_SIGNED_MAP = 'signed_map';
export const DOC_MAPI_APPROVAL = 'mapi_approval';
export const LICENSING_DOCUMENTS = [
  { type: DOC_SITE_IMAGE, label: 'תמונת שטח' },
  { type: DOC_INFO_FEE, label: 'אגרת מידע' },
  { type: DOC_SIGNED_MAP, label: 'מפה מצבית חתומה דיגיטלית' },
  { type: DOC_MAPI_APPROVAL, label: 'אישור מפ"י' },
];

export const DOC_STATUS_MISSING = 'missing';      // חסר
export const DOC_STATUS_PRESENT = 'present';      // מוכן
export const DOC_STATUS_NOT_REQUIRED = 'not_required'; // לא נדרש

export const DOC_STATUS_OPTIONS = [
  { value: DOC_STATUS_MISSING, label: 'חסר' },
  { value: DOC_STATUS_PRESENT, label: 'מוכן' },
  { value: DOC_STATUS_NOT_REQUIRED, label: 'לא נדרש' },
];

// Info-note send status
export const INFO_NOTE_NOT_SENT = 'not_sent';
export const INFO_NOTE_SENT = 'sent';

export const INFO_NOTE_OPTIONS = [
  { value: INFO_NOTE_NOT_SENT, label: 'לא נשלח' },
  { value: INFO_NOTE_SENT, label: 'נשלח' },
];

// בקשת מידע לזמין — one row in מידע, replacing שלח בקשת מידע + האם עבר תנאים מקדמיים.
export const ONLINE_INFO_NOT_SENT = 'online_info_not_sent';
export const ONLINE_INFO_SENT = 'online_info_sent';
export const ONLINE_INFO_PASSED = 'online_info_passed';
export const ONLINE_INFO_RECEIVED = 'online_info_received';

export const ONLINE_INFO_OPTIONS = [
  { value: ONLINE_INFO_NOT_SENT, label: 'טרם נשלח' },
  { value: ONLINE_INFO_SENT, label: 'נשלח' },
  { value: ONLINE_INFO_PASSED, label: 'עבר תנאים מקדמיים' },
  { value: ONLINE_INFO_RECEIVED, label: 'התקבל' },
];

// Its reminders' section / row, and the sections of the two rows it replaced
// (their reminders are moved onto it — see hooks/useReminders.js).
export const ONLINE_INFO_SECTION_KEY = 'licensing.info.online_info';
export const ONLINE_INFO_ROW_LABEL = 'בקשת מידע לזמין';
export const OLD_ONLINE_INFO_SECTION_KEYS = ['licensing.info.info_note', 'licensing.info.conditions'];

// The reminder (in days) each status sets automatically; התקבל clears it.
export const ONLINE_INFO_REMINDER_DAYS = {
  [ONLINE_INFO_NOT_SENT]: 1,
  [ONLINE_INFO_SENT]: 5,
  [ONLINE_INFO_PASSED]: 30,
};

// ── CONDITIONS STATUS (Info Phase — preliminary conditions check) ──
export const CONDITIONS_STATUS_NOT_SENT = 'cond_not_sent';
export const CONDITIONS_STATUS_SENT = 'cond_sent';
export const CONDITIONS_STATUS_PASSED = 'cond_passed';
export const CONDITIONS_STATUS_RECEIVED = 'cond_received';
export const CONDITIONS_STATUS_RETURNED = 'cond_returned';

export const CONDITIONS_STATUS_OPTIONS = [
  { value: CONDITIONS_STATUS_NOT_SENT, label: 'טרם נשלח' },
  { value: CONDITIONS_STATUS_SENT, label: 'נשלח' },
  { value: CONDITIONS_STATUS_RETURNED, label: 'הועבר לתיקון' },
  { value: CONDITIONS_STATUS_PASSED, label: 'עבר תנאים' },
  { value: CONDITIONS_STATUS_RECEIVED, label: 'התקבל' },

];
