import StatusTable from './StatusTable';
import AddRow, { LICENSING_ADD_ROW_PROPS, newStatusRow, RemovableLabel } from '../AddRow';
import { useAddedRowHistory } from '../../utils/addedRows';
import {
  FORM4_STATUS_OPTIONS, FORM4_DONE_STATUSES, FORM4_STATUS_YES, FORM4_STATUS_NO, FORM4_STATUS_NOT_REQUIRED,
  isBuiltInRow,
} from '../../constants';

export const SK_FORM4 = 'licensing.form4.rows';

export const FORM4_COLUMNS = [
  { key: 'label',    type: 'text',   header: 'תנאי' },
  { key: 'status',   type: 'select', header: 'סטטוס', options: FORM4_STATUS_OPTIONS,
    doneValues: FORM4_DONE_STATUSES, onlyDoneValues: true,
    statusColors: {
      [FORM4_STATUS_YES]: 'green',
      [FORM4_STATUS_NO]: 'red',
      [FORM4_STATUS_NOT_REQUIRED]: 'gray',
    } },
  { key: 'note',     type: 'input',  header: 'הערה', placeholder: '—' },
  { key: 'reminder', type: 'reminder', header: 'תזכורת' },
];

// תנאים טופס 4: shown once תנאים answered "yes" to opening a טופס 4 request.
export default function Form4Phase({ form4, onChange, reminders = [], onReminderChange, onStatusChange }) {
  const history = useAddedRowHistory('form4');

  // Rows a worker added can be removed (with their reminder).
  const removeRow = (row) => {
    onReminderChange?.(SK_FORM4)?.(row.label, null);
    onChange({ rows: form4.rows.filter(r => r.id !== row.id) });
  };
  const columns = FORM4_COLUMNS.map(c => (c.key !== 'label' ? c : {
    ...c,
    render: (row) => (isBuiltInRow('form4', row.label) ? row.label : <RemovableLabel row={row} onRemove={removeRow} />),
  }));

  return (
    <div className="licensing-info">
      <StatusTable
        title="תנאים טופס 4"
        rows={form4.rows}
        columns={columns}
        onChange={(next) => onChange({ rows: next })}
        reminders={reminders.filter(r => r.section_key === SK_FORM4)}
        onReminderChange={onReminderChange?.(SK_FORM4)}
        onStatusChange={onStatusChange?.(SK_FORM4)}
        footer={(
          <AddRow
            {...LICENSING_ADD_ROW_PROPS}
            existing={form4.rows.map(r => r.label)}
            placeholder="שם התנאי"
            history={history}
            statusOptions={() => FORM4_STATUS_OPTIONS}
            defaultStatus={() => FORM4_STATUS_NO}
            onAdd={(label, status, options) => onChange({ rows: [...form4.rows, newStatusRow(label, status, options)] })}
          />
        )}
      />
    </div>
  );
}
