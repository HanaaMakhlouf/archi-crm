import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import PhaseStepper from './licensing/PhaseStepper';
import InfoPhase from './licensing/InfoPhase';
import RequestPhase from './licensing/RequestPhase';
import ConditionsPhase from './licensing/ConditionsPhase';
import ConfirmationPhase from './licensing/ConfirmationPhase';
import GrayOut from './GrayOut';
import { newStatusRow } from './AddRow';
import { makeEmptyPerson } from './licensing/PersonForm';
import { useDeferredSave } from '../utils/useDeferredSave';
import { useOnLock } from '../utils/useOnLock';
import {
  FIELD_LICENSING_DATA,
  LICENSING_PHASE_INFO, LICENSING_PHASE_APPLICATION,
  LICENSING_PHASE_CONDITIONS, LICENSING_PHASE_CONFIRMATION,
  LICENSING_PHASES,
  LICENSING_DOCUMENTS,
  DOC_STATUS_MISSING,
  INFO_NOTE_NOT_SENT,
  SUBMISSION_NOT_STARTED,
  ACTION_STATUS_NOT_SENT,
  DEFAULT_REQUEST_ACTIONS,
  PERMIT_STATUS_FEE_NOT_GIVEN, PERMIT_STATUS_SIGNED,
  DEFAULT_CONDITION_ROWS, RENAMED_CONDITION_ROWS, conditionRowOptions,
  CONDITION_HASHBACHA, CONDITION_CORP, CONDITION_CORP_145D,
  isConditionRowDone, CONDITION_ROW_STATUS_SENT, COND_MISSING_DOCS, COND_SENT_COMMITTEE,
  DEFAULT_CONFIRMATION_ROWS,
  MEETING_APPROVED,
  CONDITIONS_STATUS_NOT_SENT,
  CONDITIONS_STATUS_RECEIVED,
} from '../constants';

const migrateConditionsPassed = (val) => {
  if (val === true) return CONDITIONS_STATUS_RECEIVED;
  if (typeof val === 'string' && val.startsWith('cond_')) return val;
  return CONDITIONS_STATUS_NOT_SENT;
};

const buildInitialInfo = (client, src = {}) => {
  const existing = src || {};
  const seedPerson = () => makeEmptyPerson({
    name: client.name || '',
    phone: client.phone || '',
    email: client.email || '',
  });

  return {
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
    info_note_status: existing.info_note_status || INFO_NOTE_NOT_SENT,
    info_note_note: existing.info_note_note || '',
    conditions_passed: migrateConditionsPassed(existing.conditions_passed),
    conditions_note: existing.conditions_note || '',
  };
};

const buildInitialRequest = (src = {}) => {
  const existing = src || {};
  return {
    request_number: existing.request_number || '',
    submission: {
      status: existing.submission?.status || existing.submission_status || SUBMISSION_NOT_STARTED,
      note: existing.submission?.note || '',
    },
    actions: existing.actions?.length
      ? existing.actions
      : DEFAULT_REQUEST_ACTIONS.map(label => newStatusRow(label, ACTION_STATUS_NOT_SENT)),
    meeting: {
      status: existing.meeting?.status ?? null,
      note: existing.meeting?.note || '',
    },
  };
};

const newConditionRow = (label) => newStatusRow(label, conditionRowOptions(label)[0].value);

// Statuses saved under the old פטור 140 dropdown, in השבחה's terms.
const HASHBACHA_STATUS_FROM_OLD = { [DOC_STATUS_MISSING]: COND_MISSING_DOCS, [CONDITION_ROW_STATUS_SENT]: COND_SENT_COMMITTEE };

// Brings an existing client's rows up to date: renamed rows get their new name
// (and השבחה its new statuses), and 145 ד תאגיד is added after התייחסות תאגיד —
// only while the conditions are still open, so clients already past this step
// don't get their התר locked again.
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

const buildInitialConditions = (src = {}) => ({
  rows: src.rows?.length
    ? migrateConditionRows(src.rows)
    : DEFAULT_CONDITION_ROWS.map(newConditionRow),
  permit_status: src.permit_status || PERMIT_STATUS_FEE_NOT_GIVEN,
  permit_note: src.permit_note || '',
  needs_start_approval: src.needs_start_approval ?? null,
});

const buildInitialConfirmation = (src = {}) => ({
  rows: src.rows?.length
    ? src.rows
    : DEFAULT_CONFIRMATION_ROWS.map(label => newStatusRow(label, DOC_STATUS_MISSING)),
});

const buildInitialLd = (client) => {
  const src = client[FIELD_LICENSING_DATA] || {};
  return {
    info: buildInitialInfo(client, src.info),
    application: buildInitialRequest(src.application),
    conditions: buildInitialConditions(src.conditions),
    confirmation: buildInitialConfirmation(src.confirmation),
  };
};

// Derives the real current phase from progress, so the stepper always opens
// on where the client actually stands rather than whatever was last clicked.
const computeCurrentPhase = (ld) => {
  const conditionsPassed = ld.info.conditions_passed === CONDITIONS_STATUS_RECEIVED;
  const meetingApproved = ld.application.meeting?.status === MEETING_APPROVED;
  const conditionsComplete = ld.conditions.permit_status === PERMIT_STATUS_SIGNED && ld.conditions.needs_start_approval !== null;
  if (!conditionsPassed) return LICENSING_PHASE_INFO;
  if (!meetingApproved) return LICENSING_PHASE_APPLICATION;
  if (!conditionsComplete) return LICENSING_PHASE_CONDITIONS;
  return LICENSING_PHASE_CONFIRMATION;
};

// For the clients list: which licensing phase this client is currently at.
export function getCurrentLicensingPhaseLabel(client) {
  const phaseKey = computeCurrentPhase(buildInitialLd(client));
  return LICENSING_PHASES.find(p => p.key === phaseKey)?.label || '';
}

export default function LicensingTab({ client, onUpdate, reminders = [], onReminderChange, onClearReminders }) {
  const [ld, setLd] = useState(() => buildInitialLd(client));
  const [activePhase, setActivePhase] = useState(() => computeCurrentPhase(ld));
  const ldRef = useRef(ld);
  ldRef.current = ld;

  useEffect(() => {
    const nextLd = buildInitialLd(client);
    setLd(nextLd);
    setActivePhase(computeCurrentPhase(nextLd));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id]);

  const { schedule: persist, flush } = useDeferredSave((nextLd) => onUpdate({ [FIELD_LICENSING_DATA]: nextLd }));

  const updateSection = (section, patch) => {
    const next = { ...ldRef.current, [section]: { ...ldRef.current[section], ...patch } };
    setLd(next);
    persist(next);
  };

  const handlePhaseClick = (phase) => setActivePhase(phase);

  const meetingApproved = ld.application.meeting?.status === MEETING_APPROVED;
  const conditionsComplete = ld.conditions.permit_status === PERMIT_STATUS_SIGNED && ld.conditions.needs_start_approval !== null;
  const needsStartApproval = ld.conditions.needs_start_approval === 'yes';

  // GrayOut reset: conditionsPassed controls פעולות + ישיבה tables in RequestPhase.
  // This MUST live in LicensingTab (always mounted) — RequestPhase unmounts when not on the application phase.
  const conditionsPassed = ld.info.conditions_passed === CONDITIONS_STATUS_RECEIVED;
  useOnLock(conditionsPassed, () => {
    onClearReminders?.('licensing.application.actions');
    onClearReminders?.('licensing.application.meeting');
  });
  // GrayOut resets: ConditionsPhase / ConfirmationPhase greyed → clear their reminders.
  useOnLock(meetingApproved, () => onClearReminders?.('licensing.conditions*'));
  useOnLock(needsStartApproval, () => onClearReminders?.('licensing.confirmation*'));

  // Reminder helpers — memoised to avoid re-filtering on every render
  const licReminders = useMemo(() => reminders.filter(r => r.section_key.startsWith('licensing.')), [reminders]);
  const makeReminderChange = useCallback((sectionKey) => (rowLabel, days) => onReminderChange?.(sectionKey, rowLabel, days), [onReminderChange]);

  const unlockedPhases = [
    LICENSING_PHASE_INFO,
    LICENSING_PHASE_APPLICATION,
    LICENSING_PHASE_CONDITIONS,
    LICENSING_PHASE_CONFIRMATION,
  ];

  const completedPhases = [
    ...(conditionsPassed ? [LICENSING_PHASE_INFO] : []),
    ...(meetingApproved ? [LICENSING_PHASE_APPLICATION] : []),
    ...(conditionsComplete ? [LICENSING_PHASE_CONDITIONS] : []),
  ];

  return (
    <div dir="rtl" className="licensing-tab" onBlur={flush}>
      <PhaseStepper
        activePhase={activePhase}
        unlockedPhases={unlockedPhases}
        completedPhases={completedPhases}
        onPhaseClick={handlePhaseClick}
      />
      {activePhase === LICENSING_PHASE_INFO && (
        <InfoPhase
          client={client}
          onUpdateClient={onUpdate}
          info={ld.info}
          onChange={(p) => updateSection('info', p)}
          reminders={licReminders}
          onReminderChange={makeReminderChange}
          onClearReminders={onClearReminders}
          onNext={() => setActivePhase(LICENSING_PHASE_APPLICATION)}
        />
      )}
      {activePhase === LICENSING_PHASE_APPLICATION && (
        <RequestPhase
          request={ld.application}
          conditionsPassed={conditionsPassed}
          onChange={(p) => updateSection('application', p)}
          reminders={licReminders}
          onReminderChange={makeReminderChange}
          onClearReminders={onClearReminders}
          onNext={() => setActivePhase(LICENSING_PHASE_CONDITIONS)}
        />
      )}
      {activePhase === LICENSING_PHASE_CONDITIONS && (
        <GrayOut disabled={!meetingApproved} reason="ממתין לאישור ישיבה">
          <ConditionsPhase
            conditions={ld.conditions}
            onChange={(p) => updateSection('conditions', p)}
            reminders={licReminders}
            onReminderChange={makeReminderChange}
            onClearReminders={onClearReminders}
          />
        </GrayOut>
      )}
      {activePhase === LICENSING_PHASE_CONFIRMATION && (
        <GrayOut disabled={!needsStartApproval} reason="עבור לשלב 'תנאים' וסמן אם נדרש אישור תחילת עבודה">
          <ConfirmationPhase
            confirmation={ld.confirmation}
            onChange={(p) => updateSection('confirmation', p)}
            reminders={licReminders}
            onReminderChange={makeReminderChange}
          />
        </GrayOut>
      )}
    </div>
  );
}
