// What the client summary PDF shows, as plain data: for each of the client's
// case types, every section the page shows from the first stage up to the
// one the client is at now (later, still-locked sections are left out).
// Rows, dropdown labels and colours come from the tabs' own definitions, so
// the summary always reads like the page.
import {
  TYPE_LICENSING, TYPE_PLANNING, TYPE_DETAILED, CLIENT_TYPES,
  LICENSING_PHASES, LICENSING_PHASE_INFO, LICENSING_PHASE_APPLICATION,
  LICENSING_PHASE_CONDITIONS, LICENSING_PHASE_CONFIRMATION,
  DOC_STATUS_MISSING, ONLINE_INFO_OPTIONS, ONLINE_INFO_NOT_SENT, ONLINE_INFO_RECEIVED, ONLINE_INFO_ROW_LABEL,
  MEETING_APPROVED, PERMIT_STATUS_SIGNED, isConditionRowDone,
  REQUEST_QUESTIONS, YES_NO_OPTIONS,
  DETAILED_HACHANA_KEN, DETAILED_SHUBATS, DETAILED_HITKABEL, FIELD_DETAILED_DATA,
} from '../constants';
import { buildInitialLd, computeCurrentPhase } from '../components/LicensingTab';
import {
  buildInitialPd, rowSelect as planningRowSelect, archRowsOf, constructionRowsOf, getCurrentPlanningStageLabel,
} from '../components/PlanningTab';
import {
  buildInitialDetailed, HACHANA_COLS, HAFKADA_COLS, PIRSOOM_COLS, ISHUR_COLS,
} from '../components/DetailedTab';
import { DOC_COLUMNS, DOC_LABELS, ONLINE_INFO_STATUS_COLORS, PERSON_FIELDS } from '../components/licensing/InfoPhase';
import {
  REQUEST_NUMBER_FIELDS, SUBMISSION_COLUMNS, ACTION_COLUMNS, MEETING_COLUMNS, isActionDone,
} from '../components/licensing/RequestPhase';
import { CONDITION_COLUMNS, PERMIT_COLUMNS } from '../components/licensing/ConditionsPhase';
import { CONFIRMATION_COLUMNS } from '../components/licensing/ConfirmationPhase';
import { shownRows } from '../components/licensing/questionRows';
import { helkaToStrings } from './land';

// A row's status as the page shows it: the label from its dropdown, and its colour.
export function statusOf(columns, row) {
  const col = columns.find(c => c.type === 'select');
  if (!col) return null;
  const { options = [], statusColors } = { ...col, ...col.rowSelect?.(row) };
  const value = row[col.key] ?? '';
  return {
    label: options.find(o => o.value === value)?.label || '—',
    color: statusColors?.[value] || null,
  };
}

// A status table: one row per step — name, status, note.
const table = (title, columns, rows, { showHeader = true } = {}) => {
  const header = (key, fallback) => columns.find(c => c.key === key || (key === 'note' && c.key === 'notes'))?.header || fallback;
  return {
    kind: 'table',
    title,
    headers: showHeader ? [header('label', ''), header('status', 'סטטוס'), header('note', 'הערה')] : null,
    rows: rows.map(r => ({
      label: r.label,
      status: statusOf(columns, r),
      note: r.note ?? r.notes ?? '',
    })),
  };
};

// Empty fields, people and texts are left out; a section with nothing left
// in it is left out altogether (null, dropped by the summary).
const isEmpty = (v) => v === null || v === undefined || String(v).trim() === '';

const fields = (title, list) => {
  const filled = list.filter(f => !isEmpty(f.value));
  return filled.length ? { kind: 'fields', title, fields: filled } : null;
};

// Only the columns someone filled in, for the people who have anything filled in.
const people = (title, list) => {
  const persons = (list || []).filter(p => PERSON_FIELDS.some(f => !isEmpty(p[f.key])));
  const cols = PERSON_FIELDS.filter(f => persons.some(p => !isEmpty(p[f.key])));
  if (!persons.length) return null;
  return {
    kind: 'people',
    title,
    headers: cols.map(f => f.label),
    rows: persons.map(p => cols.map(f => p[f.key] || '')),
  };
};

const text = (title, value) => (isEmpty(value) ? null : { kind: 'text', title, text: value });
const phase = (title) => ({ kind: 'phase', title });

const landFields = (client) => {
  const helka = helkaToStrings(client.helka).filter(Boolean);
  return [
    { label: 'עיר', value: client.city || '' },
    { label: 'גוש', value: client.gush ?? '' },
    { label: 'חלקה', value: helka.join(', ') },
    { label: 'מגרש', value: client.migrash ?? '' },
  ];
};

const answerLabel = (v) => YES_NO_OPTIONS.find(o => o.value === v)?.label || '';

// ── רישוי ──
function licensingSummary(client) {
  const ld = buildInitialLd(client);
  const { info, application, conditions, confirmation } = ld;

  const current = computeCurrentPhase(ld);
  const needsStartApproval = conditions.needs_start_approval === 'yes';
  const phases = needsStartApproval ? LICENSING_PHASES : LICENSING_PHASES.filter(p => p.key !== LICENSING_PHASE_CONFIRMATION);
  const currentIdx = phases.findIndex(p => p.key === current);

  const conditionsPassed = info.online_info_status === ONLINE_INFO_RECEIVED;
  const meetingApproved = application.meeting?.status === MEETING_APPROVED;
  const conditionsComplete = conditions.permit_status === PERMIT_STATUS_SIGNED && conditions.needs_start_approval !== null;
  const done = {
    [LICENSING_PHASE_INFO]: conditionsPassed,
    [LICENSING_PHASE_APPLICATION]: meetingApproved,
    [LICENSING_PHASE_CONDITIONS]: conditionsComplete,
  };

  const blocks = [
    fields('פרטי קרקע', landFields(client)),
    people('פרטי מבקש', info.requesters),
    people('בעלי זכות', info.rights_holders),
    text('מהות בקשה', info.description),
  ];

  phases.slice(0, currentIdx + 1).forEach(p => {
    blocks.push(phase(p.label));

    if (p.key === LICENSING_PHASE_INFO) {
      blocks.push(table('מסמכים נדרשים', DOC_COLUMNS, info.documents.map(d => ({ ...d, label: DOC_LABELS[d.type] }))));
      if (info.documents.every(d => d.status !== DOC_STATUS_MISSING)) {
        const showNumber = info.online_info_status !== ONLINE_INFO_NOT_SENT && info.online_info_number;
        blocks.push(table(null, [
          { key: 'label', type: 'text' },
          { key: 'status', type: 'select', options: ONLINE_INFO_OPTIONS, statusColors: ONLINE_INFO_STATUS_COLORS },
        ], [{
          label: ONLINE_INFO_ROW_LABEL,
          status: info.online_info_status,
          note: [showNumber ? `מספר בקשת מידע בזמין: ${info.online_info_number}` : '', info.online_info_note]
            .filter(Boolean).join(' · '),
        }], { showHeader: false }));
      }
    }

    if (p.key === LICENSING_PHASE_APPLICATION) {
      blocks.push(fields(null, [
        ...REQUEST_NUMBER_FIELDS.map(f => ({ label: f.label, value: application[f.key] || '' })),
        ...REQUEST_QUESTIONS.map(q => ({ label: q.text, value: answerLabel(application[q.key]) })),
      ]));
      blocks.push(table('הגשה', SUBMISSION_COLUMNS,
        [{ label: 'הגשה', status: application.submission.status, note: application.submission.note }],
        { showHeader: false }));
      if (conditionsPassed) {
        const actions = shownRows(application.actions, 'actions', application);
        blocks.push(table('פעולות', ACTION_COLUMNS, actions));
        if (actions.every(isActionDone)) {
          blocks.push(table('ישיבה', MEETING_COLUMNS,
            [{ label: 'ישיבה', status: application.meeting.status || '', note: application.meeting.note || '' }],
            { showHeader: false }));
        }
      }
    }

    if (p.key === LICENSING_PHASE_CONDITIONS && meetingApproved) {
      const rows = shownRows(conditions.rows, 'conditions', application);
      blocks.push(table('תנאים', CONDITION_COLUMNS, rows));
      if (rows.every(isConditionRowDone)) {
        blocks.push(table('היתר', PERMIT_COLUMNS,
          [{ label: 'היתר', status: conditions.permit_status, note: conditions.permit_note }],
          { showHeader: false }));
        if (conditions.permit_status === PERMIT_STATUS_SIGNED) {
          blocks.push(fields(null, [{ label: 'האם צריך אישור תחילת עבודה?', value: answerLabel(conditions.needs_start_approval) }]));
        }
      }
    }

    if (p.key === LICENSING_PHASE_CONFIRMATION) {
      blocks.push(table('תנאים לאישור תחילת עבודה', CONFIRMATION_COLUMNS, confirmation.rows));
    }
  });

  return {
    title: TYPE_LICENSING,
    current: phases[currentIdx]?.label || '',
    blocks: blocks.filter(Boolean),
    stepper: phases.map((p, i) => ({
      label: p.label,
      state: done[p.key] ? 'done' : i === currentIdx ? 'current' : 'todo',
    })),
  };
}

// ── תכנון ── (no fixed order between its tables, so all of them show)
function planningSummary(client) {
  const pd = buildInitialPd(client);
  const cols = (first) => [
    { key: 'label', type: 'text', header: first },
    { key: 'status', type: 'select', header: 'סטטוס', rowSelect: planningRowSelect },
    { key: 'notes', type: 'input', header: 'הערות' },
  ];
  const blocks = [
    text('דרישות לקוח', pd.client_requirements),
    text('הערות', pd.notes),
    pd.architecture_required
      ? table('אדריכלות', cols('שלב'), archRowsOf(pd.tables))
      : { kind: 'notice', title: 'אדריכלות', text: 'אדריכלות לא נדרשת ללקוח זה.' },
    table('קונסטרוקציה', cols('שלב'), constructionRowsOf(pd.tables)),
  ];
  return { title: TYPE_PLANNING, current: getCurrentPlanningStageLabel(client), stepper: null, blocks: blocks.filter(Boolean) };
}

// ── תיק מפורט ── (each step opens the next)
const DETAILED_STEPS = [
  { key: 'hachana',  title: 'הכנה',   cols: HACHANA_COLS, done: (s) => s === DETAILED_HACHANA_KEN },
  { key: 'hafkada',  title: 'הפקדה',  cols: HAFKADA_COLS, done: (s) => s === DETAILED_SHUBATS },
  { key: 'pirsum_a', title: 'פירסום', cols: PIRSOOM_COLS, done: (s) => s === DETAILED_HITKABEL },
  { key: 'ishur',    title: 'אישור',  cols: ISHUR_COLS,   done: (s) => s === DETAILED_SHUBATS },
  { key: 'pirsum_b', title: 'פירסום', cols: PIRSOOM_COLS, done: () => false },
];

function detailedSummary(client) {
  const dd = buildInitialDetailed(client, client[FIELD_DETAILED_DATA]);
  const blocks = [
    people('פרטי מבקש', dd.info.requesters),
    fields('פרטי קרקע', landFields(client)),
    text('מהות הבקשה', dd.info.description),
  ];
  let current = '';
  for (const step of DETAILED_STEPS) {
    const entry = dd[step.key];
    blocks.push(table(step.title, step.cols, [{ label: step.title, status: entry.status, note: entry.note }], { showHeader: false }));
    current = step.title;
    if (!step.done(entry.status)) break;
  }
  return { title: TYPE_DETAILED, current, stepper: null, blocks: blocks.filter(Boolean) };
}

const SUMMARIES = {
  [TYPE_LICENSING]: licensingSummary,
  [TYPE_PLANNING]: planningSummary,
  [TYPE_DETAILED]: detailedSummary,
};

export function buildClientSummary(client) {
  const types = CLIENT_TYPES.filter(t => (client.client_type || []).includes(t));
  return {
    name: client.name || '',
    general: fields('פרטים כלליים', [
      { label: 'טלפון', value: client.phone },
      { label: 'אימייל', value: client.email },
      ...landFields(client),
      { label: 'הערות', value: client.notes },
    ]),
    types,
    tabs: types.map(t => SUMMARIES[t](client)),
  };
}
