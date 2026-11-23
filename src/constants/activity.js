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
