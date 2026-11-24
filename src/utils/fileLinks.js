// What a client's saved file link is (a folder path, a web link, an Office
// file, a folder picked in the browser) and how to show or open it.

export function stripQuotes(str) {
  return str.replace(/^"|"$/g, '').trim();
}

export function isWebUrl(raw) {
  return /^https?:\/\/.+/i.test(raw.trim());
}

// A folder picked in the browser: only its name is known ("folder:<name>").
export function isFolderLink(raw) { return raw?.startsWith('folder:'); }
export function getFolderName(raw) { return raw?.replace('folder:', '') || ''; }

export function isAbsoluteFolderPath(raw) {
  if (!raw) return false;
  if (isWebUrl(raw)) return false;
  if (raw.startsWith('folder:')) return false;
  // Has a file extension → it's a file, not a folder
  if (/\.(docx?|xlsx?|pptx?)$/i.test(raw)) return false;
  // Looks like an absolute path (Windows C:\, network \\Server\share, or Unix /)
  return /^([a-zA-Z]:[\\/]|\\\\[^\\]|\/)/.test(raw);
}

export function getPathBasename(p) {
  return p.split(/[\\/]/).filter(Boolean).pop() || p;
}

function getExt(path) {
  return (path.split('.').pop() || '').toLowerCase();
}

// How a web link or an Office file opens, in words.
export function getFileBadge(raw) {
  const val = stripQuotes(raw);
  if (isWebUrl(val)) return { label: 'קישור — נפתח בדפדפן', color: 'primary' };
  const ext = getExt(val);
  if (['docx', 'doc'].includes(ext)) return { label: 'Word — נפתח ב-Word', color: 'success' };
  if (['xlsx', 'xls'].includes(ext)) return { label: 'Excel — נפתח ב-Excel', color: 'success' };
  if (['pptx', 'ppt'].includes(ext)) return { label: 'PowerPoint — נפתח ב-PowerPoint', color: 'success' };
  return { label: 'קובץ Office', color: 'success' };
}

// The address that opens it: the web link itself, or an Office protocol link
// (ms-word: / ms-excel: / ms-powerpoint:) for a local file.
export function buildUri(raw) {
  const val = stripQuotes(raw);
  if (isWebUrl(val)) return val;
  const path = val.replace(/\\/g, '/');
  const ext = getExt(path);
  if (['docx', 'doc'].includes(ext)) return `ms-word:ofe|u|file:///${path}`;
  if (['xlsx', 'xls'].includes(ext)) return `ms-excel:ofe|u|file:///${path}`;
  if (['pptx', 'ppt'].includes(ext)) return `ms-powerpoint:ofe|u|file:///${path}`;
  return `ms-word:ofe|u|file:///${path}`;
}
