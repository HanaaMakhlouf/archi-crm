import { clientsToHtml, exportFileName } from './clientExport';

test('leaves out priority, last update and created date', () => {
  const html = clientsToHtml([{
    name: 'משה כהן', city: 'חיפה', gush: 123, helka: [4], priority: 'red',
    last_updated_at: '2026-01-01T00:00:00Z', created_at: '2025-01-01T00:00:00Z',
  }], { date: new Date(2026, 10, 15) });
  ['שם הלקוח', 'סוג תיק', 'עיר', 'גוש / חלקה', "מס' בקשה"]
    .forEach(label => expect(html).toContain(`<th>${label.replace("'", '&#39;')}</th>`));
  expect(html).toContain('<td>משה כהן</td>');
  expect(html).toContain('<td>123 / 4</td>');
  expect(html).not.toMatch(/עדיפות|שלב|עדכון אחרון|תאריך יצירה|2025|red/);
  expect(html).toContain('15.11.2026');
});

test('escapes client text', () => {
  const html = clientsToHtml([{ name: '<b>א & ב</b>' }]);
  expect(html).toContain('&lt;b&gt;א &amp; ב&lt;/b&gt;');
  expect(html).not.toContain('<b>א');
});

test('file name carries the date', () => {
  expect(exportFileName(new Date(2026, 10, 5))).toBe('לקוחות 05-11-2026.pdf');
});
