import {
  DOC_STATUS_OPTIONS, INFO_NOTE_OPTIONS, SUBMISSION_OPTIONS, ACTION_STATUS_OPTIONS,
  MEETING_OPTIONS, CONDITIONS_STATUS_OPTIONS, PERMIT_STATUS_OPTIONS, PRIORITY_OPTIONS,
} from '../constants';
import { OFFER_OPTIONS, DISCIPLINE_OPTIONS } from '../components/PlanningTab';
import { HACHANA_OPTIONS, HAFKADA_ISHUR_OPTIONS, PIRSOOM_OPTIONS } from '../components/DetailedTab';

// Hebrew names for the fields/sections that can show up in a change summary.
// Falls back to the raw key when a field isn't listed here — still readable,
// just not translated.
const FIELD_LABELS = {
  label: 'סטטוס לקוח', priority: 'עדיפות', notes: 'הערות', note: 'הערה',
  status: 'סטטוס', client_type: 'סוג לקוח', name: 'שם', phone: 'טלפון',
  city: 'עיר', email: 'אימייל', gush: 'גוש', helka: 'חלקה', migrash: 'מגרש',
  planning_data: 'תכנון', licensing_data: 'רישוי', detailed_data: 'תיק מפורט',
  type_attributes: 'פרטי סוג',
  // planning_data sections
  offer: 'הצעה', visualization: 'הדמיה', disciplines: 'תחומים',
  construction: 'קונסטרוקציה', water: 'מים', electricity: 'חשמל',
  client_requirements: 'דרישות לקוח', work_plan_notes: 'תוכנית עבודה',
  // licensing_data sections
  info: 'מידע', application: 'בקשה', conditions: 'תנאים', confirmation: 'אישור התחלת עבודה',
  requesters: 'מבקשים', rights_holders: 'בעלי זכויות', documents: 'מסמכים',
  description: 'מהות הבקשה', info_note_status: 'הודעת מידע', info_note_note: 'הערת מידע',
  conditions_passed: 'עמידה בתנאים', conditions_note: 'הערת תנאים',
  submission: 'הגשה', actions: 'פעולות', meeting: 'ישיבה',
  rows: 'שורות', permit_status: 'סטטוס היתר', permit_note: 'הערת היתר',
  needs_start_approval: 'נדרש אישור תחילת עבודה',
  // detailed_data sections
  hachana: 'הכנה', hafkada: 'הפקדה', pirsum_a: 'פרסום א׳', ishur: 'אישור', pirsum_b: 'פרסום ב׳',
};

// Keys whose value is free text — show a short preview instead of trying to
// translate it as a status code.
const FREE_TEXT_KEYS = new Set([
  'notes', 'note', 'description', 'client_requirements', 'work_plan_notes',
  'permit_note', 'conditions_note', 'info_note_note',
]);

// Merged value→label lookup across every status/option list in the app, so a
// raw code like 'ready' or 'sent' shows its Hebrew label instead of the code.
const STATUS_LABELS = {};
[
  DOC_STATUS_OPTIONS, INFO_NOTE_OPTIONS, SUBMISSION_OPTIONS, ACTION_STATUS_OPTIONS,
  MEETING_OPTIONS, CONDITIONS_STATUS_OPTIONS, PERMIT_STATUS_OPTIONS, PRIORITY_OPTIONS,
  OFFER_OPTIONS, DISCIPLINE_OPTIONS, HACHANA_OPTIONS, HAFKADA_ISHUR_OPTIONS, PIRSOOM_OPTIONS,
].forEach(list => (list || []).forEach(o => {
  if (o && o.value !== undefined && o.value !== '') STATUS_LABELS[o.value] = o.label;
}));

const truncate = (s, n) => (s.length > n ? `${s.slice(0, n)}…` : s);

const valueToText = (v) => {
  if (v === null || v === undefined || v === '') return '(ריק)';
  if (Array.isArray(v)) return v.length ? v.join(', ') : '(ריק)';
  if (typeof v === 'boolean') return v ? 'כן' : 'לא';
  if (typeof v === 'object') return 'עודכן'; // shouldn't normally happen (leaf should be a scalar) — safe fallback
  return STATUS_LABELS[v] ?? String(v);
};

const isPlainObject = (x) => x && typeof x === 'object' && !Array.isArray(x);
const jsonEq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Walks two (assumed similarly-shaped) values to find one leaf that differs,
// so the summary can point at the specific thing that changed rather than
// just saying "planning_data updated". Not exhaustive — stops at the first
// difference found, which is enough for a "last change" summary.
function findChangedLeaf(oldVal, newVal, path = []) {
  if (oldVal === newVal) return null;

  if (isPlainObject(oldVal) && isPlainObject(newVal)) {
    for (const key of Object.keys(newVal)) {
      const found = findChangedLeaf(oldVal?.[key], newVal[key], [...path, key]);
      if (found) return found;
    }
    return null;
  }

  if (Array.isArray(oldVal) && Array.isArray(newVal) && oldVal.length === newVal.length) {
    for (let i = 0; i < newVal.length; i++) {
      const rowKey = newVal[i]?.label || newVal[i]?.type || i;
      const found = findChangedLeaf(oldVal[i], newVal[i], [...path, rowKey]);
      if (found) return found;
    }
    return jsonEq(oldVal, newVal) ? null : { path, value: newVal };
  }

  return jsonEq(oldVal, newVal) ? null : { path, value: newVal };
}

function describeLeaf(sectionLabel, leaf) {
  const { path, value } = leaf;
  const leafKey = path[path.length - 1];
  const rowLabel = path.length >= 2 && typeof path[path.length - 2] === 'string'
    ? (FIELD_LABELS[path[path.length - 2]] || path[path.length - 2])
    : null;
  const fieldLabel = FIELD_LABELS[leafKey] || leafKey;
  const displayVal = FREE_TEXT_KEYS.has(leafKey) ? truncate(valueToText(value), 40) : valueToText(value);
  const detail = rowLabel && rowLabel !== fieldLabel ? `${rowLabel} - ${fieldLabel}: ${displayVal}` : `${fieldLabel}: ${displayVal}`;
  return `${sectionLabel} · ${detail}`;
}

// Builds a short Hebrew "what changed" summary from a partial update patch
// (e.g. { priority: 'red' } or { planning_data: {...} }) compared against
// the client row before the update. Returns null when there's nothing to
// diff against (new client) or nothing actually changed.
export function describeClientChange(updates, previousClient) {
  if (!previousClient) return null;

  const parts = [];
  for (const key of Object.keys(updates)) {
    const newVal = updates[key];
    const oldVal = previousClient[key];
    const sectionLabel = FIELD_LABELS[key] || key;

    if (key === 'planning_data' || key === 'licensing_data' || key === 'detailed_data') {
      const leaf = findChangedLeaf(oldVal, newVal);
      if (leaf) parts.push(describeLeaf(sectionLabel, leaf));
      continue;
    }

    if (jsonEq(oldVal, newVal)) continue;
    const displayVal = FREE_TEXT_KEYS.has(key) ? truncate(valueToText(newVal), 40) : valueToText(newVal);
    parts.push(`${sectionLabel}: ${displayVal}`);
  }

  return parts.length ? parts.join(' · ') : null;
}

// "לפני 5 דקות" / "לפני שעתיים" style relative time.
export function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'עכשיו';
  if (diffMin < 60) return `לפני ${diffMin} ${diffMin === 1 ? 'דקה' : 'דקות'}`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `לפני ${diffHr} ${diffHr === 1 ? 'שעה' : 'שעות'}`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `לפני ${diffDay} ${diffDay === 1 ? 'יום' : 'ימים'}`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `לפני ${diffMonth} ${diffMonth === 1 ? 'חודש' : 'חודשים'}`;
  const diffYear = Math.floor(diffMonth / 12);
  return `לפני ${diffYear} ${diffYear === 1 ? 'שנה' : 'שנים'}`;
}
