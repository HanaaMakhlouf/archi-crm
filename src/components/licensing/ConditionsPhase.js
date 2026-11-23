import StatusTable from './StatusTable';
import GrayOut from '../GrayOut';
import AddRow, { LICENSING_ADD_ROW_PROPS, newStatusRow, RemovableLabel } from '../AddRow';
import { useOnLock } from '../../utils/useOnLock';
import { useAddedRowHistory } from '../../utils/addedRows';
import { shownRows, mergeShownRows } from './questionRows';
import {
  DOC_STATUS_PRESENT, DOC_STATUS_MISSING, DOC_STATUS_NOT_REQUIRED,
  CONDITION_ROW_STATUS_SENT, CONDITION_ROW_STATUS_OPTIONS, CONDITION_ROW_SELECT_OPTIONS, conditionRowOptions,
  CONDITION_DONE_STATUSES, isConditionRowDone,
  COND_MISSING_DOCS, COND_SENT_COMMITTEE, COND_TO_APPRAISER, COND_SENT_CORP, COND_CHARGE_RECEIVED, COND_RETURNED_FOR_FIXES,
  PERMIT_STATUS_OPTIONS, PERMIT_STATUS_SIGNED, PERMIT_STATUS_NOT_PRINTED, PERMIT_STATUS_PRINTED,
  FEE_STATUS_OPTIONS, FEE_DONE_STATUSES, FEE_STATUS_NOT_ISSUED, FEE_STATUS_ISSUED, FEE_STATUS_PAID,
  FEE_STATUS_UPDATED, FEE_STATUS_NOT_REQUIRED,
  INSTITUTE_STATUS_NOT_CHOSEN, INSTITUTE_STATUS_CHOSEN, INSTITUTE_STATUS_HANDLING,
  isBuiltInRow,
} from '../../constants';

const SK_CONDITIONS = 'licensing.conditions.rows';
const SK_FEE        = 'licensing.conditions.fee';
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
  [INSTITUTE_STATUS_NOT_CHOSEN]: 'red',
  [INSTITUTE_STATUS_CHOSEN]:     'orange',
  [INSTITUTE_STATUS_HANDLING]:   'orange',
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

export const CONDITION_COLUMNS = [
  { key: 'label',    type: 'text',   header: 'תנאי' },
  { key: 'status',   type: 'select', header: 'סטטוס', options: CONDITION_ROW_STATUS_OPTIONS,
    statusColors: CONDITION_STATUS_COLORS, rowSelect: conditionRowSelect },
  { key: 'note',     type: 'input',  header: 'הערה', placeholder: '—' },
  { key: 'reminder', type: 'reminder', header: 'תזכורת' },
];

// The היתר box: אגרות, then היתר itself — each row with its own dropdown.
const FEE_SELECT = {
  options: FEE_STATUS_OPTIONS,
  doneValues: FEE_DONE_STATUSES,
  statusColors: {
    [FEE_STATUS_NOT_ISSUED]:   'red',
    [FEE_STATUS_ISSUED]:       'orange',
    [FEE_STATUS_PAID]:         'green',
    [FEE_STATUS_UPDATED]:      'green',
    [FEE_STATUS_NOT_REQUIRED]: 'gray',
  },
};
export const PERMIT_COLUMNS = [
  { key: 'label',    type: 'text' },
  { key: 'status',   type: 'select', options: PERMIT_STATUS_OPTIONS,
    statusColors: {
      [PERMIT_STATUS_NOT_PRINTED]: 'red',
      [PERMIT_STATUS_PRINTED]:     'orange',
      [PERMIT_STATUS_SIGNED]:      'green',
    },
    rowSelect: (row) => (row.id === 'fee' ? FEE_SELECT : undefined) },
  { key: 'note',     type: 'input',  placeholder: 'הערה' },
  { key: 'reminder', type: 'reminder', header: 'תזכורת' },
];
export const permitBoxRows = (conditions) => [
  { id: 'fee', label: 'אגרות', status: conditions.fee_status, note: conditions.fee_note },
  { id: 'permit', label: 'היתר', status: conditions.permit_status, note: conditions.permit_note },
];

// answers: the request (בקשה), whose questions decide which rows apply.
export default function ConditionsPhase({ conditions, answers, onChange, reminders = [], onReminderChange, onStatusChange, onClearReminders }) {
  const patch = (key, value) => onChange({ [key]: value });

  const rows = shownRows(conditions.rows, 'conditions', answers);
  const allConditionsDone = rows.every(isConditionRowDone);
  const feeDone = allConditionsDone && FEE_DONE_STATUSES.includes(conditions.fee_status);
  const permitSigned = feeDone && conditions.permit_status === PERMIT_STATUS_SIGNED;

  // GrayOut reset: when a section becomes grayed, clear its reminders.
  useOnLock(allConditionsDone, () => onClearReminders?.(SK_FEE));
  useOnLock(feeDone, () => onClearReminders?.(SK_PERMIT));

  const sectionReminders = (sk) => reminders.filter(r => r.section_key === sk);

  const history = useAddedRowHistory('conditions');

  // Rows a worker added can be removed (with their reminder).
  const removeRow = (row) => {
    onReminderChange?.(SK_CONDITIONS)?.(row.label, null);
    patch('rows', conditions.rows.filter(r => r.id !== row.id));
  };
  const columns = CONDITION_COLUMNS.map(c => (c.key !== 'label' ? c : {
    ...c,
    render: (row) => (isBuiltInRow('conditions', row.label) ? row.label : <RemovableLabel row={row} onRemove={removeRow} />),
  }));

  // אגרות and היתר share one box, each keeping its own reminders.
  const sectionOfRow = { אגרות: SK_FEE, היתר: SK_PERMIT };
  const permitBoxReminders = reminders.filter(r => r.section_key === sectionOfRow[r.row_label]);
  const permitBoxReminderChange = onReminderChange
    && ((rowLabel, days) => onReminderChange(sectionOfRow[rowLabel])?.(rowLabel, days));
  const permitBoxStatusChange = onStatusChange
    && ((rowLabel, change) => onStatusChange(sectionOfRow[rowLabel])?.(rowLabel, change));

  return (
    <div className="licensing-info">
      {/* Section 1 — Conditions */}
      <StatusTable
        title="תנאים"
        rows={rows}
        columns={columns}
        onChange={(next) => patch('rows', mergeShownRows(conditions.rows, next, 'conditions', answers))}
        reminders={sectionReminders(SK_CONDITIONS)}
        onReminderChange={onReminderChange?.(SK_CONDITIONS)}
        onStatusChange={onStatusChange?.(SK_CONDITIONS)}
        footer={(
          <AddRow
            {...LICENSING_ADD_ROW_PROPS}
            existing={conditions.rows.map(r => r.label)}
            placeholder="שם התנאי"
            history={history}
            statusOptions={conditionRowOptions}
            defaultStatus={(label) => conditionRowOptions(label)[0].value}
            onAdd={(label, status, options) => patch('rows', [...conditions.rows, newStatusRow(label, status, options)])}
          />
        )}
      />

      {/* Section 2 — Permit (היתר): אגרות, then היתר once the fee is settled */}
      <GrayOut disabled={!allConditionsDone} reason="ממתין לסיום כל התנאים">
        <StatusTable
          title="היתר"
          showHeader={false}
          rows={permitBoxRows(conditions)}
          columns={feeDone ? PERMIT_COLUMNS : PERMIT_COLUMNS.map(c => (c.key !== 'label' ? c : {
            ...c,
            render: (row) => (row.id === 'permit'
              ? <>{row.label}<span className="row-locked-hint">ממתין לתשלום אגרות</span></>
              : row.label),
          }))}
          rowClassName={(row) => (row.id === 'permit' && !feeDone ? 'row-locked' : '')}
          onChange={([fee, permit]) => onChange({
            fee_status: fee.status, fee_note: fee.note,
            permit_status: permit.status, permit_note: permit.note,
          })}
          reminders={permitBoxReminders}
          onReminderChange={permitBoxReminderChange}
          onStatusChange={permitBoxStatusChange}
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
