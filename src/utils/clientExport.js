import { savePdf, escapeHtml, dateDots, dateDashes } from './pdf';

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
    <p class="meta">${clients.length} לקוחות · <bdi dir="ltr">${dateDots(date)}</bdi></p>
    <table><thead><tr><th class="num">#</th>${head}</tr></thead><tbody>${body}</tbody></table>
  </body></html>`;
}

// "לקוחות 15-11-2026.pdf"
export function exportFileName(date = new Date()) {
  return `לקוחות ${dateDashes(date)}.pdf`;
}

// Returns null when done or cancelled, or an error message.
export const exportClientsPdf = (clients) => savePdf(clientsToHtml(clients), exportFileName());
