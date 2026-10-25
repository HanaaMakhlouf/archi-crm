import {
  DOC_STATUS_OPTIONS, INFO_NOTE_OPTIONS, SUBMISSION_OPTIONS, DEPOSIT_STATUS_OPTIONS, ACTION_STATUS_OPTIONS,
  MEETING_OPTIONS, CONDITIONS_STATUS_OPTIONS, PERMIT_STATUS_OPTIONS, PRIORITY_OPTIONS,
} from '../constants';
import { OFFER_OPTIONS, DISCIPLINE_OPTIONS, WORK_PLANS_OPTIONS } from '../components/PlanningTab';
import { HACHANA_OPTIONS, HAFKADA_ISHUR_OPTIONS, PIRSOOM_OPTIONS } from '../components/DetailedTab';

// Hebrew names for the fields/sections that can show up in a change summary.
// Falls back to the raw key when a field isn't listed here — still readable,
// just not translated.
const FIELD_LABELS = {
  label: 'סטטוס לקוח', priority: 'עדיפות', notes: 'הערות', note: 'הערה',
  status: 'סטטוס', client_type: 'סוג לקוח', name: 'שם', phone: 'טלפון',
  city: 'עיר', email: 'אימייל', gush: 'גוש', helka: 'חלקה', migrash: 'מגרש',
  planning_data: 'תכנון', licensing_data: 'רישוי', detailed_data: 'תיק מפורט',
  type_attributes: 'פרטי סוג', archived_at: 'מצב תיק',
  // planning_data sections
  offer: 'הצעה', visualization: 'הדמיה', disciplines: 'תחומים',
  construction: 'קונסטרוקציה', water: 'מים', electricity: 'חשמל',
  client_requirements: 'דרישות לקוח', work_plan_notes: 'תוכנית עבודה', work_plan: 'תוכנית עבודה',
  architecture_required: 'אדריכלות נדרשת', architecture_extra: 'אדריכלות',
  survey: 'מדידה בשטח', placement: 'העמדה', work_plans: 'תוכניות עבודה', extra: 'שלבים נוספים',
  // licensing_data sections
  info: 'מידע', application: 'בקשה', conditions: 'תנאים', confirmation: 'אישור התחלת עבודה',
  requesters: 'מבקשים', rights_holders: 'בעלי זכויות', documents: 'מסמכים',
  description: 'מהות הבקשה', info_note_status: 'הודעת מידע', info_note_note: 'הערת מידע',
  conditions_passed: 'עמידה בתנאים', conditions_note: 'הערת תנאים',
  submission: 'הגשה', actions: 'פעולות', meeting: 'ישיבה', request_number: "מס' בקשה",
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
  DOC_STATUS_OPTIONS, INFO_NOTE_OPTIONS, SUBMISSION_OPTIONS, DEPOSIT_STATUS_OPTIONS, ACTION_STATUS_OPTIONS,
  MEETING_OPTIONS, CONDITIONS_STATUS_OPTIONS, PERMIT_STATUS_OPTIONS, PRIORITY_OPTIONS,
  OFFER_OPTIONS, DISCIPLINE_OPTIONS, WORK_PLANS_OPTIONS, HACHANA_OPTIONS, HAFKADA_ISHUR_OPTIONS, PIRSOOM_OPTIONS,
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

// Equal, or scalars / scalar lists that read the same (29 vs "29" vs [29],
// null vs ''), so a type-only difference isn't reported as "29 ← 29".
const hasObject = (v) => isPlainObject(v) || (Array.isArray(v) && v.some(x => x && typeof x === 'object'));
const sameValue = (a, b) => jsonEq(a, b) || (!hasObject(a) && !hasObject(b) && valueToText(a) === valueToText(b));

const NESTED_DATA_KEYS = new Set(['planning_data', 'licensing_data', 'detailed_data', 'type_attributes']);

// Walks two (assumed similarly-shaped) values and collects every leaf that
// differs, so a summary can point at the specific thing that changed rather
// than just saying "planning_data updated".
function collectChangedLeaves(oldVal, newVal, path = [], out = []) {
  if (oldVal === newVal) return out;

  // A section that didn't exist yet is diffed against an empty one.
  if (isPlainObject(newVal) && (isPlainObject(oldVal) || oldVal == null)) {
    const base = oldVal || {};
    const keys = [...Object.keys(newVal), ...Object.keys(base).filter(k => !(k in newVal))];
    for (const key of keys) collectChangedLeaves(base[key], newVal[key], [...path, key], out);
    return out;
  }

  if (Array.isArray(oldVal) && Array.isArray(newVal) && oldVal.length === newVal.length) {
    for (let i = 0; i < newVal.length; i++) {
      const rowKey = newVal[i]?.label || newVal[i]?.type || i;
      collectChangedLeaves(oldVal[i], newVal[i], [...path, rowKey], out);
    }
    return out;
  }

  if (!sameValue(oldVal, newVal)) out.push({ path, value: newVal, oldValue: oldVal });
  return out;
}

// Rows added to / removed from a table read better as a count than as a list.
const isRowList = (v) => Array.isArray(v) && v.some(isPlainObject);

function leafValueText(leafKey, value) {
  if (leafKey === 'archived_at') return value ? 'סגור (בארכיון)' : 'פעיל';
  if (isRowList(value)) return `${value.length} שורות`;
  return FREE_TEXT_KEYS.has(leafKey) ? truncate(valueToText(value), 40) : valueToText(value);
}

function describeLeaf(sectionLabel, leaf, withOld = false) {
  const { path, value, oldValue } = leaf;
  // Top-level columns have an empty path; their own key decides free-text truncation.
  const leafKey = path.length ? path[path.length - 1] : leaf.key;
  const rowLabel = path.length >= 2 && typeof path[path.length - 2] === 'string'
    ? (FIELD_LABELS[path[path.length - 2]] || path[path.length - 2])
    : null;
  const fieldLabel = path.length ? (FIELD_LABELS[leafKey] || leafKey) : null;

  let displayVal;
  if (Array.isArray(oldValue) && Array.isArray(value) && (isRowList(oldValue) || isRowList(value))) {
    const diff = value.length - oldValue.length;
    displayVal = diff > 0 ? `נוספו ${diff} שורות` : `נמחקו ${-diff} שורות`;
    if (Math.abs(diff) === 1) displayVal = diff > 0 ? 'נוספה שורה' : 'נמחקה שורה';
  } else {
    displayVal = leafValueText(leafKey, value);
    if (withOld && !isPlainObject(value)) displayVal = `${leafValueText(leafKey, oldValue)} ← ${displayVal}`;
  }

  if (!fieldLabel) return `${sectionLabel}: ${displayVal}`;
  const detail = rowLabel && rowLabel !== fieldLabel ? `${rowLabel} - ${fieldLabel}: ${displayVal}` : `${fieldLabel}: ${displayVal}`;
  return `${sectionLabel} · ${detail}`;
}

// One line per changed field. `all` lists every changed leaf (with its old
// value) instead of only the first one per section.
function describeChangeParts(updates, previousClient, all) {
  const parts = [];
  for (const key of Object.keys(updates)) {
    const newVal = updates[key];
    const oldVal = previousClient[key];
    const sectionLabel = FIELD_LABELS[key] || key;

    if (NESTED_DATA_KEYS.has(key)) {
      const leaves = collectChangedLeaves(oldVal, newVal);
      (all ? leaves : leaves.slice(0, 1)).forEach(leaf => parts.push(describeLeaf(sectionLabel, leaf, all)));
      continue;
    }

    if (sameValue(oldVal, newVal)) continue;
    parts.push(describeLeaf(sectionLabel, { path: [], key, value: newVal, oldValue: oldVal }, all));
  }
  return parts;
}

// Builds a short Hebrew "what changed" summary from a partial update patch
// (e.g. { priority: 'red' } or { planning_data: {...} }) compared against
// the client row before the update. Returns null when there's nothing to
// diff against (new client) or nothing actually changed.
export function describeClientChange(updates, previousClient) {
  if (!previousClient) return null;
  const parts = describeChangeParts(updates, previousClient, false);
  return parts.length ? parts.join(' · ') : null;
}

// Every changed field of an activity-log 'updated' row, as "before ← after" lines.
export function describeChangeLines(newData, oldData) {
  if (!newData) return [];
  return describeChangeParts(newData, oldData || {}, true);
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
