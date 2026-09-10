import { useState, useEffect, useRef } from 'react';
import StatusTable from './StatusTable';
import GrayOut from '../GrayOut';
import {
  SUBMISSION_OPTIONS, SUBMISSION_NOT_STARTED, SUBMISSION_IN_PROGRESS, SUBMISSION_DONE,
  ACTION_STATUS_NOT_SENT, ACTION_STATUS_SENT, ACTION_STATUS_PRESENT, ACTION_STATUS_NOT_REQUIRED,
  ACTION_STATUS_OPTIONS, MEETING_OPTIONS,
  MEETING_IN_COMMUNICATION, MEETING_SCHEDULED, MEETING_APPROVED,
} from '../../constants';

const SK_SUBMISSION = 'licensing.application.submission';
const SK_ACTIONS    = 'licensing.application.actions';
const SK_MEETING    = 'licensing.application.meeting';

const SUBMISSION_COLUMNS = [
  { key: 'label',    type: 'text' },
  { key: 'status',   type: 'select', options: SUBMISSION_OPTIONS,
    statusColors: {
      [SUBMISSION_NOT_STARTED]: 'red',
      [SUBMISSION_IN_PROGRESS]: 'orange',
      [SUBMISSION_DONE]:        'green',
    } },
  { key: 'note',     type: 'input', placeholder: 'הערה' },
  { key: 'reminder', type: 'reminder', header: 'תזכורת' },
];

const ACTION_COLUMNS = [
  { key: 'label',    type: 'text',   header: 'פעולה' },
  { key: 'status',   type: 'select', header: 'סטטוס', options: ACTION_STATUS_OPTIONS,
    statusColors: {
      [ACTION_STATUS_NOT_SENT]:     'red',
      [ACTION_STATUS_SENT]:         'orange',
      [ACTION_STATUS_PRESENT]:      'green',
      [ACTION_STATUS_NOT_REQUIRED]: 'gray',
    } },
  { key: 'note',     type: 'input',  header: 'הערה', placeholder: 'הערה' },
  { key: 'reminder', type: 'reminder', header: 'תזכורת' },
];

const MEETING_COLUMNS = [
  { key: 'label',    type: 'text' },
  { key: 'status',   type: 'select', options: MEETING_OPTIONS,
    statusColors: {
      [MEETING_IN_COMMUNICATION]: 'orange',
      [MEETING_SCHEDULED]:        'orange',
      [MEETING_APPROVED]:         'green',
    } },
  { key: 'note',     type: 'input', placeholder: 'הערה' },
  { key: 'reminder', type: 'reminder', header: 'תזכורת' },
];

export default function RequestPhase({ request, conditionsPassed, onChange, reminders = [], onReminderChange, onClearReminders }) {
  const patch = (key, value) => onChange({ [key]: value });
  const [newLabel, setNewLabel] = useState('');
  const [addingRow, setAddingRow] = useState(false);

  const allActionsDone = request.actions.every(
    a => a.status === ACTION_STATUS_PRESENT || a.status === ACTION_STATUS_NOT_REQUIRED
  );

  const confirmAddAction = () => {
    const label = newLabel.trim();
    if (label) {
      onChange({
        actions: [
          ...request.actions,
          { id: crypto.randomUUID(), label, status: ACTION_STATUS_NOT_SENT, note: '' },
        ],
      });
    }
    setNewLabel('');
    setAddingRow(false);
  };

  // Note: conditionsPassed clearing is handled in LicensingTab (always mounted).
  // GrayOut reset: when meeting section becomes additionally grayed (actions not done).
  const prevAllActionsDone = useRef(allActionsDone);
  useEffect(() => {
    if (!allActionsDone && prevAllActionsDone.current) {
      onClearReminders?.(SK_MEETING);
    }
    prevAllActionsDone.current = allActionsDone;
  }, [allActionsDone, onClearReminders]);

  const sectionReminders = (sk) => reminders.filter(r => r.section_key === sk);

  return (
    <div className="licensing-info">
      {/* Section 1 — Submission */}
      <StatusTable
        title="הגשה"
        showHeader={false}
        rows={[{ id: 'submission', label: 'הגשה', status: request.submission.status, note: request.submission.note }]}
        columns={SUBMISSION_COLUMNS}
        onChange={(next) => patch('submission', { status: next[0].status, note: next[0].note })}
        reminders={sectionReminders(SK_SUBMISSION)}
        onReminderChange={(rl, days) => onReminderChange?.(SK_SUBMISSION)(rl, days)}
      />

      {/* Section 2 — Actions */}
      <GrayOut disabled={conditionsPassed !== true} reason="ממתין לאישור תנאים מקדמיים">
        <StatusTable
          title="פעולות"
          rows={request.actions}
          columns={ACTION_COLUMNS}
          onChange={(next) => patch('actions', next)}
          reminders={sectionReminders(SK_ACTIONS)}
          onReminderChange={(rl, days) => onReminderChange?.(SK_ACTIONS)(rl, days)}
          footer={
            addingRow ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  autoFocus
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmAddAction();
                    if (e.key === 'Escape') { setNewLabel(''); setAddingRow(false); }
                  }}
                  placeholder="שם השורה"
                  style={{ flex: 1, maxWidth: 220 }}
                />
                <button className="btn btn-primary btn-sm" onClick={confirmAddAction}>הוסף</button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setNewLabel(''); setAddingRow(false); }}>ביטול</button>
              </div>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => setAddingRow(true)}>+ הוסף שורה</button>
            )
          }
        />
      </GrayOut>

      {/* Section 3 — Meeting */}
      <GrayOut disabled={conditionsPassed !== true || !allActionsDone} reason="ממתין לסיום כל הפעולות">
        <StatusTable
          title="ישיבה"
          showHeader={false}
          rows={[{
            id: 'meeting',
            label: 'ישיבה',
            status: request.meeting.status || '',
            note: request.meeting.note || '',
          }]}
          columns={MEETING_COLUMNS}
          onChange={(next) => onChange({
            meeting: { status: next[0].status || null, note: next[0].note },
          })}
          reminders={sectionReminders(SK_MEETING)}
          onReminderChange={(rl, days) => onReminderChange?.(SK_MEETING)(rl, days)}
          footer={request.meeting.status === MEETING_APPROVED
            ? <span style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: 14 }}>✓ עבור לשלב הבא</span>
            : null}
        />
      </GrayOut>
    </div>
  );
}
