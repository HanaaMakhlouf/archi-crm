import StatusTable from './StatusTable';
import { useAddedRowHistory } from '../../utils/addedRows';
import AddRow, { LICENSING_ADD_ROW_PROPS, newStatusRow, RemovableLabel } from '../AddRow';
import { DOC_STATUS_MISSING, DOC_STATUS_PRESENT, DOC_STATUS_OPTIONS, isBuiltInRow } from '../../constants';

const SK_CONFIRMATION = 'licensing.confirmation.rows';

export const CONFIRMATION_COLUMNS = [
  { key: 'label',    type: 'text',   header: 'תנאי' },
  { key: 'status',   type: 'select', header: 'סטטוס', options: DOC_STATUS_OPTIONS,
    statusColors: { [DOC_STATUS_PRESENT]: 'green', [DOC_STATUS_MISSING]: 'red' } },
  { key: 'note',     type: 'input',  header: 'הערה', placeholder: '—' },
  { key: 'reminder', type: 'reminder', header: 'תזכורת' },
];

export default function ConfirmationPhase({ confirmation, onChange, reminders = [], onReminderChange }) {
  const history = useAddedRowHistory('confirmation');

  // Rows a worker added can be removed (with their reminder).
  const removeRow = (row) => {
    onReminderChange?.(SK_CONFIRMATION)?.(row.label, null);
    onChange({ rows: confirmation.rows.filter(r => r.id !== row.id) });
  };
  const columns = CONFIRMATION_COLUMNS.map(c => (c.key !== 'label' ? c : {
    ...c,
    render: (row) => (isBuiltInRow('confirmation', row.label) ? row.label : <RemovableLabel row={row} onRemove={removeRow} />),
  }));

  return (
    <div className="licensing-info">
      <StatusTable
        title="תנאים לאישור תחילת עבודה"
        rows={confirmation.rows}
        columns={columns}
        onChange={(next) => onChange({ rows: next })}
        reminders={reminders.filter(r => r.section_key === SK_CONFIRMATION)}
        onReminderChange={onReminderChange?.(SK_CONFIRMATION)}
        footer={(
          <AddRow
            {...LICENSING_ADD_ROW_PROPS}
            existing={confirmation.rows.map(r => r.label)}
            placeholder="שם התנאי"
            history={history}
            statusOptions={() => DOC_STATUS_OPTIONS}
            defaultStatus={() => DOC_STATUS_MISSING}
            onAdd={(label, status, options) => onChange({ rows: [...confirmation.rows, newStatusRow(label, status, options)] })}
          />
        )}
      />
    </div>
  );
}
