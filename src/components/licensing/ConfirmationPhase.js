import { useState } from 'react';
import StatusTable from './StatusTable';
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
  const [newLabel, setNewLabel] = useState('');
  const [addingRow, setAddingRow] = useState(false);

  const confirmAddRow = () => {
    const label = newLabel.trim();
    if (label) {
      onChange({
        rows: [
          ...confirmation.rows,
          { id: crypto.randomUUID(), label, status: DOC_STATUS_MISSING, note: '' },
        ],
      });
    }
    setNewLabel('');
    setAddingRow(false);
  };

  return (
    <div className="licensing-info">
      <StatusTable
        title="תנאים לאישור תחילת עבודה"
        rows={confirmation.rows}
        columns={CONDITION_COLUMNS}
        onChange={(next) => onChange({ rows: next })}
        reminders={reminders.filter(r => r.section_key === SK_CONFIRMATION)}
        onReminderChange={(rl, days) => onReminderChange?.(SK_CONFIRMATION)(rl, days)}
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
    </div>
  );
}
