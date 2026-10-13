import { supabase } from '../supabaseClient';
import { BUCKET_NOTIFICATION_FILES, BLOCKED_FILE_EXTENSIONS } from '../constants';

const EXT_BY_TYPE = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' };

// "משה כהן / 13.10" → safe file name part
const safeName = (s) => (s || '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[ch]));

export const fileExtension = (name) => {
  const m = /\.([^.]+)$/.exec(name || '');
  return m ? m[1].toLowerCase() : '';
};

export const isBlockedFile = (name) => BLOCKED_FILE_EXTENSIONS.includes(fileExtension(name));

// Short-lived link to a message attachment, made when it's needed.
export async function attachmentUrl(path) {
  const { data, error } = await supabase.storage.from(BUCKET_NOTIFICATION_FILES).createSignedUrl(path, 60);
  if (error) throw error;
  return data.signedUrl;
}

// Signed storage links are another origin, so <a download> on them would
// navigate instead of saving — fetch the bytes and save a local copy.
async function fetchBlob(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

function saveBlob(blob, fileName) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 60_000);
}

export async function downloadImage(url, baseName) {
  const blob = await fetchBlob(url);
  saveBlob(blob, `${safeName(baseName) || 'תמונה'}.${EXT_BY_TYPE[blob.type] || 'png'}`);
}

export async function downloadFile(url, fileName) {
  saveBlob(await fetchBlob(url), safeName(fileName) || 'קובץ');
}

// Opens a file in its default program (desktop app) or a new tab (browser),
// from where it can be read or printed.
export async function openFile(url, fileName) {
  if (isBlockedFile(fileName)) throw new Error('blocked file type');
  const blob = await fetchBlob(url);
  if (window.electronAPI?.openFileCopy) {
    const err = await window.electronAPI.openFileCopy(fileName, await blob.arrayBuffer());
    if (err) throw new Error(err);
    return;
  }
  const href = URL.createObjectURL(blob);
  window.open(href, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(href), 60_000);
}

// Prints just the picture (fit to one page) with an optional caption above
// it, from a hidden frame so the rest of the app isn't printed.
export async function printImage(url, captionLines = []) {
  const href = URL.createObjectURL(await fetchBlob(url));
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;left:-9999px';
  frame.srcdoc = `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>
    @page { margin: 12mm; }
    html, body { margin: 0; font-family: Heebo, 'Segoe UI', Arial, sans-serif; }
    .cap { margin: 0 0 4mm; font-size: 11pt; }
    .cap p { margin: 0 0 1mm; }
    img { display: block; max-width: 100%; max-height: 240mm; margin: 0 auto; object-fit: contain; }
  </style></head><body>
    ${captionLines.length ? `<div class="cap">${captionLines.map(l => `<p>${escapeHtml(l)}</p>`).join('')}</div>` : ''}
    <img src="${href}" alt="">
  </body></html>`;

  const cleanup = () => {
    frame.remove();
    URL.revokeObjectURL(href);
  };
  await new Promise((resolve, reject) => {
    frame.onload = () => {
      const img = frame.contentDocument.querySelector('img');
      if (img.complete) resolve();
      else { img.onload = resolve; img.onerror = reject; }
    };
    document.body.appendChild(frame);
  }).catch(err => { cleanup(); throw err; });

  frame.contentWindow.addEventListener('afterprint', () => setTimeout(cleanup, 0));
  frame.contentWindow.focus();
  frame.contentWindow.print();
  setTimeout(() => { if (frame.isConnected) cleanup(); }, 5 * 60_000); // in case afterprint never fires
}
