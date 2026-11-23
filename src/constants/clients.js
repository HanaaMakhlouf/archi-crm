// The client record: its types, closed files, priority, land fields and folder links.
// ── CLIENT TYPES ──
export const TYPE_PLANNING = 'תכנון';
export const TYPE_LICENSING = 'רישוי';
export const TYPE_DETAILED = 'מפורטת';
export const CLIENT_TYPES = [TYPE_LICENSING, TYPE_PLANNING, TYPE_DETAILED];

// A closed client file keeps all its data; clients.archived_at holds when it
// was closed (null = open). Closed files leave the clients list, stats and
// reminders, and live under ארכיון until reactivated.
export const FIELD_ARCHIVED_AT = 'archived_at';

// ── CLIENT PRIORITY ── (managers/admins only)
export const PRIORITY_GREEN = 'green';
export const PRIORITY_YELLOW = 'yellow';
export const PRIORITY_ORANGE = 'orange'; // גבוהה — no longer offered; reads as בינונית
export const PRIORITY_RED = 'red';
export const PRIORITY_ON_HOLD = 'on_hold';
export const PRIORITY_OPTIONS = [
  { value: PRIORITY_GREEN,   label: 'נמוכה',  color: '#2e7d32' },
  { value: PRIORITY_YELLOW,  label: 'בינונית', color: '#fbc02d' },
  { value: PRIORITY_RED,     label: 'דחופה',  color: '#c62828' },
  { value: PRIORITY_ON_HOLD, label: 'מושהה',  color: '#9e9e9e' },
];
// Clients saved as גבוהה show and sort as בינונית.
export const priorityOf = (value) => (value === PRIORITY_ORANGE ? PRIORITY_YELLOW : value);
// Kept so the change history still reads old values in Hebrew.
export const PRIORITY_OLD_OPTIONS = [{ value: PRIORITY_ORANGE, label: 'גבוהה' }];

// ── SHARED FIELD GROUPS ──
// Land/property fields that live directly on the client row (single source of truth
// for the property info shown/edited from Licensing and Detailed tabs).
export const NUMERIC_LAND_FIELDS = ['gush'];
// migrash (plot) allows letter suffixes like "6א" — kept as text, not numeric.
// helka is a list of positive integers (a client can have several) — handled separately.

// ── FILE LINKS ──
export const FILE_LINK_1_PATH = 'file_link_1_path';
export const FILE_LINK_1_NAME = 'file_link_1_name';
export const FILE_LINK_2_PATH = 'file_link_2_path';
export const FILE_LINK_2_NAME = 'file_link_2_name';
export const FILE_LINK_LABEL_1 = 'הצעה';
export const FILE_LINK_LABEL_2 = 'מחיצה';
