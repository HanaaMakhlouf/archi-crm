// ── CLIENT LABELS ──

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
//   architecture_required: boolean,          // אדריכלות part toggle (default true)
//   tables: {
//     // אדריכלות
//     offer:          { status, notes },
//     visualization:  { status, notes },
//     work_plan:      { status, notes },     // was the free-text work_plan_notes
//     disciplines: {
//       water:        { status, notes },
//       electricity:  { status, notes },
//       construction: { status, notes },     // legacy, no longer shown
//     },
//     architecture_extra: [{ id, label, status, notes }],
//     // קונסטרוקציה
//     construction: {
//       survey:    { status, notes },        // מדידה בשטח (מבנים קיימים)
//       placement: { status, notes },        // העמדה
//       work_plans: { status, notes },       // תוכניות עבודה (adds 'schematic' = סכימתי)
//       extra:     [{ id, label, status, notes }],
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

// רישוי → תנאים rows: the document statuses plus נשלח (sent, waiting for an answer).
export const CONDITION_ROW_STATUS_SENT = 'sent';
export const CONDITION_ROW_STATUS_OPTIONS = [
  { value: DOC_STATUS_MISSING, label: 'חסר' },
  { value: CONDITION_ROW_STATUS_SENT, label: 'נשלח' },
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

// The reminder (in days) each status sets automatically; התקבל clears it.
export const ONLINE_INFO_REMINDER_DAYS = {
  [ONLINE_INFO_NOT_SENT]: 1,
  [ONLINE_INFO_SENT]: 5,
  [ONLINE_INFO_PASSED]: 30,
};

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
export const ESTATE_NOTICE_STATUS_OPTIONS = [
  { value: TEXT_STATUS_PREPARING, label: 'הפקת נוסח' },
  { value: ACTION_STATUS_SENT, label: 'נשלח' },
  { value: TEXT_STATUS_RECEIVED, label: 'התקבל' },
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

export const CONDITION_HASHBACHA = 'השבחה';
export const CONDITION_CORP = 'התייחסות תאגיד';
export const CONDITION_CORP_145D = '145 ד תאגיד';
export const CONDITION_HAGA = 'הג״א';
export const CONDITION_TRANSPORT = 'התייחסות לנספח תחבורה';
export const CONDITION_CONTROL_INSTITUTE = 'מכון בקרה';

export const DEFAULT_CONDITION_ROWS = [
  CONDITION_HASHBACHA, CONDITION_CORP, CONDITION_CORP_145D, 'עירייה', CONDITION_HAGA, 'בטון',
  'פסולת', 'סטטי/תצהיר',
];

// Old row names → current ones (existing clients are renamed when loaded).
// Reminders are keyed by row name — see the matching SQL migration.
export const RENAMED_CONDITION_ROWS = {
  'פטור 140': CONDITION_HASHBACHA,
  'תאגיד': CONDITION_CORP,
  'תחבורה': CONDITION_TRANSPORT,
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
export const isConditionRowDone = (row) => CONDITION_DONE_STATUSES.includes(row.status);

// ── CONFIRMATION PHASE (Phase 4) ──
export const DEFAULT_CONFIRMATION_ROWS = ['התארגנות'];

// ── VIEW / TAB NAMES ──
export const VIEW_CLIENTS = 'clients';
export const VIEW_DETAIL = 'detail';
export const VIEW_FORM = 'form';
export const VIEW_INBOX = 'inbox';
export const VIEW_SETTINGS = 'settings';
export const VIEW_ACTIVITY = 'activity';
export const VIEW_ARCHIVE = 'archive';

// A closed client file keeps all its data; clients.archived_at holds when it
// was closed (null = open). Closed files leave the clients list, stats and
// reminders, and live under ארכיון until reactivated.
export const FIELD_ARCHIVED_AT = 'archived_at';
export const TAB_GENERAL = 'general';
export const TAB_ACTIVITY = 'activity';

// ── CLIENT ACTIVITY LOG ── (see supabase/migrations/*_client_activity.sql)
// created/updated/deleted are written by a DB trigger; the rest are added by hand.
export const ACTIVITY_CREATED = 'created';
export const ACTIVITY_UPDATED = 'updated';
export const ACTIVITY_DELETED = 'deleted';
export const ACTIVITY_NOTE = 'note';
export const ACTIVITY_CALL = 'call';
export const ACTIVITY_MEETING = 'meeting';
export const ACTIVITY_SITE_VISIT = 'site_visit';
export const ACTIVITY_EMAIL = 'email';
export const AUTO_ACTIVITY_TYPES = [ACTIVITY_CREATED, ACTIVITY_UPDATED, ACTIVITY_DELETED];
export const MANUAL_ACTIVITY_OPTIONS = [
  { value: ACTIVITY_CALL, label: 'שיחה', icon: 'phone' },
  { value: ACTIVITY_MEETING, label: 'פגישה', icon: 'users' },
  { value: ACTIVITY_SITE_VISIT, label: 'ביקור בשטח', icon: 'mapPin' },
  { value: ACTIVITY_EMAIL, label: 'מייל / מסמכים', icon: 'mail' },
  { value: ACTIVITY_NOTE, label: 'הערה', icon: 'note' },
];
export const ACTIVITY_META = {
  [ACTIVITY_CREATED]: { label: 'לקוח נוצר', icon: 'plus' },
  [ACTIVITY_UPDATED]: { label: 'עדכון', icon: 'edit' },
  [ACTIVITY_DELETED]: { label: 'לקוח נמחק', icon: 'trash' },
  ...Object.fromEntries(MANUAL_ACTIVITY_OPTIONS.map(o => [o.value, o])),
};
export const ACTIVITY_PAGE_SIZE = 50;

// ── NOTIFICATION TYPES ──
export const NOTIF_TYPE_ROW_REMINDER = 'row_reminder';

// ── NOTIFICATION MESSAGES ── (manager → employee; see supabase/migrations/*_notification_messages.sql)
export const MESSAGES_HISTORY_DAYS = 60; // older messages drop out of the inbox
export const MESSAGE_IMAGE_MAX_MB = 5;   // matches the storage bucket's file_size_limit
export const MESSAGE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
export const MESSAGE_FILE_MAX_MB = 20; // matches the notification-files bucket's file_size_limit
export const MESSAGE_MAX_FILES = 5;
// Program/script files are never sent — they'd run when opened.
export const BLOCKED_FILE_EXTENSIONS = ['exe', 'msi', 'bat', 'cmd', 'com', 'scr', 'ps1', 'vbs', 'js', 'jar', 'lnk', 'reg', 'hta'];

// ── REMINDER ──
export const REMINDER_DAYS_PRESETS = [1, 3, 7]; // preset options for the תזכורת column

// ── USER ROLES ──
export const ROLE_ADMIN = 'admin';
export const ROLE_MANAGER = 'manager';
export const ROLE_USER = 'user';
export const ROLE_VIEWER = 'viewer'; // read-only: can view everything, cannot edit or add users
export const ROLE_LABELS = { [ROLE_USER]: 'עובד', [ROLE_VIEWER]: 'צופה', [ROLE_MANAGER]: 'מנהל', [ROLE_ADMIN]: 'אדמין' };

// ── BRANDING ── (change per customer when white-labeling the product)
export const BRAND_NAME = 'משרד פלוס';
export const BRAND_TAGLINE = 'ניהול משרד פשוט וברור';

// ── CLIENT PRIORITY ── (managers/admins only — see App.js)
export const PRIORITY_GREEN = 'green';
export const PRIORITY_YELLOW = 'yellow';
export const PRIORITY_ORANGE = 'orange';
export const PRIORITY_RED = 'red';
export const PRIORITY_OPTIONS = [
  { value: PRIORITY_GREEN,  label: 'נמוכה',  color: '#2e7d32' },
  { value: PRIORITY_YELLOW, label: 'בינונית', color: '#fbc02d' },
  { value: PRIORITY_ORANGE, label: 'גבוהה',  color: '#ef6c00' },
  { value: PRIORITY_RED,    label: 'דחופה',  color: '#c62828' },
];

// ── SHARED FIELD GROUPS ──
// Land/property fields that live directly on the client row (single source of truth
// for the property info shown/edited from Licensing and Detailed tabs).
export const NUMERIC_LAND_FIELDS = ['gush'];
// migrash (plot) allows letter suffixes like "6א" — kept as text, not numeric.
// helka is a list of positive integers (a client can have several) — handled separately.

// ── DATABASE TABLES ──
export const TABLE_CLIENTS = 'clients';
export const TABLE_PROFILES = 'profiles';
export const TABLE_ROW_REMINDERS = 'row_reminders';
export const TABLE_CLIENT_ACTIVITY = 'client_activity';
export const TABLE_NOTIFICATION_MESSAGES = 'notification_messages';
export const BUCKET_NOTIFICATION_IMAGES = 'notification-images';
export const BUCKET_NOTIFICATION_FILES = 'notification-files';

// ── TIME / DELAYS ──
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;
export const DEBOUNCE_DELAY_MS = 400;
export const TEXT_SAVE_IDLE_MS = 5000; // typed text saves on blur, or after this long without typing
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