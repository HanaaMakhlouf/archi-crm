import StatusTable from './StatusTable';
import GrayOut from '../GrayOut';
import AddRow, { LICENSING_ADD_ROW_PROPS, newStatusRow } from '../AddRow';
import { useOnLock } from '../../utils/useOnLock';
import {
  DOC_STATUS_PRESENT, DOC_STATUS_MISSING, DOC_STATUS_NOT_REQUIRED,
  CONDITION_ROW_STATUS_SENT, CONDITION_ROW_STATUS_OPTIONS, CONDITION_ROW_SELECT_OPTIONS, conditionRowOptions,
  CONDITION_DONE_STATUSES, isConditionRowDone,
  COND_MISSING_DOCS, COND_SENT_COMMITTEE, COND_TO_APPRAISER, COND_SENT_CORP, COND_CHARGE_RECEIVED, COND_RETURNED_FOR_FIXES,
  PERMIT_STATUS_OPTIONS, PERMIT_STATUS_SIGNED,
  PERMIT_STATUS_FEE_NOT_GIVEN, PERMIT_STATUS_FEE_GIVEN, PERMIT_STATUS_PRINTED,
} from '../../constants';

const SK_CONDITIONS = 'licensing.conditions.rows';
const SK_PERMIT     = 'licensing.conditions.permit';

const CONDITION_STATUS_COLORS = {
  [DOC_STATUS_MISSING]:        'red',
  [COND_MISSING_DOCS]:         'red',
  [CONDITION_ROW_STATUS_SENT]: 'orange',
  [COND_SENT_COMMITTEE]:       'orange',
  [COND_TO_APPRAISER]:         'orange',
  [COND_SENT_CORP]:            'orange',
  [COND_CHARGE_RECEIVED]:      'orange',
  [COND_RETURNED_FOR_FIXES]:   'red',
  [DOC_STATUS_PRESENT]:        'green',
  [DOC_STATUS_NOT_REQUIRED]:   'gray',
};

// Every condition status's label, to keep showing a saved value that isn't
// in its row's current list.
const ALL_STATUS_LABELS = Object.fromEntries(
  [CONDITION_ROW_STATUS_OPTIONS, ...Object.values(CONDITION_ROW_SELECT_OPTIONS)].flat().map(o => [o.value, o.label]),
);

// השבחה / התייחסות תאגיד / 145 ד תאגיד have their own dropdowns; the rest share one.
const conditionRowSelect = (row) => {
  const options = conditionRowOptions(row.label);
  const keepCurrent = row.status && !options.some(o => o.value === row.status);
  return {
    options: keepCurrent ? [...options, { value: row.status, label: ALL_STATUS_LABELS[row.status] || row.status }] : options,
    statusColors: CONDITION_STATUS_COLORS,
    doneValues: CONDITION_DONE_STATUSES,
  };
};

const CONDITION_COLUMNS = [
  { key: 'label',    type: 'text',   header: 'תנאי' },
  { key: 'status',   type: 'select', header: 'סטטוס', options: CONDITION_ROW_STATUS_OPTIONS,
    statusColors: CONDITION_STATUS_COLORS, rowSelect: conditionRowSelect },
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

  const allConditionsDone = conditions.rows.every(isConditionRowDone);
  const permitSigned = conditions.permit_status === PERMIT_STATUS_SIGNED;

  // GrayOut reset: when permit section becomes grayed, clear its reminders.
  useOnLock(allConditionsDone, () => onClearReminders?.(SK_PERMIT));

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
        onReminderChange={onReminderChange?.(SK_CONDITIONS)}
        footer={(
          <AddRow
            {...LICENSING_ADD_ROW_PROPS}
            existing={conditions.rows.map(r => r.label)}
            placeholder="שם התנאי"
            onAdd={(label) => patch('rows', [...conditions.rows, newStatusRow(label, conditionRowOptions(label)[0].value)])}
          />
        )}
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
          onReminderChange={onReminderChange?.(SK_PERMIT)}
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
