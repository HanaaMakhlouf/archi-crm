// ── CLIENT LABELS ──
export const LABEL_NEW = 'לקוח חדש';
export const LABEL_PERMANENT = 'לקוח פעיל';
export const LABEL_INACTIVE = 'לא פעיל';
export const LABEL_OPTIONS = [LABEL_NEW, LABEL_PERMANENT, LABEL_INACTIVE];

// ── CLIENT TYPES ──
export const TYPE_PLANNING = 'תכנון';
export const TYPE_LICENSING = 'רישוי';
export const TYPE_DETAILED = 'מפורטת';
export const CLIENT_TYPES = [TYPE_LICENSING, TYPE_PLANNING, TYPE_DETAILED];

// ── PLANNING STATUSES ──
export const STATUS_NOT_STARTED = 'not_started';
export const STATUS_IN_PROGRESS = 'in_progress';
export const STATUS_READY = 'ready';
export const STATUS_AGREED = 'agreed';

// Simple 2-state for construction / electricity / water
export const STATUS_NOT_READY = 'not_ready';
export const STATUS_READY_SIMPLE = 'ready';


// ── PLANNING DATA (single JSONB column on clients) ──
// All planning state lives under client.planning_data. Shape:
// {
//   client_requirements: string,
//   notes: string,
//   work_plan_notes: string,
//   tables: {
//     offer:          { status, notes },
//     visualization:  { status, notes },
//     disciplines: {
//       construction: { status, notes },
//       electricity:  { status, notes },
//       water:        { status, notes },
//     },
//   },
// }
export const FIELD_PLANNING_DATA = 'planning_data';

// ── LICENSING DATA (single JSONB column on clients) ──
// client.licensing_data holds all 4 phases nested:
// { info: {...}, application: {...}, conditions: {...}, confirmation: {...} }
export const FIELD_LICENSING_DATA = 'licensing_data';

export const LICENSING_PHASE_INFO = 'info';
export const LICENSING_PHASE_APPLICATION = 'application';
export const LICENSING_PHASE_CONDITIONS = 'conditions';
export const LICENSING_PHASE_CONFIRMATION = 'confirmation';
export const LICENSING_PHASES = [
  { key: LICENSING_PHASE_INFO, label: 'מידע' },
  { key: LICENSING_PHASE_APPLICATION, label: 'בקשה' },
  { key: LICENSING_PHASE_CONDITIONS, label: 'תנאים' },
  { key: LICENSING_PHASE_CONFIRMATION, label: 'אישור התחלת עבודה' },
];

// Licensing document types
export const DOC_SITE_IMAGE = 'site_image';
export const DOC_INFO_FEE = 'info_fee';
export const DOC_SIGNED_MAP = 'signed_map';
export const DOC_MAPI_APPROVAL = 'mapi_approval';
export const LICENSING_DOCUMENTS = [
  { type: DOC_SITE_IMAGE, label: 'תמונת שטח' },
  { type: DOC_INFO_FEE, label: 'אגרת מידע' },
  { type: DOC_SIGNED_MAP, label: 'מפה מצפית חתומה' },
  { type: DOC_MAPI_APPROVAL, label: 'אישור מפ"י' },
];

export const DOC_STATUS_MISSING = 'missing';      // חסר
export const DOC_STATUS_PRESENT = 'present';      // יש
export const DOC_STATUS_NOT_REQUIRED = 'not_required'; // לא נדרש

export const DOC_STATUS_OPTIONS = [
  { value: DOC_STATUS_MISSING, label: 'חסר' },
  { value: DOC_STATUS_PRESENT, label: 'יש' },
  { value: DOC_STATUS_NOT_REQUIRED, label: 'לא נדרש' },
];

// Info-note send status
export const INFO_NOTE_NOT_SENT = 'not_sent';
export const INFO_NOTE_SENT = 'sent';

export const INFO_NOTE_OPTIONS = [
  { value: INFO_NOTE_NOT_SENT, label: 'לא נשלח' },
  { value: INFO_NOTE_SENT, label: 'נשלח' },
];

// ── REQUEST (APPLICATION) PHASE ──
// Submission (הגשה)
export const SUBMISSION_NOT_STARTED = 'not_started';
export const SUBMISSION_IN_PROGRESS = 'in_progress';
export const SUBMISSION_DONE = 'done';
export const SUBMISSION_OPTIONS = [
  { value: SUBMISSION_NOT_STARTED, label: 'לא התחיל' },
  { value: SUBMISSION_IN_PROGRESS, label: 'בסדר עבודה' },
  { value: SUBMISSION_DONE, label: 'הוגש' },
];

// Actions table
export const ACTION_STATUS_NOT_SENT = 'not_sent';
export const ACTION_STATUS_SENT = 'sent';
export const ACTION_STATUS_PRESENT = 'present';
export const ACTION_STATUS_NOT_REQUIRED = 'not_required';

export const ACTION_STATUS_OPTIONS = [
  { value: ACTION_STATUS_NOT_SENT, label: 'לא נשלח' },
  { value: ACTION_STATUS_SENT, label: 'נשלח' },
  { value: ACTION_STATUS_PRESENT, label: 'יש' },
  { value: ACTION_STATUS_NOT_REQUIRED, label: 'לא נדרש' },
];

export const DEFAULT_REQUEST_ACTIONS = [
  'בעלות',
  'פקדון',
  'תקנה',
  'פרסום עזבון',
  'שיוך מבנים',
  'תצהירים',
];

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

// ── DETAILED TAB (מפורטת) ──
export const FIELD_DETAILED_DATA = 'detailed_data';

export const DETAILED_HACHANA_BE_TIPUL = 'be_tipul';  // בטיפול → orange
export const DETAILED_HACHANA_KEN = 'ken';        // כן → green
export const DETAILED_HACHANA_LO = 'lo';         // לא → red

export const DETAILED_SHUBATS = 'shubats';    // שובץ → green
export const DETAILED_LO_SHUBATS = 'lo_shubats'; // לא שובץ → red

export const DETAILED_LO_NISHLACH = 'lo_nishlach'; // לא נשלח → red
export const DETAILED_NISHLACH = 'nishlach';    // נשלח → orange
export const DETAILED_HITKABEL = 'hitkabel';    // התקבל → green

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

// ── CONDITIONS PHASE (Phase 3) ──
export const PERMIT_STATUS_FEE_NOT_GIVEN = 'fee_not_given'; // לא נמסרה אגרה
export const PERMIT_STATUS_FEE_GIVEN = 'fee_given';     // נמסרה אגרה
export const PERMIT_STATUS_PRINTED = 'printed';       // הודפס
export const PERMIT_STATUS_SIGNED = 'signed';        // נחתם

export const PERMIT_STATUS_OPTIONS = [
  { value: PERMIT_STATUS_FEE_NOT_GIVEN, label: 'לא נמסרה אגרה' },
  { value: PERMIT_STATUS_FEE_GIVEN, label: 'נמסרה אגרה' },
  { value: PERMIT_STATUS_PRINTED, label: 'הודפס' },
  { value: PERMIT_STATUS_SIGNED, label: 'נחתם' },
];

export const DEFAULT_CONDITION_ROWS = [
  'פטור 140', 'תאגיד', 'עירייה', 'הג״א', 'בטון',
  'פסולת', 'סטטי/תצהיר', 'בטיחות', 'נגישות', 'תחבורה', 'איכות הסביבה',
];

// ── CONFIRMATION PHASE (Phase 4) ──
export const DEFAULT_CONFIRMATION_ROWS = ['התארגנות'];

// ── VIEW / TAB NAMES ──
export const VIEW_CLIENTS = 'clients';
export const VIEW_DETAIL = 'detail';
export const VIEW_FORM = 'form';
export const VIEW_INBOX = 'inbox';
export const VIEW_SETTINGS = 'settings';
export const TAB_GENERAL = 'general';

// ── NOTIFICATION TYPES ──
export const NOTIF_TYPE_NEW_CLIENT_STALE = 'new_client_stale';
export const NOTIF_TYPE_ROW_REMINDER = 'row_reminder';

// ── REMINDER ──
export const REMINDER_DAYS_PRESETS = [1, 3, 7]; // preset options for the תזכורת column

// ── USER ROLES ──
export const ROLE_ADMIN = 'admin';
export const ROLE_MANAGER = 'manager';
export const ROLE_USER = 'user';

// ── SHARED FIELD GROUPS ──
// Land/property fields that live directly on the client row (single source of truth
// for the property info shown/edited from Licensing and Detailed tabs).
export const NUMERIC_LAND_FIELDS = ['gush', 'helka', 'migrash'];

// ── DATABASE TABLES ──
export const TABLE_CLIENTS = 'clients';
export const TABLE_PROFILES = 'profiles';
export const TABLE_ROW_REMINDERS = 'row_reminders';

// ── TIME / DELAYS ──
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;
export const DEBOUNCE_DELAY_MS = 400;
export const NOTIFICATION_REFRESH_MS = 60_000;

// ── NOTIFICATION CONFIG ──
// 'minutes' = 1 day → 1 minute (for testing). 'days' = production.
export const NOTIFICATION_DELAY_UNIT = 'days';

// ── FILE LINKS ──
export const FILE_LINK_1_PATH = 'file_link_1_path';
export const FILE_LINK_1_NAME = 'file_link_1_name';
export const FILE_LINK_2_PATH = 'file_link_2_path';
export const FILE_LINK_2_NAME = 'file_link_2_name';
export const FILE_LINK_LABEL_1 = 'הצעה';
export const FILE_LINK_LABEL_2 = 'מחיצה';

// ── ERROR CODES ──
export const SUPABASE_NO_ROWS = 'PGRST116';