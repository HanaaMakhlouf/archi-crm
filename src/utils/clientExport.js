// The clients list's columns for the exported PDF — without עדיפות, the
// current stage, עדכון אחרון and תאריך יצירה.
export const EXPORT_COLUMNS = [
  { label: 'שם הלקוח', value: (c) => c.name },
  { label: 'סוג תיק', value: (c) => (c.client_type || []).join(', ') },
  { label: 'עיר', value: (c) => c.city },
  {
    label: 'גוש / חלקה',
    value: (c) => {
      const helka = c.helka && c.helka.length ? c.helka.join(', ') : '';
      return c.gush || helka ? `${c.gush || '—'} / ${helka || '—'}` : '';
    },
  },
  { label: "מס' בקשה", value: (c) => c.licensing_data?.application?.request_number },
];

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[ch]));

const p2 = (n) => String(n).padStart(2, '0');
const dateText = (d) => `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()}`;

// A printable page (right-to-left table, the header row repeats on every
// page) that becomes the PDF.
export function clientsToHtml(clients, { date = new Date(), columns = EXPORT_COLUMNS } = {}) {
  const head = columns.map(col => `<th>${escapeHtml(col.label)}</th>`).join('');
  const body = clients.map((c, i) => `<tr><td class="num">${i + 1}</td>${
    columns.map(col => `<td>${escapeHtml(col.value(c)) || '<span class="none">—</span>'}</td>`).join('')
  }</tr>`).join('');

  return `<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>רשימת לקוחות</title><style>
    @page { size: A4 landscape; margin: 12mm 10mm; }
    html, body { margin: 0; font-family: 'Segoe UI', Arial, sans-serif; color: #1c2a2a; }
    h1 { font-size: 17pt; margin: 0 0 1mm; }
    .meta { font-size: 9.5pt; color: #5b6b6b; margin: 0 0 5mm; }
    table { width: 100%; border-collapse: collapse; font-size: 10pt; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    th { background: #1f5f57; color: #fff; font-weight: 600; text-align: right; padding: 2.2mm 2mm; }
    td { padding: 1.8mm 2mm; border-bottom: 0.3mm solid #dfe5e4; vertical-align: top; }
    tbody tr:nth-child(even) td { background: #f4f7f6; }
    .num { color: #8a9898; width: 6mm; text-align: center; }
    th.num { color: #fff; }
    .none { color: #b3bdbd; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  </style></head><body>
    <h1>רשימת לקוחות</h1>
    <p class="meta">${clients.length} לקוחות · <bdi dir="ltr">${dateText(date)}</bdi></p>
    <table><thead><tr><th class="num">#</th>${head}</tr></thead><tbody>${body}</tbody></table>
  </body></html>`;
}

// "לקוחות 15-11-2026.pdf"
export function exportFileName(date = new Date()) {
  return `לקוחות ${p2(date.getDate())}-${p2(date.getMonth() + 1)}-${date.getFullYear()}.pdf`;
}

// Desktop app: saves a PDF (Save dialog) and opens it. Browser: the print
// dialog, where "Save as PDF" is one of the printers.
// Returns null when done or cancelled, or an error message.
export async function exportClientsPdf(clients) {
  const html = clientsToHtml(clients);
  if (window.electronAPI?.savePdf) {
    const r = await window.electronAPI.savePdf(html, exportFileName());
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
