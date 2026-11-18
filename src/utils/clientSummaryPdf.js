import { buildClientSummary } from './clientSummary';
import { savePdf, escapeHtml as e, dateDots, dateDashes, safeFileName } from './pdf';

// The client summary as a printable page: black on white, laid out like the
// client's page — each case type, its stages, and status tables (step ·
// status · note). Empty fields aren't shown (see clientSummary.js).

const hasText = (v) => v !== null && v !== undefined && String(v).trim() !== '';
const heading = (title) => (title ? `<h3>${e(title)}</h3>` : '');

// The note column only when some row in the table has a note.
const renderTable = (b) => {
  const withNotes = b.rows.some(r => hasText(r.note));
  const head = b.headers
    ? `<thead><tr><th>${e(b.headers[0])}</th><th>${e(b.headers[1])}</th>${withNotes ? `<th>${e(b.headers[2])}</th>` : ''}</tr></thead>`
    : '';
  // One-row sections (הגשה, הכנה...) are named by their row already.
  const title = b.rows.length === 1 && b.rows[0].label === b.title ? null : b.title;
  return `
  <section>
    ${heading(title)}
    <table class="steps">${head}
      <tbody>${b.rows.map(r => `<tr>
        <td class="step">${e(r.label)}</td>
        <td class="status">${e(r.status?.label || '')}</td>
        ${withNotes ? `<td class="note">${hasText(r.note) ? e(r.note) : ''}</td>` : ''}
      </tr>`).join('')}</tbody>
    </table>
  </section>`;
};

const renderFields = (b) => `
  <section>
    ${heading(b.title)}
    <dl class="fields">${b.fields.map(f => `<dt>${e(f.label)}</dt><dd>${e(f.value)}</dd>`).join('')}</dl>
  </section>`;

const renderPeople = (b) => `
  <section>
    ${heading(b.title)}
    <table class="people"><thead><tr>${b.headers.map(h => `<th>${e(h)}</th>`).join('')}</tr></thead>
      <tbody>${b.rows.map(r => `<tr>${r.map(v => `<td>${e(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>
  </section>`;

const renderText = (b) => `
  <section>
    ${heading(b.title)}
    <p class="text">${e(b.text)}</p>
  </section>`;

const renderBlock = (b) => {
  switch (b.kind) {
    case 'table': return renderTable(b);
    case 'fields': return renderFields(b);
    case 'people': return renderPeople(b);
    case 'text': return renderText(b);
    case 'notice': return renderText(b);
    case 'phase': return `<h2 class="phase-title">שלב: ${e(b.title)}</h2>`;
    default: return '';
  }
};

// A stage's heading stays on the same page as its first section.
const renderBlocks = (blocks) => blocks.map((b, i) => {
  if (b.kind === 'phase') return '';
  const html = renderBlock(b);
  return blocks[i - 1]?.kind === 'phase' ? `<div class="keep">${renderBlock(blocks[i - 1])}${html}</div>` : html;
}).join('');

// The path, in words: מידע ✓ ‹ בקשה (נוכחי) ‹ תנאים
const renderStepper = (steps) => `
  <p class="path">${steps.map(s => {
    if (s.state === 'done') return `<span>${e(s.label)} ✓</span>`;
    if (s.state === 'current') return `<strong>${e(s.label)} (נוכחי)</strong>`;
    return `<span class="later">${e(s.label)}</span>`;
  }).join('<span class="sep">‹</span>')}</p>`;

const renderTab = (t) => `
  <div class="tab">
    <div class="tab-head">
      <h2 class="tab-title">${e(t.title)}</h2>
      ${t.current ? `<span class="current">שלב נוכחי: <strong>${e(t.current)}</strong></span>` : ''}
    </div>
    ${t.stepper ? renderStepper(t.stepper) : ''}
    ${renderBlocks(t.blocks)}
  </div>`;

const CSS = `
  @page { size: A4; margin: 14mm 13mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #fff; color: #000; font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; line-height: 1.4; }
  header { border-bottom: 1.5pt solid #000; padding-bottom: 6px; margin-bottom: 10px; }
  .eyebrow { font-size: 9pt; margin: 0 0 2px; }
  h1 { font-size: 18pt; margin: 0; }
  .types { margin: 2px 0 0; font-size: 10pt; }
  .tab { margin-top: 16px; }
  .tab + .tab { break-before: page; margin-top: 0; }
  .tab-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px;
              border-bottom: 1pt solid #000; padding-bottom: 3px; margin-bottom: 6px; }
  .tab-title { font-size: 14pt; margin: 0; }
  .current { font-size: 10pt; }
  .path { margin: 0 0 8px; font-size: 10pt; }
  .path .sep { margin: 0 8px; }
  .path .later { color: #555; }
  .phase-title { font-size: 11.5pt; margin: 14px 0 4px; }
  .keep { break-inside: avoid; }
  section { margin: 0 0 10px; break-inside: avoid; }
  h3 { font-size: 10.5pt; margin: 0 0 3px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: right; font-size: 9pt; font-weight: 600; padding: 2px 6px 3px; border-bottom: 0.75pt solid #000; }
  td { text-align: right; padding: 4px 6px; border-bottom: 0.5pt solid #bbb; vertical-align: top; }
  th:first-child, td:first-child { padding-inline-start: 0; }
  .steps td.step { width: 34%; }
  .steps td.status { width: 24%; font-weight: 600; }
  .fields { display: grid; grid-template-columns: max-content 1fr; gap: 2px 16px; margin: 0; }
  .fields dt { font-weight: 600; }
  .fields dd { margin: 0; }
  .text { margin: 0; white-space: pre-wrap; }
`;

export function clientSummaryToHtml(client, date = new Date()) {
  const s = buildClientSummary(client);
  return `<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>${e(s.name)} - סיכום תיק</title>
  <style>${CSS}</style></head><body>
    <header>
      <p class="eyebrow">סיכום תיק · <bdi dir="ltr">${dateDots(date)}</bdi></p>
      <h1>${e(s.name)}</h1>
      ${s.types.length ? `<p class="types">${s.types.map(e).join(' · ')}</p>` : ''}
    </header>
    ${s.general ? renderFields(s.general) : ''}
    ${s.tabs.map(renderTab).join('')}
  </body></html>`;
}

// "סיכום תיק - משה כהן 15-11-2026.pdf"
export const summaryFileName = (client, date = new Date()) =>
  `סיכום תיק - ${safeFileName(client.name) || 'לקוח'} ${dateDashes(date)}.pdf`;

export const exportClientSummaryPdf = (client) => savePdf(clientSummaryToHtml(client), summaryFileName(client));
