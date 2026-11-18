import nodeCrypto from 'crypto';
import { buildClientSummary } from './clientSummary';
import { clientSummaryToHtml, summaryFileName } from './clientSummaryPdf';
import {
  TYPE_LICENSING, TYPE_DETAILED, TYPE_PLANNING,
  ONLINE_INFO_RECEIVED, DOC_STATUS_PRESENT,
  DETAILED_HACHANA_KEN, DETAILED_SHUBATS, DETAILED_LO_NISHLACH,
} from '../constants';

if (!global.crypto?.randomUUID) global.crypto = nodeCrypto.webcrypto; // new requester rows get an id

const titles = (tab) => tab.blocks.map(b => b.title || (b.kind === 'phase' ? `שלב ${b.title}` : b.kind));

test('licensing: shows every phase up to the current one, nothing after', () => {
  const client = {
    name: 'משה', client_type: [TYPE_LICENSING],
    licensing_data: {
      info: {
        documents: ['site_image', 'info_fee', 'signed_map', 'mapi_approval'].map(type => ({ type, status: DOC_STATUS_PRESENT, note: '' })),
        online_info_status: ONLINE_INFO_RECEIVED, online_info_number: '123',
      },
      application: { request_number: '2026-7' },
    },
  };
  const [tab] = buildClientSummary(client).tabs;
  expect(tab.current).toBe('בקשה');
  expect(tab.stepper.map(s => s.state)).toEqual(['done', 'current', 'todo']);
  const phases = tab.blocks.filter(b => b.kind === 'phase').map(b => b.title);
  expect(phases).toEqual(['מידע', 'בקשה']);
  expect(titles(tab)).toContain('פעולות'); // unlocked once מידע לזמין התקבל
  expect(titles(tab)).not.toContain('ישיבה'); // still waiting on the actions
  expect(titles(tab)).not.toContain('תנאים');

  const online = tab.blocks.find(b => b.kind === 'table' && b.rows[0]?.label === 'בקשת מידע לזמין');
  expect(online.rows[0].status).toEqual({ label: expect.any(String), color: 'green' });
  expect(online.rows[0].note).toContain('123');
});

test('licensing: a new client stops at מידע, before בקשת מידע לזמין opens', () => {
  const [tab] = buildClientSummary({ name: 'א', client_type: [TYPE_LICENSING] }).tabs;
  expect(tab.blocks.filter(b => b.kind === 'phase').map(b => b.title)).toEqual(['מידע']);
  const docs = tab.blocks.find(b => b.title === 'מסמכים נדרשים');
  expect(docs.rows).toHaveLength(4);
  expect(docs.rows[0].status.color).toBe('red'); // חסר
  expect(tab.blocks.some(b => b.rows?.[0]?.label === 'בקשת מידע לזמין')).toBe(false);
});

test('detailed: each step shows only once the one before it is done', () => {
  const client = {
    name: 'ב', client_type: [TYPE_DETAILED],
    detailed_data: {
      hachana: { status: DETAILED_HACHANA_KEN, note: 'הוכן' },
      hafkada: { status: DETAILED_SHUBATS },
      pirsum_a: { status: DETAILED_LO_NISHLACH },
    },
  };
  const [tab] = buildClientSummary(client).tabs;
  const steps = tab.blocks.filter(b => b.kind === 'table').map(b => b.title);
  expect(steps).toEqual(['הכנה', 'הפקדה', 'פירסום']);
  expect(tab.current).toBe('פירסום');
  expect(tab.blocks.find(b => b.title === 'הכנה').rows[0]).toMatchObject({ note: 'הוכן', status: { label: 'כן', color: 'green' } });
});

test('tabs follow the app order and the PDF escapes client text', () => {
  const client = { name: '<b>ג & ד</b>', client_type: [TYPE_PLANNING, TYPE_LICENSING] };
  expect(buildClientSummary(client).tabs.map(t => t.title)).toEqual([TYPE_LICENSING, TYPE_PLANNING]);
  const html = clientSummaryToHtml(client, new Date(2026, 10, 15));
  expect(html).toContain('&lt;b&gt;ג &amp; ד&lt;/b&gt;');
  expect(html).not.toContain('<b>ג');
  expect(html).toContain('15.11.2026');
  expect(summaryFileName({ name: 'משה / כהן' }, new Date(2026, 10, 5))).toBe('סיכום תיק - משה כהן 05-11-2026.pdf');
});

test('empty fields, people columns and texts are left out', () => {
  const client = {
    name: 'ה', phone: '050', email: '', city: 'חיפה', notes: '', client_type: [TYPE_LICENSING],
    licensing_data: { info: {
      requesters: [{ id: 'a', name: 'דנה', surname: '', id_number: '', phone: '052', email: '' }],
      rights_holders: [{ id: 'b', name: '', surname: '', id_number: '', phone: '', email: '' }],
      description: '  ',
    } },
  };
  const s = buildClientSummary(client);
  expect(s.general.fields.map(f => f.label)).toEqual(['טלפון', 'עיר']);
  const [tab] = s.tabs;
  const requesters = tab.blocks.find(b => b.title === 'פרטי מבקש');
  expect(requesters.headers).toEqual(['שם', 'טלפון']);
  expect(requesters.rows).toEqual([['דנה', '052']]);
  expect(tab.blocks.some(b => b.title === 'בעלי זכות')).toBe(false);
  expect(tab.blocks.some(b => b.title === 'מהות בקשה')).toBe(false);
  expect(tab.blocks.find(b => b.title === 'פרטי קרקע').fields).toEqual([{ label: 'עיר', value: 'חיפה' }]);
});
