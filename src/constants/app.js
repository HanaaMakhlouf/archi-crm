// App-wide names: pages, roles, branding, database tables, timings.
// ── VIEW / TAB NAMES ──
export const VIEW_CLIENTS = 'clients';
export const VIEW_DETAIL = 'detail';
export const VIEW_FORM = 'form';
export const VIEW_INBOX = 'inbox';
export const VIEW_SETTINGS = 'settings';
export const VIEW_ACTIVITY = 'activity';
export const VIEW_ARCHIVE = 'archive';
export const TAB_GENERAL = 'general';
export const TAB_ACTIVITY = 'activity';

// ── USER ROLES ──
export const ROLE_ADMIN = 'admin';
export const ROLE_MANAGER = 'manager';
export const ROLE_USER = 'user';
export const ROLE_VIEWER = 'viewer'; // read-only: can view everything, cannot edit or add users
export const ROLE_LABELS = { [ROLE_USER]: 'עובד', [ROLE_VIEWER]: 'צופה', [ROLE_MANAGER]: 'מנהל', [ROLE_ADMIN]: 'אדמין' };

// ── BRANDING ── (change per customer when white-labeling the product)
export const BRAND_NAME = 'משרד פלוס';
export const BRAND_TAGLINE = 'ניהול משרד פשוט וברור';

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

// ── ERROR CODES ──
export const SUPABASE_NO_ROWS = 'PGRST116';
