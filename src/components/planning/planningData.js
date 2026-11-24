import {
  FIELD_PLANNING_DATA,
  STATUS_NOT_STARTED, STATUS_IN_PROGRESS, STATUS_READY, STATUS_AGREED,
  STATUS_NOT_READY, STATUS_READY_SIMPLE,
} from '../../constants';

// A client's planning data (client.planning_data) as the planning tab works
// with it: each table's dropdowns and colours, the reminders' section keys,
// filling in and upgrading saved data, the tables' rows, and the stage shown
// in the clients list.

const NOT_REQUIRED = 'not_required';

// ── Status options ──

// מוכן is split in two: מוכן לעיון (yellow), then מוכן לביצוע (green) — which
// keeps the old מוכן's code, so rows saved as מוכן read as מוכן לביצוע.
const STATUS_READY_FOR_REVIEW = 'ready_for_review';
const READY_FOR_REVIEW = { value: STATUS_READY_FOR_REVIEW, label: 'מוכן לעיון' };
const READY_TO_BUILD = { value: STATUS_READY, label: 'מוכן לביצוע' };

export const OFFER_OPTIONS = [
  { value: NOT_REQUIRED,       label: 'לא נדרש' },
  { value: STATUS_NOT_STARTED, label: 'לא התחלנו' },
  { value: STATUS_IN_PROGRESS, label: 'בסדר עבודה' },
  READY_FOR_REVIEW,
  READY_TO_BUILD,
];
const OFFER_COLORS = {
  [NOT_REQUIRED]:            'gray',
  [STATUS_NOT_STARTED]:      'red',
  [STATUS_IN_PROGRESS]:      'orange',
  [STATUS_READY_FOR_REVIEW]: 'yellow',
  [STATUS_READY]:            'green',
};

// מים / חשמל
const REVIEW_OPTIONS = [
  { value: NOT_REQUIRED,     label: 'לא נדרש' },
  { value: STATUS_NOT_READY, label: 'לא מוכן' },
  READY_FOR_REVIEW,
  READY_TO_BUILD,
];
const REVIEW_COLORS = {
  [NOT_REQUIRED]:            'gray',
  [STATUS_NOT_READY]:        'red',
  [STATUS_READY_FOR_REVIEW]: 'yellow',
  [STATUS_READY]:            'green',
};

export const DISCIPLINE_OPTIONS = [
  { value: NOT_REQUIRED,     label: 'לא נדרש' },
  { value: STATUS_NOT_READY, label: 'לא מוכן' },
  { value: STATUS_READY,     label: 'מוכן' },
];
const DISCIPLINE_COLORS = {
  [NOT_REQUIRED]:     'gray',
  [STATUS_NOT_READY]: 'red',
  [STATUS_READY]:     'green',
};

// קונסטרוקציה → תוכניות עבודה
const STATUS_SCHEMATIC = 'schematic';
export const WORK_PLANS_OPTIONS = [
  { value: NOT_REQUIRED,       label: 'לא נדרש' },
  { value: STATUS_NOT_STARTED, label: 'לא התחלנו' },
  { value: STATUS_IN_PROGRESS, label: 'בסדר עבודה' },
  { value: STATUS_SCHEMATIC,   label: 'נמסר לעיון' }, // was סכימתי
  READY_FOR_REVIEW,
  READY_TO_BUILD,
];
const WORK_PLANS_COLORS = {
  [NOT_REQUIRED]:            'gray',
  [STATUS_NOT_STARTED]:      'red',
  [STATUS_IN_PROGRESS]:      'orange',
  [STATUS_SCHEMATIC]:        'blue',
  [STATUS_READY_FOR_REVIEW]: 'yellow',
  [STATUS_READY]:            'green',
};

// Each row's dropdown comes from its `scale` (default: לא מוכן / מוכן).
const SCALES = {
  offer:      { options: OFFER_OPTIONS,      statusColors: OFFER_COLORS },
  review:     { options: REVIEW_OPTIONS,     statusColors: REVIEW_COLORS },
  work_plans: { options: WORK_PLANS_OPTIONS, statusColors: WORK_PLANS_COLORS },
  discipline: { options: DISCIPLINE_OPTIONS, statusColors: DISCIPLINE_COLORS },
};

// Rows that may not be needed for a client (every אדריכלות row and מדידה בשטח)
// offer "לא נדרש"; the rest don't — unless it's already the saved value, so
// old data still shows correctly.
export const rowSelect = (row) => {
  const { options, statusColors } = SCALES[row.scale] || SCALES.discipline;
  const keepNotRequired = row.optional || row.status === NOT_REQUIRED;
  return {
    options: keepNotRequired ? options : options.filter(o => o.value !== NOT_REQUIRED),
    statusColors,
  };
};

// ── Section keys (reminders) ──
// הצעה / הדמיה / מים / חשמל keep their original keys so existing reminders stay attached.
const SK_OFFER        = 'planning.offer';
const SK_VIZ          = 'planning.visualization';
const SK_DISCIPLINES  = 'planning.disciplines';
export const SK_ARCHITECTURE = 'planning.architecture';
export const SK_CONSTRUCTION = 'planning.construction';
export const ARCH_SECTION_KEYS = [SK_OFFER, SK_VIZ, SK_DISCIPLINES, SK_ARCHITECTURE];

const LABEL_OFFER = 'הצעה';
const LABEL_VIZ = 'הדמיה';
export const archSectionFor = (rowLabel) => {
  if (rowLabel === LABEL_OFFER) return SK_OFFER;
  if (rowLabel === LABEL_VIZ) return SK_VIZ;
  if (rowLabel === 'מים' || rowLabel === 'חשמל') return SK_DISCIPLINES;
  return SK_ARCHITECTURE;
};

// ── Initial state builder (with backward-compat migration) ──
// Shape: see FIELD_PLANNING_DATA in constants.

// מאושר is gone: rows saved with it become מוכן לביצוע, the green final step.
const entry = (e, fallbackStatus, fallbackNotes = '') => ({
  status: ([STATUS_READY_SIMPLE, STATUS_AGREED].includes(e?.status) ? STATUS_READY : e?.status) || fallbackStatus,
  notes: e?.notes ?? fallbackNotes,
});

const extraRows = (list) => (Array.isArray(list) ? list : [])
  .filter(r => r && r.id && r.label)
  .map(r => ({ id: r.id, label: r.label, ...entry(r, STATUS_NOT_READY) }));

export const buildInitialPd = (client) => {
  const src = client[FIELD_PLANNING_DATA] || {};

  // Oldest format kept everything flat under architecture / construction / water / electricity.
  const t = src.tables || {
    offer: { status: src.architecture?.offer_status, notes: src.architecture?.offer_notes },
    visualization: { status: src.architecture?.viz_status, notes: src.architecture?.viz_notes },
    disciplines: { construction: src.construction, water: src.water, electricity: src.electricity },
  };

  return {
    client_requirements: src.client_requirements || '',
    notes: src.notes || '',
    architecture_required: src.architecture_required !== false,
    tables: {
      ...t, // keeps fields this tab no longer shows (e.g. the old construction discipline row)
      offer: entry(t.offer, STATUS_NOT_STARTED),
      visualization: entry(t.visualization, STATUS_NOT_STARTED),
      // The work plan used to be a free-text box; its text becomes the row's notes.
      work_plan: entry(t.work_plan, STATUS_NOT_STARTED, src.work_plan_notes || ''),
      disciplines: {
        ...t.disciplines,
        water: entry(t.disciplines?.water, STATUS_NOT_READY),
        electricity: entry(t.disciplines?.electricity, STATUS_NOT_READY),
      },
      architecture_extra: extraRows(t.architecture_extra),
      construction: {
        survey: entry(t.construction?.survey, STATUS_NOT_READY),
        placement: entry(t.construction?.placement, STATUS_NOT_READY),
        work_plans: entry(t.construction?.work_plans, STATUS_NOT_STARTED),
        extra: extraRows(t.construction?.extra),
      },
    },
  };
};

// The אדריכלות / קונסטרוקציה tables' rows (also used by the client summary PDF).
export const archRowsOf = (tables) => [
  { id: 'offer',       label: LABEL_OFFER,     scale: 'offer', optional: true, ...tables.offer },
  { id: 'viz',         label: LABEL_VIZ,       scale: 'offer', optional: true, ...tables.visualization },
  { id: 'work_plan',   label: 'תוכנית עבודה', scale: 'offer', optional: true, ...tables.work_plan },
  { id: 'water',       label: 'מים',           scale: 'review', optional: true, ...tables.disciplines.water },
  { id: 'electricity', label: 'חשמל',          scale: 'review', optional: true, ...tables.disciplines.electricity },
  ...tables.architecture_extra.map(r => ({ ...r, optional: true, extra: true })),
];

export const constructionRowsOf = (tables) => [
  { id: 'survey',    label: 'מדידה בשטח (מבנים קיימים)', optional: true, ...tables.construction.survey },
  { id: 'placement', label: 'העמדה', ...tables.construction.placement },
  { id: 'work_plans', label: 'תוכניות עבודה', scale: 'work_plans', ...tables.construction.work_plans },
  ...tables.construction.extra.map(r => ({ ...r, extra: true })),
];

// For the clients list: which planning stage this client is currently at
// (furthest table in progress — visualization only once the offer is מוכן לביצוע).
export function getCurrentPlanningStageLabel(client) {
  const pd = buildInitialPd(client);
  if (!pd.architecture_required) return 'אדריכלות - לא נדרש';
  const label = (status) => OFFER_OPTIONS.find(o => o.value === status)?.label || '';
  if (pd.tables.offer.status !== STATUS_READY) {
    return `${LABEL_OFFER} - ${label(pd.tables.offer.status)}`;
  }
  return `${LABEL_VIZ} - ${label(pd.tables.visualization.status)}`;
}
