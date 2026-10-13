// "12.10.2026, 14:32"
export const formatDateTime = (iso) => new Date(iso).toLocaleString('he-IL', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

// "dana@office.co.il" → "dana". No email = done outside the app
// (Supabase dashboard, script).
// "2026-10-12" (a date input's value) → start of that local day, shifted by
// `addDays`. For inclusive "to" filters use `< startOfDay(to, 1)`.
export const startOfDay = (dateStr, addDays = 0) => {
  const d = new Date(`${dateStr}T00:00`);
  d.setDate(d.getDate() + addDays);
  return d;
};

// 2_457_600 → "2.3MB"
export const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

export const nameFromEmail = (email) => (email ? email.split('@')[0] : 'מערכת');
