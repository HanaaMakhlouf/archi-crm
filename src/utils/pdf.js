// Turns a printable page the app built into a PDF.
// Desktop app: a Save dialog, then the PDF opens. Browser: the print dialog,
// where "Save as PDF" is one of the printers.
// Returns null when done or cancelled, or an error message to show.
export async function savePdf(html, fileName) {
  if (window.electronAPI?.savePdf) {
    const r = await window.electronAPI.savePdf(html, fileName);
    if (!r?.error) return null;
    if (r.code === 'EBUSY' || r.code === 'EPERM') {
      return 'לא ניתן לשמור: קובץ בשם הזה פתוח כרגע בתוכנה אחרת.\nסגרו אותו ונסו שוב, או שמרו בשם אחר.';
    }
    return 'שגיאה ביצירת קובץ ה-PDF. נסה שוב.';
  }
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;left:-9999px';
  frame.srcdoc = html;
  await new Promise(resolve => { frame.onload = resolve; document.body.appendChild(frame); });
  const cleanup = () => frame.remove();
  frame.contentWindow.addEventListener('afterprint', () => setTimeout(cleanup, 0));
  frame.contentWindow.focus();
  frame.contentWindow.print();
  setTimeout(() => { if (frame.isConnected) cleanup(); }, 5 * 60_000);
  return null;
}

export const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[ch]));

const p2 = (n) => String(n).padStart(2, '0');
export const dateDots = (d) => `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()}`;
export const dateDashes = (d) => `${p2(d.getDate())}-${p2(d.getMonth() + 1)}-${d.getFullYear()}`;

// Windows file names can't hold \ / : * ? " < > |
export const safeFileName = (s) => String(s || '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
