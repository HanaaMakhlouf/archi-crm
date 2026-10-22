import { FILE_LINK_2_PATH } from '../constants';

// Opens a client's מחיצה folder in Explorer (desktop app only). When the folder
// was found at a new location, the corrected path is saved through onUpdate so
// the link fixes itself. Returns an error message, or null on success.
export async function openClientFolder(path, onUpdate) {
  const res = await window.electronAPI.openFolder(path);
  if (res?.path) {
    if (res.path !== path) onUpdate?.({ [FILE_LINK_2_PATH]: res.path });
    return null;
  }
  return res?.error === 'not_found' || !res?.error
    ? 'התיקייה לא נמצאה — ייתכן שהועברה או נמחקה'
    : 'לא ניתן לפתוח את התיקייה';
}
