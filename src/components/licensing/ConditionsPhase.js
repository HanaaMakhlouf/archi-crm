import { useState, useEffect, useRef } from 'react';
import StatusTable from './StatusTable';
import GrayOut from '../GrayOut';
import {
  DOC_STATUS_PRESENT, DOC_STATUS_MISSING, DOC_STATUS_NOT_REQUIRED, DOC_STATUS_OPTIONS,
  PERMIT_STATUS_OPTIONS, PERMIT_STATUS_SIGNED,
  PERMIT_STATUS_FEE_NOT_GIVEN, PERMIT_STATUS_FEE_GIVEN, PERMIT_STATUS_PRINTED,
} from '../../constants';

const SK_CONDITIONS = 'licensing.conditions.rows';
const SK_PERMIT     = 'licensing.conditions.permit';

const CONDITION_COLUMNS = [
  { key: 'label',    type: 'text',   header: 'תנאי' },
  { key: 'status',   type: 'select', header: 'סטטוס', options: DOC_STATUS_OPTIONS,
    statusColors: {
      [DOC_STATUS_PRESENT]:      'green',
      [DOC_STATUS_MISSING]:      'red',
      [DOC_STATUS_NOT_REQUIRED]: 'gray',
    } },
  { key: 'note',     type: 'input',  header: 'הערה', placeholder: 'הערה' },
  { key: 'reminder', type: 'reminder', header: 'תזכורת' },
];

const PERMIT_COLUMNS = [
  { key: 'label',    type: 'text' },
  { key: 'status',   type: 'select', options: PERMIT_STATUS_OPTIONS,
    statusColors: {
      [PERMIT_STATUS_FEE_NOT_GIVEN]: 'red',
      [PERMIT_STATUS_FEE_GIVEN]:     'orange',
      [PERMIT_STATUS_PRINTED]:       'orange',
      [PERMIT_STATUS_SIGNED]:        'green',
    } },
  { key: 'note',     type: 'input',  placeholder: 'הערה' },
  { key: 'reminder', type: 'reminder', header: 'תזכורת' },
];

export default function ConditionsPhase({ conditions, onChange, reminders = [], onReminderChange, onClearReminders }) {
  const patch = (key, value) => onChange({ [key]: value });
  const [newLabel, setNewLabel] = useState('');
  const [addingRow, setAddingRow] = useState(false);

  const allConditionsDone = conditions.rows.every(r =>
    r.status === DOC_STATUS_PRESENT || r.status === DOC_STATUS_NOT_REQUIRED
  );
  const permitSigned = conditions.permit_status === PERMIT_STATUS_SIGNED;

  const confirmAddRow = () => {
    const label = newLabel.trim();
    if (label) {
      patch('rows', [
        ...conditions.rows,
        { id: crypto.randomUUID(), label, status: DOC_STATUS_MISSING, note: '' },
      ]);
    }
    setNewLabel('');
    setAddingRow(false);
  };

  // GrayOut reset: when permit section becomes grayed, clear its reminders.
  const prevAllConditionsDone = useRef(allConditionsDone);
  useEffect(() => {
    if (!allConditionsDone && prevAllConditionsDone.current) {
      onClearReminders?.(SK_PERMIT);
    }
    prevAllConditionsDone.current = allConditionsDone;
  }, [allConditionsDone, onClearReminders]);

  const sectionReminders = (sk) => reminders.filter(r => r.section_key === sk);

  const permitRow = [{
    id: 'permit',
    label: 'התר',
    status: conditions.permit_status,
    note: conditions.permit_note,
  }];

  return (
    <div className="licensing-info">
      {/* Section 1 — Conditions */}
      <StatusTable
        title="תנאים"
        rows={conditions.rows}
        columns={CONDITION_COLUMNS}
        onChange={(next) => patch('rows', next)}
        reminders={sectionReminders(SK_CONDITIONS)}
        onReminderChange={(rl, days) => onReminderChange?.(SK_CONDITIONS)(rl, days)}
        footer={
          addingRow ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                autoFocus
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmAddRow();
                  if (e.key === 'Escape') { setNewLabel(''); setAddingRow(false); }
                }}
                placeholder="שם התנאי"
                style={{ flex: 1, maxWidth: 220 }}
              />
              <button className="btn btn-primary btn-sm" onClick={confirmAddRow}>הוסף</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setNewLabel(''); setAddingRow(false); }}>ביטול</button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => setAddingRow(true)}>+ הוסף שורה</button>
          )
        }
      />

      {/* Section 2 — Permit (התר) */}
      <GrayOut disabled={!allConditionsDone} reason="ממתין לסיום כל התנאים">
        <StatusTable
          title="התר"
          showHeader={false}
          rows={permitRow}
          columns={PERMIT_COLUMNS}
          onChange={(next) => onChange({ permit_status: next[0].status, permit_note: next[0].note })}
          reminders={sectionReminders(SK_PERMIT)}
          onReminderChange={(rl, days) => onReminderChange?.(SK_PERMIT)(rl, days)}
        />
      </GrayOut>

      {/* Section 3 — Question */}
      <GrayOut disabled={!permitSigned} reason="ממתין לחתימת היתר">
        <div className="detail-section">
          <span className="conditions-question">האם צריך אישור תחילת עבודה?</span>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              className={`btn btn-sm ${conditions.needs_start_approval === 'yes' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => patch('needs_start_approval', 'yes')}
            >
              כן
            </button>
            <button
              className={`btn btn-sm ${conditions.needs_start_approval === 'no' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => patch('needs_start_approval', 'no')}
            >
              לא
            </button>
          </div>
        </div>
      </GrayOut>
    </div>
  );
}
