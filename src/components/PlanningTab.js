import { useRef, useEffect, useState, useMemo } from 'react';
import StatusTable from './licensing/StatusTable';
import AddRow from './AddRow';
import { useDeferredSave } from '../utils/useDeferredSave';
import {
  FIELD_PLANNING_DATA,
  STATUS_NOT_STARTED, STATUS_IN_PROGRESS, STATUS_READY, STATUS_AGREED,
  STATUS_NOT_READY, STATUS_READY_SIMPLE,
} from '../constants';

const NOT_REQUIRED = 'not_required';

// ── Status options ──

export const OFFER_OPTIONS = [
  { value: NOT_REQUIRED,       label: 'לא נדרש' },
  { value: STATUS_NOT_STARTED, label: 'לא התחלנו' },
  { value: STATUS_IN_PROGRESS, label: 'בסדר עבודה' },
  { value: STATUS_READY,       label: 'מוכן' },
  { value: STATUS_AGREED,      label: 'מאושר' },
];
const OFFER_COLORS = {
  [NOT_REQUIRED]:       'gray',
  [STATUS_NOT_STARTED]: 'red',
  [STATUS_IN_PROGRESS]: 'orange',
  [STATUS_READY]:       'green',
  [STATUS_AGREED]:      'green',
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
  { value: STATUS_SCHEMATIC,   label: 'סכימתי' },
  { value: STATUS_READY,       label: 'מוכן' },
];
const WORK_PLANS_COLORS = {
  [NOT_REQUIRED]:       'gray',
  [STATUS_NOT_STARTED]: 'red',
  [STATUS_IN_PROGRESS]: 'orange',
  [STATUS_SCHEMATIC]:   'blue',
  [STATUS_READY]:       'green',
};

// Each row's dropdown comes from its `scale` (default: לא מוכן / מוכן).
const SCALES = {
  offer:      { options: OFFER_OPTIONS,      statusColors: OFFER_COLORS },
  work_plans: { options: WORK_PLANS_OPTIONS, statusColors: WORK_PLANS_COLORS },
  discipline: { options: DISCIPLINE_OPTIONS, statusColors: DISCIPLINE_COLORS },
};

// Rows that may not be needed for a client (every אדריכלות row and מדידה בשטח)
// offer "לא נדרש"; the rest don't — unless it's already the saved value, so
// old data still shows correctly.
const rowSelect = (row) => {
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
const SK_ARCHITECTURE = 'planning.architecture';
const SK_CONSTRUCTION = 'planning.construction';
const ARCH_SECTION_KEYS = [SK_OFFER, SK_VIZ, SK_DISCIPLINES, SK_ARCHITECTURE];

const LABEL_OFFER = 'הצעה';
const LABEL_VIZ = 'הדמיה';
const archSectionFor = (rowLabel) => {
  if (rowLabel === LABEL_OFFER) return SK_OFFER;
  if (rowLabel === LABEL_VIZ) return SK_VIZ;
  if (rowLabel === 'מים' || rowLabel === 'חשמל') return SK_DISCIPLINES;
  return SK_ARCHITECTURE;
};

// ── Initial state builder (with backward-compat migration) ──
// Shape: see FIELD_PLANNING_DATA in constants.

const entry = (e, fallbackStatus, fallbackNotes = '') => ({
  status: (e?.status === STATUS_READY_SIMPLE ? STATUS_READY : e?.status) || fallbackStatus,
  notes: e?.notes ?? fallbackNotes,
});

const extraRows = (list) => (Array.isArray(list) ? list : [])
  .filter(r => r && r.id && r.label)
  .map(r => ({ id: r.id, label: r.label, ...entry(r, STATUS_NOT_READY) }));

const buildInitialPd = (client) => {
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

// For the clients list: which planning stage this client is currently at
// (furthest table in progress — visualization only once the offer is agreed).
export function getCurrentPlanningStageLabel(client) {
  const pd = buildInitialPd(client);
  if (!pd.architecture_required) return 'אדריכלות - לא נדרש';
  const label = (status) => OFFER_OPTIONS.find(o => o.value === status)?.label || '';
  if (pd.tables.offer.status !== STATUS_AGREED) {
    return `${LABEL_OFFER} - ${label(pd.tables.offer.status)}`;
  }
  return `${LABEL_VIZ} - ${label(pd.tables.visualization.status)}`;
}

// ── Small pieces ──

function RequiredToggle({ value, onChange }) {
  return (
    <div className="required-toggle" role="radiogroup" aria-label="האם נדרש">
      <button type="button" role="radio" aria-checked={value} className={value ? 'is-on' : ''} onClick={() => onChange(true)}>נדרש</button>
      <button type="button" role="radio" aria-checked={!value} className={!value ? 'is-off' : ''} onClick={() => onChange(false)}>לא נדרש</button>
    </div>
  );
}

// ── Component ──

export default function PlanningTab({ client, onUpdate, reminders = [], onReminderChange, onClearReminders }) {
  const [pd, setPd] = useState(() => buildInitialPd(client));
  const pdRef = useRef(pd);
  pdRef.current = pd;

  useEffect(() => {
    setPd(buildInitialPd(client));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id]);

  const { schedule: persist, flush } = useDeferredSave((next) => onUpdate({ [FIELD_PLANNING_DATA]: next }));

  const update = (next) => {
    setPd(next);
    persist(next);
  };

  const patch = (changes) => update({ ...pdRef.current, ...changes });
  const patchTables = (changes) => patch({ tables: { ...pdRef.current.tables, ...changes } });

  const handleText = (key, value) => {
    setPd(prev => ({ ...prev, [key]: value }));
    persist({ ...pdRef.current, [key]: value });
  };

  const setArchitectureRequired = (required) => {
    if (required === pdRef.current.architecture_required) return;
    if (!required) ARCH_SECTION_KEYS.forEach(sk => onClearReminders?.(sk));
    patch({ architecture_required: required });
  };

  const archReminders = useMemo(
    () => reminders.filter(r => r.section_key === archSectionFor(r.row_label)),
    [reminders],
  );
  const constructionReminders = useMemo(
    () => reminders.filter(r => r.section_key === SK_CONSTRUCTION),
    [reminders],
  );

  const { tables } = pd;

  const removeLabel = (row, onRemove) => (
    <span className="row-label">
      {row.label}
      <button
        type="button"
        className="row-remove-btn"
        title="הסרת שורה"
        onClick={() => { if (window.confirm(`להסיר את "${row.label}"?`)) onRemove(row); }}
      >
        ✕
      </button>
    </span>
  );

  // ── Part 1: אדריכלות ──

  const archRows = [
    { id: 'offer',       label: LABEL_OFFER,     scale: 'offer', optional: true, ...tables.offer },
    { id: 'viz',         label: LABEL_VIZ,       scale: 'offer', optional: true, ...tables.visualization },
    { id: 'work_plan',   label: 'תוכנית עבודה', scale: 'offer', optional: true, ...tables.work_plan },
    { id: 'water',       label: 'מים',           optional: true, ...tables.disciplines.water },
    { id: 'electricity', label: 'חשמל',          optional: true, ...tables.disciplines.electricity },
    ...tables.architecture_extra.map(r => ({ ...r, optional: true, extra: true })),
  ];

  const removeArchExtra = (row) => {
    onReminderChange?.(SK_ARCHITECTURE, row.label, null);
    patchTables({ architecture_extra: pdRef.current.tables.architecture_extra.filter(r => r.id !== row.id) });
  };

  const archColumns = [
    {
      key: 'label', type: 'text', header: 'שלב',
      render: (row) => (row.extra ? removeLabel(row, removeArchExtra) : row.label),
    },
    { key: 'status',   type: 'select', header: 'סטטוס', rowSelect },
    { key: 'notes',    type: 'input',  header: 'הערות', placeholder: 'הערות' },
    { key: 'reminder', type: 'reminder', header: 'תזכורת' },
  ];

  const onArchChange = (nextRows) => {
    const byId = Object.fromEntries(nextRows.map(r => [r.id, { status: r.status, notes: r.notes }]));
    const cur = pdRef.current.tables;
    patchTables({
      offer: byId.offer,
      visualization: byId.viz,
      work_plan: byId.work_plan,
      disciplines: { ...cur.disciplines, water: byId.water, electricity: byId.electricity },
      architecture_extra: cur.architecture_extra.map(r => ({ ...r, ...byId[r.id] })),
    });
  };

  // ── Part 2: קונסטרוקציה ──

  const constructionRows = [
    { id: 'survey',    label: 'מדידה בשטח (מבנים קיימים)', optional: true, ...tables.construction.survey },
    { id: 'placement', label: 'העמדה', ...tables.construction.placement },
    { id: 'work_plans', label: 'תוכניות עבודה', scale: 'work_plans', ...tables.construction.work_plans },
    ...tables.construction.extra.map(r => ({ ...r, extra: true })),
  ];

  const removeConstructionExtra = (row) => {
    onReminderChange?.(SK_CONSTRUCTION, row.label, null);
    const c = pdRef.current.tables.construction;
    patchTables({ construction: { ...c, extra: c.extra.filter(r => r.id !== row.id) } });
  };

  const constructionColumns = [
    { key: 'label', type: 'text', header: 'שלב', render: (row) => (row.extra ? removeLabel(row, removeConstructionExtra) : row.label) },
    { key: 'status',   type: 'select', header: 'סטטוס', rowSelect },
    { key: 'notes',    type: 'input',  header: 'הערות', placeholder: 'הערות' },
    { key: 'reminder', type: 'reminder', header: 'תזכורת' },
  ];

  const onConstructionChange = (nextRows) => {
    const byId = Object.fromEntries(nextRows.map(r => [r.id, { status: r.status, notes: r.notes }]));
    const c = pdRef.current.tables.construction;
    patchTables({
      construction: {
        survey: byId.survey,
        placement: byId.placement,
        work_plans: byId.work_plans,
        extra: c.extra.map(r => ({ ...r, ...byId[r.id] })),
      },
    });
  };

  const newRow = (label) => ({ id: `x${Date.now().toString(36)}`, label, status: STATUS_NOT_READY, notes: '' });

  return (
    <div dir="rtl" className="planning-tab" onBlur={flush}>

      <div className="detail-section">
        <h3 className="detail-section-title">פרטי תכנון</h3>
        <div className="form-group">
          <label>דרישות לקוח</label>
          <textarea
            value={pd.client_requirements}
            onChange={(e) => handleText('client_requirements', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>הערות</label>
          <textarea
            value={pd.notes}
            onChange={(e) => handleText('notes', e.target.value)}
          />
        </div>
      </div>

      {pd.architecture_required ? (
        <StatusTable
          title={<>אדריכלות<RequiredToggle value onChange={setArchitectureRequired} /></>}
          rows={archRows}
          columns={archColumns}
          onChange={onArchChange}
          reminders={archReminders}
          onReminderChange={(rowLabel, days) => onReminderChange?.(archSectionFor(rowLabel), rowLabel, days)}
          footer={(
            <AddRow
              existing={archRows.map(r => r.label)}
              placeholder="שם השלב"
              onAdd={(label) => patchTables({ architecture_extra: [...pdRef.current.tables.architecture_extra, newRow(label)] })}
            />
          )}
        />
      ) : (
        <div className="detail-section">
          <h3 className="detail-section-title">אדריכלות<RequiredToggle value={false} onChange={setArchitectureRequired} /></h3>
          <p className="muted part-off-note">אדריכלות לא נדרשת ללקוח זה. הנתונים שהוזנו נשמרים ויחזרו אם יסומן שוב "נדרש".</p>
        </div>
      )}

      <StatusTable
        title="קונסטרוקציה"
        rows={constructionRows}
        columns={constructionColumns}
        onChange={onConstructionChange}
        reminders={constructionReminders}
        onReminderChange={(rowLabel, days) => onReminderChange?.(SK_CONSTRUCTION, rowLabel, days)}
        footer={(
          <AddRow
            existing={constructionRows.map(r => r.label)}
            placeholder="למשל: רצפה, תקרה"
            onAdd={(label) => {
              const c = pdRef.current.tables.construction;
              patchTables({ construction: { ...c, extra: [...c.extra, newRow(label)] } });
            }}
          />
        )}
      />

    </div>
  );
}
