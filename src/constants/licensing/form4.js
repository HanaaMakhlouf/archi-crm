// ── תנאים טופס 4 (Phase 5, when תנאים answered "yes" to opening one) ──
export const FORM4_STATUS_YES = 'yes';
export const FORM4_STATUS_NO = 'no';
export const FORM4_STATUS_NOT_REQUIRED = 'not_required';
export const FORM4_STATUS_OPTIONS = [
  { value: FORM4_STATUS_YES, label: 'כן' },
  { value: FORM4_STATUS_NO, label: 'לא' },
  { value: FORM4_STATUS_NOT_REQUIRED, label: 'לא נדרש' },
];
export const FORM4_DONE_STATUSES = [FORM4_STATUS_YES, FORM4_STATUS_NOT_REQUIRED];
export const DEFAULT_FORM4_ROWS = ['מצבית עדכנית', 'תשלום שיפור מיגון'];
