import { useRef, useEffect, useState, useMemo } from 'react';
import StatusTable from './licensing/StatusTable';
import AddRow, { RemovableLabel } from './AddRow';
import { useDeferredSave } from '../utils/useDeferredSave';
import {
  buildInitialPd, archRowsOf, constructionRowsOf, rowSelect,
  SK_ARCHITECTURE, SK_CONSTRUCTION, ARCH_SECTION_KEYS, archSectionFor,
} from './planning/planningData';
import { FIELD_PLANNING_DATA, STATUS_NOT_READY } from '../constants';

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

export default function PlanningTab({ client, onUpdate, reminders = [], onReminderChange, onClearReminders, onStatusChange }) {
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

  const removeLabel = (row, onRemove) => <RemovableLabel row={row} onRemove={onRemove} />;

  // ── Part 1: אדריכלות ──

  const archRows = archRowsOf(tables);

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

  const constructionRows = constructionRowsOf(tables);

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
          onStatusChange={(rowLabel, change) => onStatusChange?.(archSectionFor(rowLabel), rowLabel, change)}
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
        onStatusChange={(rowLabel, change) => onStatusChange?.(SK_CONSTRUCTION, rowLabel, change)}
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
