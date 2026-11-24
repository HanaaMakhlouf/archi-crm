import { newStatusRow } from '../AddRow';
import { makeEmptyPerson } from './PersonForm';
import {
  FIELD_LICENSING_DATA, LICENSING_PHASE_INFO, LICENSING_PHASE_APPLICATION,
  LICENSING_PHASE_CONDITIONS, LICENSING_PHASE_CONFIRMATION, LICENSING_PHASE_FORM4,
  LICENSING_PHASES, DEFAULT_FORM4_ROWS, FORM4_STATUS_NO, isConfirmationRowDone,
  LICENSING_DOCUMENTS, DOC_STATUS_MISSING, INFO_NOTE_SENT, ONLINE_INFO_NOT_SENT, ONLINE_INFO_SENT,
  ONLINE_INFO_PASSED, ONLINE_INFO_RECEIVED, SUBMISSION_NOT_STARTED, DEFAULT_REQUEST_ACTIONS,
  PERMIT_STATUS_FEE_NOT_GIVEN, PERMIT_STATUS_FEE_GIVEN, PERMIT_STATUS_NOT_PRINTED, isPermitSigned,
  FEE_STATUS_NOT_ISSUED, FEE_STATUS_PAID, DEFAULT_CONDITION_ROWS, RENAMED_CONDITION_ROWS,
  conditionRowOptions, CONDITION_HASHBACHA, CONDITION_CORP, CONDITION_CORP_145D,
  isConditionRowDone, CONDITION_ROW_STATUS_SENT, COND_MISSING_DOCS, COND_SENT_COMMITTEE,
  DEFAULT_CONFIRMATION_ROWS, MEETING_APPROVED, CONDITIONS_STATUS_NOT_SENT,
  CONDITIONS_STATUS_PASSED, CONDITIONS_STATUS_RETURNED, CONDITIONS_STATUS_RECEIVED, Q_PUBLIC_USE,
  Q_RELIEFS, actionRowDefaultStatus, ACTION_LABEL_DEPOSIT, ACTION_LABEL_ONLINE_PERMIT,
  ACTION_LABEL_SUPERVISION, REMOVED_REQUEST_ACTIONS, ACTION_LABEL_BUILDING_ASSIGN,
  BUILDING_ASSIGN_STATUS_FROM_OLD, ACTION_LABEL_TAKANA, TAKANA_STATUS_FROM_OLD,
  ACTION_LABEL_ESTATE_NOTICE, ESTATE_NOTICE_STATUS_FROM_OLD,
} from '../../constants';

// A client's licensing data (client.licensing_data) as the licensing tab works
// with it: every phase filled in, and data saved by older versions brought up
// to date (renamed rows, new rows, moved statuses) without losing anything.
// Plus which phase the client is at now.

const migrateConditionsPassed = (val) => {
  if (val === true) return CONDITIONS_STATUS_RECEIVED;
  if (typeof val === 'string' && val.startsWith('cond_')) return val;
  return CONDITIONS_STATUS_NOT_SENT;
};

// Clients saved before בקשת מידע לזמין: the old שלח בקשת מידע + תנאים מקדמיים
// rows become its status, and their notes its note.
const migrateOnlineInfo = (existing) => {
  const cond = migrateConditionsPassed(existing.conditions_passed);
  if (cond === CONDITIONS_STATUS_RECEIVED) return ONLINE_INFO_RECEIVED;
  if (cond === CONDITIONS_STATUS_PASSED) return ONLINE_INFO_PASSED;
  if (cond !== CONDITIONS_STATUS_NOT_SENT || existing.info_note_status === INFO_NOTE_SENT) return ONLINE_INFO_SENT;
  return ONLINE_INFO_NOT_SENT;
};
// הועבר לתיקון has no place in the new dropdown (it becomes נשלח), so it's kept in the note.
const migrateOnlineInfoNote = (existing) => [
  migrateConditionsPassed(existing.conditions_passed) === CONDITIONS_STATUS_RETURNED ? 'הועבר לתיקון' : '',
  existing.info_note_note,
  existing.conditions_note,
].filter(Boolean).join(' · ');

const buildInitialInfo = (client, src = {}) => {
  const existing = src || {};
  const seedPerson = () => makeEmptyPerson({
    name: client.name || '',
    phone: client.phone || '',
    email: client.email || '',
  });

  return {
    // Fields this tab no longer shows (e.g. the old info_note_* / conditions_*)
    // are kept as saved, so nothing a worker entered is ever dropped.
    ...existing,
    requesters: existing.requesters?.length
      ? existing.requesters
      : [seedPerson()],
    rights_holders: existing.rights_holders?.length
      ? existing.rights_holders
      : [seedPerson()],
    description: existing.description || '',
    documents: LICENSING_DOCUMENTS.map(d => {
      const found = existing.documents?.find(x => x.type === d.type);
      return found || { type: d.type, status: DOC_STATUS_MISSING, note: '' };
    }),
    online_info_status: existing.online_info_status || migrateOnlineInfo(existing),
    online_info_number: existing.online_info_number || '',
    online_info_note: existing.online_info_note ?? migrateOnlineInfoNote(existing),
  };
};

// Rows that moved off the generic dropdown: old status → its new one.
const ACTION_STATUS_FROM_OLD = {
  [ACTION_LABEL_BUILDING_ASSIGN]: BUILDING_ASSIGN_STATUS_FROM_OLD,
  [ACTION_LABEL_TAKANA]: TAKANA_STATUS_FROM_OLD,
  [ACTION_LABEL_ESTATE_NOTICE]: ESTATE_NOTICE_STATUS_FROM_OLD,
};

// Brings an existing client's פעולות up to date: drops rows no longer used,
// moves rows with their own dropdown to its statuses and adds בקשה לרישוי זמין
// + פיקוח after פקדון (3rd and 4th).
const NEW_ACTION_ROWS = [ACTION_LABEL_ONLINE_PERMIT, ACTION_LABEL_SUPERVISION];
const migrateActionRows = (saved) => {
  const actions = saved
    .filter(a => !REMOVED_REQUEST_ACTIONS.includes(a.label))
    .map(a => {
      const status = ACTION_STATUS_FROM_OLD[a.label]?.[a.status];
      return status ? { ...a, status } : a;
    });
  const missing = NEW_ACTION_ROWS.filter(label => !actions.some(a => a.label === label));
  if (!missing.length) return actions;
  const at = actions.findIndex(a => a.label === ACTION_LABEL_DEPOSIT) + 1 || Math.min(2, actions.length);
  const rows = missing.map(label => newStatusRow(label, actionRowDefaultStatus(label)));
  return [...actions.slice(0, at), ...rows, ...actions.slice(at)];
};

const buildInitialRequest = (src = {}) => {
  const existing = src || {};
  return {
    request_number: existing.request_number || '',
    online_request_number: existing.online_request_number || '',
    submission: {
      status: existing.submission?.status || existing.submission_status || SUBMISSION_NOT_STARTED,
      note: existing.submission?.note || '',
    },
    actions: existing.actions?.length
      ? migrateActionRows(existing.actions)
      : DEFAULT_REQUEST_ACTIONS.map(label => newStatusRow(label, actionRowDefaultStatus(label))),
    meeting: {
      status: existing.meeting?.status ?? null,
      note: existing.meeting?.note || '',
    },
    [Q_PUBLIC_USE]: existing[Q_PUBLIC_USE] ?? null,
    [Q_RELIEFS]: existing[Q_RELIEFS] ?? null,
  };
};

export const newConditionRow = (label) => newStatusRow(label, conditionRowOptions(label)[0].value);

// Statuses saved under the old פטור 140 dropdown, in השבחה's terms.
const HASHBACHA_STATUS_FROM_OLD = { [DOC_STATUS_MISSING]: COND_MISSING_DOCS, [CONDITION_ROW_STATUS_SENT]: COND_SENT_COMMITTEE };

// Brings an existing client's rows up to date: renamed rows get their new name
// (and השבחה its new statuses), and 145 ד תאגיד is added after התייחסות תאגיד —
// only while the conditions are still open, so clients already past this step
// don't get their היתר locked again.
const migrateConditionRows = (rows) => {
  let next = rows.map(r => {
    const label = RENAMED_CONDITION_ROWS[r.label];
    if (!label) return r;
    const status = label === CONDITION_HASHBACHA ? (HASHBACHA_STATUS_FROM_OLD[r.status] || r.status) : r.status;
    return { ...r, label, status };
  });
  if (!next.some(r => r.label === CONDITION_CORP_145D) && !next.every(isConditionRowDone)) {
    const at = next.findIndex(r => r.label === CONDITION_CORP);
    next = [...next.slice(0, at + 1), newConditionRow(CONDITION_CORP_145D), ...next.slice(at + 1)];
  }
  return next;
};

// Clients saved before אגרות had its own row: היתר's old fee steps tell the
// fee's status (handed over, or already printed / signed, means it was paid).
const OLD_FEE_STEPS = [PERMIT_STATUS_FEE_NOT_GIVEN, PERMIT_STATUS_FEE_GIVEN];
const feeFromOldPermit = (permit) => (permit && permit !== PERMIT_STATUS_FEE_NOT_GIVEN ? FEE_STATUS_PAID : FEE_STATUS_NOT_ISSUED);

const buildInitialConditions = (src = {}) => ({
  rows: src.rows?.length
    ? migrateConditionRows(src.rows)
    : DEFAULT_CONDITION_ROWS.map(newConditionRow),
  fee_status: src.fee_status || feeFromOldPermit(src.permit_status),
  fee_note: src.fee_note || '',
  permit_status: !src.permit_status || OLD_FEE_STEPS.includes(src.permit_status) ? PERMIT_STATUS_NOT_PRINTED : src.permit_status,
  permit_note: src.permit_note || '',
  needs_start_approval: src.needs_start_approval ?? null,
  open_form4: src.open_form4 ?? null,
});

const buildInitialConfirmation = (src = {}) => ({
  rows: src.rows?.length
    ? src.rows
    : DEFAULT_CONFIRMATION_ROWS.map(label => newStatusRow(label, DOC_STATUS_MISSING)),
});

const buildInitialForm4 = (src = {}) => ({
  rows: src?.rows?.length
    ? src.rows
    : DEFAULT_FORM4_ROWS.map(label => newStatusRow(label, FORM4_STATUS_NO)),
});

export const buildInitialLd = (client) => {
  const src = client[FIELD_LICENSING_DATA] || {};
  return {
    info: buildInitialInfo(client, src.info),
    application: buildInitialRequest(src.application),
    conditions: buildInitialConditions(src.conditions),
    confirmation: buildInitialConfirmation(src.confirmation),
    form4: buildInitialForm4(src.form4),
  };
};

// Derives the real current phase from progress, so the stepper always opens
// on where the client actually stands rather than whatever was last clicked.
export const computeCurrentPhase = (ld) => {
  const conditionsPassed = ld.info.online_info_status === ONLINE_INFO_RECEIVED;
  const meetingApproved = ld.application.meeting?.status === MEETING_APPROVED;
  const conditionsComplete = isPermitSigned(ld.conditions) && ld.conditions.needs_start_approval !== null;
  if (!conditionsPassed) return LICENSING_PHASE_INFO;
  if (!meetingApproved) return LICENSING_PHASE_APPLICATION;
  if (!conditionsComplete) return LICENSING_PHASE_CONDITIONS;
  // אישור התחלת עבודה / תנאים טופס 4 only exist once תנאים answered "yes" to them;
  // טופס 4 comes after אישור התחלת עבודה is done.
  const startApproval = ld.conditions.needs_start_approval === 'yes';
  const form4 = ld.conditions.open_form4 === 'yes';
  if (startApproval && !(form4 && ld.confirmation.rows.every(isConfirmationRowDone))) return LICENSING_PHASE_CONFIRMATION;
  if (form4) return LICENSING_PHASE_FORM4;
  return LICENSING_PHASE_CONDITIONS;
};

// For the clients list: which licensing phase this client is currently at.
export function getCurrentLicensingPhaseLabel(client) {
  const phaseKey = computeCurrentPhase(buildInitialLd(client));
  return LICENSING_PHASES.find(p => p.key === phaseKey)?.label || '';
}
