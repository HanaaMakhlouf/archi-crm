import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import StatusTable from './licensing/StatusTable';
import GrayOut from './GrayOut';
import {
  FIELD_PLANNING_DATA,
  STATUS_NOT_STARTED, STATUS_IN_PROGRESS, STATUS_READY, STATUS_AGREED,
  STATUS_NOT_READY, STATUS_READY_SIMPLE,
  DEBOUNCE_DELAY_MS,
} from '../constants';

// ── Status options ──

const OFFER_OPTIONS = [
  { value: 'not_required',   label: 'לא נדרש' },
  { value: STATUS_NOT_STARTED, label: 'לא התחלנו' },
  { value: STATUS_IN_PROGRESS, label: 'בסדר עבודה' },
  { value: STATUS_READY,       label: 'מוכן' },
  { value: STATUS_AGREED,      label: 'מאושר' },
];
const OFFER_COLORS = {
  'not_required':       'gray',
  [STATUS_NOT_STARTED]: 'red',
  [STATUS_IN_PROGRESS]: 'orange',
  [STATUS_READY]:       'green',
  [STATUS_AGREED]:      'green',
};

const DISCIPLINE_OPTIONS = [
  { value: 'not_required',   label: 'לא נדרש' },
  { value: STATUS_NOT_READY, label: 'לא מוכן' },
  { value: STATUS_READY,     label: 'מוכן' },
];
const DISCIPLINE_COLORS = {
  'not_required':     'gray',
  [STATUS_NOT_READY]: 'red',
  [STATUS_READY]:     'green',
};

// ── Section keys ──
const SK_OFFER       = 'planning.offer';
const SK_VIZ         = 'planning.visualization';
const SK_DISCIPLINES = 'planning.disciplines';

// ── Column defs ──

const OFFER_COLS = [
  { key: 'label',    type: 'text' },
  { key: 'status',   type: 'select', options: OFFER_OPTIONS, statusColors: OFFER_COLORS },
  { key: 'notes',    type: 'input', placeholder: 'הערות' },
  { key: 'reminder', type: 'reminder', header: 'תזכורת' },
];

const DISCIPLINE_COLS = [
  { key: 'label',    type: 'text', header: 'תחום' },
  { key: 'status',   type: 'select', header: 'סטטוס', options: DISCIPLINE_OPTIONS, statusColors: DISCIPLINE_COLORS },
  { key: 'notes',    type: 'input', header: 'הערות', placeholder: 'הערות' },
  { key: 'reminder', type: 'reminder', header: 'תזכורת' },
];

// ── Initial state builder (with backward-compat migration) ──

const buildInitialPd = (client) => {
  const src = client[FIELD_PLANNING_DATA] || {};

  const tables = src.tables ? src.tables : {
    offer: {
      status: src.architecture?.offer_status || STATUS_NOT_STARTED,
      notes:  src.architecture?.offer_notes  || '',
    },
    visualization: {
      status: src.architecture?.viz_status || STATUS_NOT_STARTED,
      notes:  src.architecture?.viz_notes  || '',
    },
    disciplines: {
      construction: {
        status: src.construction?.status === STATUS_READY_SIMPLE ? STATUS_READY : (src.construction?.status || STATUS_NOT_READY),
        notes:  src.construction?.notes || '',
      },
      water: {
        status: src.water?.status === STATUS_READY_SIMPLE ? STATUS_READY : (src.water?.status || STATUS_NOT_READY),
        notes:  src.water?.notes || '',
      },
      electricity: {
        status: src.electricity?.status === STATUS_READY_SIMPLE ? STATUS_READY : (src.electricity?.status || STATUS_NOT_READY),
        notes:  src.electricity?.notes || '',
      },
    },
  };

  return {
    client_requirements: src.client_requirements || '',
    notes:               src.notes               || '',
    work_plan_notes:     src.work_plan_notes      || '',
    tables: {
      offer: {
        status: tables.offer?.status || STATUS_NOT_STARTED,
        notes:  tables.offer?.notes  || '',
      },
      visualization: {
        status: tables.visualization?.status || STATUS_NOT_STARTED,
        notes:  tables.visualization?.notes  || '',
      },
      disciplines: {
        construction: { status: tables.disciplines?.construction?.status || STATUS_NOT_READY, notes: tables.disciplines?.construction?.notes || '' },
        water:        { status: tables.disciplines?.water?.status        || STATUS_NOT_READY, notes: tables.disciplines?.water?.notes        || '' },
        electricity:  { status: tables.disciplines?.electricity?.status  || STATUS_NOT_READY, notes: tables.disciplines?.electricity?.notes  || '' },
      },
    },
  };
};

// ── Component ──

export default function PlanningTab({ client, onUpdate, reminders = [], onReminderChange, onClearReminders }) {
  const [pd, setPd] = useState(() => buildInitialPd(client));
  const debounceTimer = useRef(null);
  const pdRef = useRef(pd);
  pdRef.current = pd;

  useEffect(() => {
    setPd(buildInitialPd(client));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id]);

  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  const persist = useCallback((next) => {
    onUpdate({ [FIELD_PLANNING_DATA]: next });
  }, [onUpdate]);

  const update = (next) => {
    setPd(next);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => persist(next), DEBOUNCE_DELAY_MS);
  };

  const handleText = (key, value) => {
    setPd(prev => ({ ...prev, [key]: value }));
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => persist({ ...pdRef.current, [key]: value }), DEBOUNCE_DELAY_MS);
  };

  const onSingleTableChange = (tableKey) => (nextRows) => {
    const next = {
      ...pdRef.current,
      tables: {
        ...pdRef.current.tables,
        [tableKey]: { status: nextRows[0].status, notes: nextRows[0].notes },
      },
    };
    update(next);
  };

  const onDisciplinesChange = (nextRows) => {
    const disciplines = {};
    nextRows.forEach(r => { disciplines[r.id] = { status: r.status, notes: r.notes }; });
    const next = {
      ...pdRef.current,
      tables: { ...pdRef.current.tables, disciplines },
    };
    update(next);
  };

  // GrayOut reset: clear viz reminders when visualization becomes grayed.
  const vizEnabled = pd.tables.offer.status === STATUS_AGREED;
  const prevVizEnabled = useRef(vizEnabled);
  useEffect(() => {
    if (!vizEnabled && prevVizEnabled.current) {
      onClearReminders?.(SK_VIZ);
    }
    prevVizEnabled.current = vizEnabled;
  }, [vizEnabled, onClearReminders]);

  const sectionReminders = useMemo(() => (sk) => reminders.filter(r => r.section_key === sk), [reminders]);

  const offerRow = [{ id: 'offer', label: 'הצעה', ...pd.tables.offer }];
  const vizRow   = [{ id: 'viz',   label: 'הדמיה', ...pd.tables.visualization }];
  const disciplineRows = [
    { id: 'construction', label: 'קונסטרוקציה', ...pd.tables.disciplines.construction },
    { id: 'water',        label: 'מים',         ...pd.tables.disciplines.water },
    { id: 'electricity',  label: 'חשמל',        ...pd.tables.disciplines.electricity },
  ];

  return (
    <div dir="rtl" className="planning-tab">

      {/* ── Section A: פרטי תכנון (unchanged) ── */}
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

      {/* ── Table 1: הצעה (always enabled) ── */}
      <StatusTable
        title="הצעה"
        showHeader={false}
        rows={offerRow}
        columns={OFFER_COLS}
        onChange={onSingleTableChange('offer')}
        reminders={sectionReminders(SK_OFFER)}
        onReminderChange={(rl, days) => onReminderChange?.(SK_OFFER, rl, days)}
      />

      {/* ── Table 2: הדמיה (enabled only when הצעה = מאושר) ── */}
      <GrayOut disabled={!vizEnabled} reason="ממתין לאישור הצעה">
        <StatusTable
          title="הדמיה"
          showHeader={false}
          rows={vizRow}
          columns={OFFER_COLS}
          onChange={onSingleTableChange('visualization')}
          reminders={sectionReminders(SK_VIZ)}
          onReminderChange={(rl, days) => onReminderChange?.(SK_VIZ, rl, days)}
        />
      </GrayOut>

      {/* ── Table 3: Disciplines (always enabled) ── */}
      <StatusTable
        title="תחומים"
        rows={disciplineRows}
        columns={DISCIPLINE_COLS}
        onChange={onDisciplinesChange}
        reminders={sectionReminders(SK_DISCIPLINES)}
        onReminderChange={(rl, days) => onReminderChange?.(SK_DISCIPLINES, rl, days)}
      />

      {/* ── Section D: תוכנית עבודה ── */}
      <div className="detail-section">
        <h3 className="detail-section-title">תוכנית עבודה</h3>
        <div className="form-group">
          <textarea
            value={pd.work_plan_notes}
            onChange={(e) => handleText('work_plan_notes', e.target.value)}
            placeholder="הערות תוכנית עבודה"
          />
        </div>
      </div>

    </div>
  );
}
