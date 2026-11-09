import StatusTable from './StatusTable';
import AddRow, { LICENSING_ADD_ROW_PROPS, newStatusRow } from '../AddRow';
import { useOnLock } from '../../utils/useOnLock';
import GrayOut from '../GrayOut';
import { shownRows, mergeShownRows } from './questionRows';
import {
  SUBMISSION_OPTIONS, SUBMISSION_NOT_STARTED, SUBMISSION_IN_PROGRESS, SUBMISSION_NEEDS_FIX, SUBMISSION_DONE,
  ACTION_STATUS_NOT_SENT, ACTION_STATUS_SENT, ACTION_STATUS_PRESENT, ACTION_STATUS_NOT_REQUIRED,
  ACTION_STATUS_OPTIONS, MEETING_OPTIONS,
  MEETING_IN_COMMUNICATION, MEETING_SCHEDULED, MEETING_APPROVED,
  ACTION_LABEL_DEPOSIT, DEPOSIT_STATUS_OPTIONS, DEPOSIT_STATUS_NOT_RECEIVED, DEPOSIT_STATUS_RECEIVED,
  DEPOSIT_STATUS_PAID, DEPOSIT_STATUS_UPDATED, DEPOSIT_STATUS_NOT_REQUIRED,
  ACTION_LABEL_OWNERSHIP, OWNERSHIP_STATUS_OPTIONS,
  ACTION_LABEL_TRANSPORT, TRANSPORT_STATUS_OPTIONS,
  RELIEF_ACTIONS, RELIEF_STATUS_OPTIONS, RELIEF_STATUS_MISSING_TEXT, RELIEF_STATUS_CONTACT,
  RELIEF_STATUS_SENT, RELIEF_STATUS_RECEIVED, actionRowDefaultStatus,
  REQUEST_QUESTIONS, ANSWER_YES, ANSWER_NO,
  ACTION_LABEL_ONLINE_PERMIT, ONLINE_PERMIT_STATUS_OPTIONS, ONLINE_PERMIT_STATUS_DRAFT, ONLINE_PERMIT_STATUS_RETURNED,
  ACTION_LABEL_SUPERVISION, SUPERVISION_STATUS_OPTIONS, SUPERVISION_STATUS_DELIVERED,
  ACTION_LABEL_BUILDING_ASSIGN, BUILDING_ASSIGN_STATUS_OPTIONS, BUILDING_ASSIGN_STATUS_SIGNED,
  ACTION_LABEL_TAKANA, ACTION_LABEL_ESTATE_NOTICE, TAKANA_STATUS_OPTIONS, ESTATE_NOTICE_OLD_STATUS_OPTIONS,
  TEXT_STATUS_PREPARING, TEXT_STATUS_READY, TEXT_STATUS_CONTACTED, TEXT_STATUS_TO_COURIER,
  TEXT_STATUS_RECEIVED, TEXT_STATUS_NOT_RECEIVED,
} from '../../constants';

const REQUEST_NUMBER_FIELDS = [
  { key: 'request_number', label: "מס' בקשה", placeholder: 'מספר הבקשה ברשות הרישוי' },
  { key: 'online_request_number', label: "מס' בקשה לזמין", placeholder: 'מספר הבקשה ברישוי זמין' },
];

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

const TRANSPORT_SELECT = {
  options: TRANSPORT_STATUS_OPTIONS,
  statusColors: {
    [ACTION_STATUS_NOT_SENT]:     'red',
    [ACTION_STATUS_SENT]:         'orange',
    [ACTION_STATUS_PRESENT]:      'green',
    [ACTION_STATUS_NOT_REQUIRED]: 'gray',
  },
  doneValues: [ACTION_STATUS_PRESENT, ACTION_STATUS_NOT_REQUIRED],
};

const ONLINE_PERMIT_SELECT = {
  options: ONLINE_PERMIT_STATUS_OPTIONS,
  statusColors: {
    [ACTION_STATUS_NOT_SENT]:        'red',
    [ONLINE_PERMIT_STATUS_DRAFT]:    'orange',
    [ACTION_STATUS_SENT]:            'green',
    [ONLINE_PERMIT_STATUS_RETURNED]: 'red',
    [ACTION_STATUS_NOT_REQUIRED]:    'gray',
  },
  doneValues: [ACTION_STATUS_SENT, ACTION_STATUS_NOT_REQUIRED],
};

const SUPERVISION_SELECT = {
  options: SUPERVISION_STATUS_OPTIONS,
  statusColors: {
    [ACTION_STATUS_NOT_SENT]:       'red',
    [ACTION_STATUS_SENT]:           'orange',
    [SUPERVISION_STATUS_DELIVERED]: 'green',
  },
  doneValues: [SUPERVISION_STATUS_DELIVERED],
};

const BUILDING_ASSIGN_SELECT = {
  options: BUILDING_ASSIGN_STATUS_OPTIONS,
  statusColors: {
    [ACTION_STATUS_NOT_SENT]:        'red',
    [SUPERVISION_STATUS_DELIVERED]:  'orange',
    [BUILDING_ASSIGN_STATUS_SIGNED]: 'green',
    [ACTION_STATUS_NOT_REQUIRED]:    'gray',
  },
  doneValues: [BUILDING_ASSIGN_STATUS_SIGNED, ACTION_STATUS_NOT_REQUIRED],
};

// תקנה and פרסום עזבון: one dropdown. נשלח / לא התקבל are only on פרסום עזבון
// rows saved before, and keep their colours.
const TEXT_ROW_SELECT = {
  options: TAKANA_STATUS_OPTIONS,
  statusColors: {
    [TEXT_STATUS_PREPARING]:      'red',
    [TEXT_STATUS_READY]:          'orange',
    [TEXT_STATUS_CONTACTED]:      'orange',
    [TEXT_STATUS_TO_COURIER]:     'orange',
    [TEXT_STATUS_RECEIVED]:       'green',
    [ACTION_STATUS_NOT_REQUIRED]: 'gray',
    [ACTION_STATUS_SENT]:         'orange',
    [TEXT_STATUS_NOT_RECEIVED]:   'red',
  },
  doneValues: [TEXT_STATUS_RECEIVED, ACTION_STATUS_NOT_REQUIRED],
};

const RELIEF_SELECT = {
  options: RELIEF_STATUS_OPTIONS,
  statusColors: {
    [RELIEF_STATUS_MISSING_TEXT]: 'red',
    [RELIEF_STATUS_CONTACT]:      'orange',
    [RELIEF_STATUS_SENT]:         'orange',
    [RELIEF_STATUS_RECEIVED]:     'green',
  },
  doneValues: [RELIEF_STATUS_RECEIVED],
};

// Rows that get their own dropdown instead of ACTION_STATUS_OPTIONS, by label.
const ROW_SELECTS = {
  [ACTION_LABEL_DEPOSIT]:   DEPOSIT_SELECT,
  [ACTION_LABEL_OWNERSHIP]: OWNERSHIP_SELECT,
  [ACTION_LABEL_ONLINE_PERMIT]: ONLINE_PERMIT_SELECT,
  [ACTION_LABEL_SUPERVISION]: SUPERVISION_SELECT,
  [ACTION_LABEL_BUILDING_ASSIGN]: BUILDING_ASSIGN_SELECT,
  [ACTION_LABEL_TAKANA]: TEXT_ROW_SELECT,
  [ACTION_LABEL_ESTATE_NOTICE]: TEXT_ROW_SELECT,
  [ACTION_LABEL_TRANSPORT]: TRANSPORT_SELECT,
  ...Object.fromEntries(RELIEF_ACTIONS.map(label => [label, RELIEF_SELECT])),
};

// A row's own dropdown; a saved status that isn't in it any more stays listed.
const ACTION_STATUS_LABELS = Object.fromEntries(
  [ACTION_STATUS_OPTIONS, ...Object.values(ROW_SELECTS).map(s => s.options), ESTATE_NOTICE_OLD_STATUS_OPTIONS]
    .flat().map(o => [o.value, o.label]),
);
const actionRowSelect = (row) => {
  const select = ROW_SELECTS[row.label];
  if (!select || !row.status || select.options.some(o => o.value === row.status)) return select;
  return { ...select, options: [...select.options, { value: row.status, label: ACTION_STATUS_LABELS[row.status] || row.status }] };
};

// תקנה and פרסום עזבון share their first two steps: setting either one to
// הפקת נוסח or הופק נוסח sets the other to it as well — but only while the
// other is itself still at one of those steps, so its later progress is never undone.
const TEXT_ROWS = [ACTION_LABEL_TAKANA, ACTION_LABEL_ESTATE_NOTICE];
const SHARED_TEXT_STEPS = [TEXT_STATUS_PREPARING, TEXT_STATUS_READY];
export const syncTextRows = (prev, next) => {
  const changed = next.find(a => TEXT_ROWS.includes(a.label) && SHARED_TEXT_STEPS.includes(a.status)
    && prev.find(p => p.label === a.label)?.status !== a.status);
  if (!changed) return next;
  return next.map(a => (TEXT_ROWS.includes(a.label) && a.label !== changed.label && SHARED_TEXT_STEPS.includes(a.status)
    ? { ...a, status: changed.status }
    : a));
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
    rowSelect: actionRowSelect },
  { key: 'note',     type: 'input',  header: 'הערה', placeholder: '—' },
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

function YesNoToggle({ value, onChange }) {
  return (
    <div className="required-toggle" role="radiogroup">
      <button type="button" role="radio" aria-checked={value === ANSWER_YES} className={value === ANSWER_YES ? 'is-on' : ''} onClick={() => onChange(ANSWER_YES)}>כן</button>
      <button type="button" role="radio" aria-checked={value === ANSWER_NO} className={value === ANSWER_NO ? 'is-off' : ''} onClick={() => onChange(ANSWER_NO)}>לא</button>
    </div>
  );
}

export default function RequestPhase({ request, conditionsPassed, onChange, onAnswer, reminders = [], onReminderChange, onClearReminders, onNext }) {
  const patch = (key, value) => onChange({ [key]: value });

  // Only the rows the questions' answers call for count and show.
  const actions = shownRows(request.actions, 'actions', request);
  const allActionsDone = actions.every(isActionDone);

  // Note: conditionsPassed clearing is handled in LicensingTab (always mounted).
  // GrayOut reset: when meeting section becomes additionally grayed (actions not done).
  useOnLock(allActionsDone, () => onClearReminders?.(SK_MEETING));

  const sectionReminders = (sk) => reminders.filter(r => r.section_key === sk);

  return (
    <div className="licensing-info">
      <div className="detail-section request-numbers">
        {REQUEST_NUMBER_FIELDS.map(f => (
          <label key={f.key} className="request-number-row">
            <span className="request-number-label">{f.label}</span>
            <input
              type="text"
              dir="ltr"
              value={request[f.key]}
              onChange={(e) => patch(f.key, e.target.value)}
              placeholder={f.placeholder}
            />
          </label>
        ))}
      </div>

      {/* Questions: each "yes" adds rows to פעולות / תנאים */}
      <div className="detail-section request-questions">
        {REQUEST_QUESTIONS.map(q => (
          <div key={q.key} className="question-row">
            <span className="question-text">{q.text}</span>
            <YesNoToggle value={request[q.key]} onChange={(v) => onAnswer(q.key, v)} />
          </div>
        ))}
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
          rows={actions}
          columns={ACTION_COLUMNS}
          onChange={(next) => patch('actions', mergeShownRows(request.actions, syncTextRows(actions, next), 'actions', request))}
          reminders={sectionReminders(SK_ACTIONS)}
          onReminderChange={onReminderChange?.(SK_ACTIONS)}
          footer={(
            <AddRow
              {...LICENSING_ADD_ROW_PROPS}
              existing={request.actions.map(a => a.label)}
              placeholder="שם השורה"
              onAdd={(label) => patch('actions', [...request.actions, newStatusRow(label, actionRowDefaultStatus(label))])}
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
