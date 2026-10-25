import StatusTable from './StatusTable';
import AddRow, { LICENSING_ADD_ROW_PROPS, newStatusRow } from '../AddRow';
import { useOnLock } from '../../utils/useOnLock';
import GrayOut from '../GrayOut';
import {
  SUBMISSION_OPTIONS, SUBMISSION_NOT_STARTED, SUBMISSION_IN_PROGRESS, SUBMISSION_NEEDS_FIX, SUBMISSION_DONE,
  ACTION_STATUS_NOT_SENT, ACTION_STATUS_SENT, ACTION_STATUS_PRESENT, ACTION_STATUS_NOT_REQUIRED,
  ACTION_STATUS_OPTIONS, MEETING_OPTIONS,
  MEETING_IN_COMMUNICATION, MEETING_SCHEDULED, MEETING_APPROVED,
  ACTION_LABEL_DEPOSIT, DEPOSIT_STATUS_OPTIONS, DEPOSIT_STATUS_NOT_RECEIVED, DEPOSIT_STATUS_RECEIVED,
  DEPOSIT_STATUS_PAID, DEPOSIT_STATUS_UPDATED, DEPOSIT_STATUS_NOT_REQUIRED,
  ACTION_LABEL_OWNERSHIP, OWNERSHIP_STATUS_OPTIONS,
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
      [SUBMISSION_NEEDS_FIX]:   'red',
      [SUBMISSION_DONE]:        'green',
    } },
  { key: 'note',     type: 'input', placeholder: 'הערה' },
  { key: 'reminder', type: 'reminder', header: 'תזכורת' },
];

const DEPOSIT_SELECT = {
  options: DEPOSIT_STATUS_OPTIONS,
  statusColors: {
    [DEPOSIT_STATUS_NOT_RECEIVED]: 'red',
    [DEPOSIT_STATUS_RECEIVED]:     'red',
    [DEPOSIT_STATUS_PAID]:         'red',
    [DEPOSIT_STATUS_UPDATED]:      'green',
    [DEPOSIT_STATUS_NOT_REQUIRED]: 'green',
  },
  doneValues: [DEPOSIT_STATUS_UPDATED, DEPOSIT_STATUS_NOT_REQUIRED],
};

const OWNERSHIP_SELECT = {
  options: OWNERSHIP_STATUS_OPTIONS,
  statusColors: {
    [ACTION_STATUS_NOT_SENT]: 'red',
    [ACTION_STATUS_SENT]:     'orange',
    [ACTION_STATUS_PRESENT]:  'green',
  },
  doneValues: [ACTION_STATUS_PRESENT],
};

// Rows that get their own dropdown instead of ACTION_STATUS_OPTIONS, by label.
const ROW_SELECTS = {
  [ACTION_LABEL_DEPOSIT]:   DEPOSIT_SELECT,
  [ACTION_LABEL_OWNERSHIP]: OWNERSHIP_SELECT,
};

const isActionDone = (a) => (ROW_SELECTS[a.label]
  ? ROW_SELECTS[a.label].doneValues.includes(a.status)
  : a.status === ACTION_STATUS_PRESENT || a.status === ACTION_STATUS_NOT_REQUIRED);

const ACTION_COLUMNS = [
  { key: 'label',    type: 'text',   header: 'פעולה' },
  { key: 'status',   type: 'select', header: 'סטטוס', options: ACTION_STATUS_OPTIONS,
    statusColors: {
      [ACTION_STATUS_NOT_SENT]:     'red',
      [ACTION_STATUS_SENT]:         'orange',
      [ACTION_STATUS_PRESENT]:      'green',
      [ACTION_STATUS_NOT_REQUIRED]: 'gray',
    },
    rowSelect: (row) => ROW_SELECTS[row.label] },
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

export default function RequestPhase({ request, conditionsPassed, onChange, reminders = [], onReminderChange, onClearReminders, onNext }) {
  const patch = (key, value) => onChange({ [key]: value });

  const allActionsDone = request.actions.every(isActionDone);

  // Note: conditionsPassed clearing is handled in LicensingTab (always mounted).
  // GrayOut reset: when meeting section becomes additionally grayed (actions not done).
  useOnLock(allActionsDone, () => onClearReminders?.(SK_MEETING));

  const sectionReminders = (sk) => reminders.filter(r => r.section_key === sk);

  return (
    <div className="licensing-info">
      <div className="detail-section">
        <h3 className="detail-section-title">מס' בקשה</h3>
        <div className="form-group request-number-field">
          <input
            type="text"
            dir="ltr"
            value={request.request_number}
            onChange={(e) => patch('request_number', e.target.value)}
            placeholder="מספר הבקשה ברשות הרישוי"
          />
        </div>
      </div>

      {/* Section 1 — Submission */}
      <StatusTable
        title="הגשה"
        showHeader={false}
        rows={[{ id: 'submission', label: 'הגשה', status: request.submission.status, note: request.submission.note }]}
        columns={SUBMISSION_COLUMNS}
        onChange={(next) => patch('submission', { status: next[0].status, note: next[0].note })}
        reminders={sectionReminders(SK_SUBMISSION)}
        onReminderChange={onReminderChange?.(SK_SUBMISSION)}
      />

      {/* Section 2 — Actions */}
      <GrayOut disabled={conditionsPassed !== true} reason="ממתין לאישור תנאים מקדמיים">
        <StatusTable
          title="פעולות"
          rows={request.actions}
          columns={ACTION_COLUMNS}
          onChange={(next) => patch('actions', next)}
          reminders={sectionReminders(SK_ACTIONS)}
          onReminderChange={onReminderChange?.(SK_ACTIONS)}
          footer={(
            <AddRow
              {...LICENSING_ADD_ROW_PROPS}
              existing={request.actions.map(a => a.label)}
              placeholder="שם השורה"
              onAdd={(label) => patch('actions', [...request.actions, newStatusRow(label, ACTION_STATUS_NOT_SENT)])}
            />
          )}
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
          onReminderChange={onReminderChange?.(SK_MEETING)}
          footer={request.meeting.status === MEETING_APPROVED
            ? <button className="btn btn-primary btn-sm" onClick={onNext}>עבור לשלב הבא ←</button>
            : null}
        />
      </GrayOut>
    </div>
  );
}
