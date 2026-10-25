import StatusTable from './StatusTable';
import AddRow, { LICENSING_ADD_ROW_PROPS, newStatusRow } from '../AddRow';
import { DOC_STATUS_MISSING, DOC_STATUS_PRESENT, DOC_STATUS_OPTIONS } from '../../constants';

const SK_CONFIRMATION = 'licensing.confirmation.rows';

const CONDITION_COLUMNS = [
  { key: 'label',    type: 'text',   header: 'תנאי' },
  { key: 'status',   type: 'select', header: 'סטטוס', options: DOC_STATUS_OPTIONS,
    statusColors: { [DOC_STATUS_PRESENT]: 'green', [DOC_STATUS_MISSING]: 'red' } },
  { key: 'note',     type: 'input',  header: 'הערה', placeholder: 'הערה' },
  { key: 'reminder', type: 'reminder', header: 'תזכורת' },
];

export default function ConfirmationPhase({ confirmation, onChange, reminders = [], onReminderChange }) {
  return (
    <div className="licensing-info">
      <StatusTable
        title="תנאים לאישור תחילת עבודה"
        rows={confirmation.rows}
        columns={CONDITION_COLUMNS}
        onChange={(next) => onChange({ rows: next })}
        reminders={reminders.filter(r => r.section_key === SK_CONFIRMATION)}
        onReminderChange={onReminderChange?.(SK_CONFIRMATION)}
        footer={(
          <AddRow
            {...LICENSING_ADD_ROW_PROPS}
            existing={confirmation.rows.map(r => r.label)}
            placeholder="שם התנאי"
            onAdd={(label) => onChange({ rows: [...confirmation.rows, newStatusRow(label, DOC_STATUS_MISSING)] })}
          />
        )}
      />
    </div>
  );
}
