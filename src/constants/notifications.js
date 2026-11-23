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

// ── NOTIFICATION CONFIG ──
// 'minutes' = 1 day → 1 minute (for testing). 'days' = production.
export const NOTIFICATION_DELAY_UNIT = 'days';
