import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import PhaseStepper from './licensing/PhaseStepper';
import LicensingDetails from './licensing/LicensingDetails';
import InfoPhase from './licensing/InfoPhase';
import RequestPhase from './licensing/RequestPhase';
import ConditionsPhase from './licensing/ConditionsPhase';
import ConfirmationPhase from './licensing/ConfirmationPhase';
import Form4Phase from './licensing/Form4Phase';
import GrayOut from './GrayOut';
import { newStatusRow } from './AddRow';
import { addMissingRows } from './licensing/questionRows';
import { buildInitialLd, computeCurrentPhase, newConditionRow } from './licensing/licensingData';
import { useDeferredSave } from '../utils/useDeferredSave';
import { useOnLock } from '../utils/useOnLock';
import { useHistoryStep, recordedStep } from '../utils/useHistoryStep';
import {
  FIELD_LICENSING_DATA, LICENSING_PHASE_INFO, LICENSING_PHASE_APPLICATION,
  LICENSING_PHASE_CONDITIONS, LICENSING_PHASE_CONFIRMATION, LICENSING_PHASE_FORM4,
  LICENSING_PHASES, licensingPhasesFor, isConfirmationRowDone, ONLINE_INFO_RECEIVED,
  isPermitSigned, MEETING_APPROVED, QUESTION_ROWS, ANSWER_YES, actionRowDefaultStatus,
} from '../constants';

export default function LicensingTab({ client, onUpdate, reminders = [], onReminderChange, onClearReminders, onStatusChange }) {
  const [ld, setLd] = useState(() => buildInitialLd(client));
  const [activePhase, setActivePhase] = useState(() => recordedStep('phase', client.id) || computeCurrentPhase(ld));
  // The stage is remembered (back/forward onto this tab reopens it), but moving
  // between stages isn't a back-step: back leaves the tab for כללי.
  const selectPhase = useHistoryStep('phase', activePhase, setActivePhase, client.id);
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

  // A request question answered: "yes" adds its פעולות / תנאים rows (once);
  // "no" hides them (statuses kept) and drops their reminders.
  const answerQuestion = (question, value) => {
    const cur = ldRef.current;
    const rows = QUESTION_ROWS[question];
    const yes = value === ANSWER_YES;
    const next = {
      ...cur,
      application: {
        ...cur.application,
        [question]: value,
        actions: yes
          ? addMissingRows(cur.application.actions, rows.actions, label => newStatusRow(label, actionRowDefaultStatus(label)))
          : cur.application.actions,
      },
      conditions: yes
        ? { ...cur.conditions, rows: addMissingRows(cur.conditions.rows, rows.conditions, newConditionRow) }
        : cur.conditions,
    };
    setLd(next);
    persist(next);
    if (!yes) {
      const hidden = { 'licensing.application.actions': rows.actions, 'licensing.conditions.rows': rows.conditions };
      reminders
        .filter(r => hidden[r.section_key]?.includes(r.row_label))
        .forEach(r => onReminderChange?.(r.section_key, r.row_label, null));
    }
  };

  const handlePhaseClick = selectPhase;

  const meetingApproved = ld.application.meeting?.status === MEETING_APPROVED;
  const conditionsComplete = isPermitSigned(ld.conditions) && ld.conditions.needs_start_approval !== null;
  const needsStartApproval = ld.conditions.needs_start_approval === 'yes';

  // GrayOut reset: conditionsPassed controls פעולות + ישיבה tables in RequestPhase.
  // This MUST live in LicensingTab (always mounted) — RequestPhase unmounts when not on the application phase.
  const conditionsPassed = ld.info.online_info_status === ONLINE_INFO_RECEIVED;
  useOnLock(conditionsPassed, () => {
    onClearReminders?.('licensing.application.actions');
    onClearReminders?.('licensing.application.meeting');
  });
  // GrayOut resets: ConditionsPhase / ConfirmationPhase greyed → clear their reminders.
  useOnLock(meetingApproved, () => onClearReminders?.('licensing.conditions*'));
  useOnLock(needsStartApproval, () => onClearReminders?.('licensing.confirmation*'));
  const openForm4 = ld.conditions.open_form4 === 'yes';
  useOnLock(openForm4, () => onClearReminders?.('licensing.form4*'));

  // Reminder helpers — memoised to avoid re-filtering on every render
  const licReminders = useMemo(() => reminders.filter(r => r.section_key.startsWith('licensing.')), [reminders]);
  const makeReminderChange = useCallback((sectionKey) => (rowLabel, days) => onReminderChange?.(sectionKey, rowLabel, days), [onReminderChange]);
  const makeStatusChange = useCallback((sectionKey) => (rowLabel, change) => onStatusChange?.(sectionKey, rowLabel, change), [onStatusChange]);

  // אישור התחלת עבודה / תנאים טופס 4 are steps only when תנאים says they're needed.
  const phases = licensingPhasesFor(ld.conditions);
  const shownPhase = phases.some(p => p.key === activePhase) ? activePhase : LICENSING_PHASE_CONDITIONS;

  const unlockedPhases = LICENSING_PHASES.map(p => p.key);

  const completedPhases = [
    ...(conditionsPassed ? [LICENSING_PHASE_INFO] : []),
    ...(meetingApproved ? [LICENSING_PHASE_APPLICATION] : []),
    ...(conditionsComplete ? [LICENSING_PHASE_CONDITIONS] : []),
    ...(conditionsComplete && openForm4 && needsStartApproval && ld.confirmation.rows.every(isConfirmationRowDone)
      ? [LICENSING_PHASE_CONFIRMATION] : []),
  ];

  return (
    <div dir="rtl" className="licensing-tab" onBlur={flush}>
      <PhaseStepper
        phases={phases}
        activePhase={shownPhase}
        unlockedPhases={unlockedPhases}
        completedPhases={completedPhases}
        onPhaseClick={handlePhaseClick}
      />
      <LicensingDetails
        key={client.id}
        client={client}
        onUpdateClient={onUpdate}
        info={ld.info}
        onChange={(p) => updateSection('info', p)}
      />
      {shownPhase === LICENSING_PHASE_INFO && (
        <InfoPhase
          info={ld.info}
          onChange={(p) => updateSection('info', p)}
          reminders={licReminders}
          onReminderChange={makeReminderChange}
          onStatusChange={makeStatusChange}
          onClearReminders={onClearReminders}
          onNext={() => selectPhase(LICENSING_PHASE_APPLICATION)}
        />
      )}
      {shownPhase === LICENSING_PHASE_APPLICATION && (
        <RequestPhase
          request={ld.application}
          conditionsPassed={conditionsPassed}
          onChange={(p) => updateSection('application', p)}
          onAnswer={answerQuestion}
          reminders={licReminders}
          onReminderChange={makeReminderChange}
          onStatusChange={makeStatusChange}
          onClearReminders={onClearReminders}
          onNext={() => selectPhase(LICENSING_PHASE_CONDITIONS)}
        />
      )}
      {shownPhase === LICENSING_PHASE_CONDITIONS && (
        <GrayOut disabled={!meetingApproved} reason="ממתין לאישור ישיבה">
          <ConditionsPhase
            conditions={ld.conditions}
            answers={ld.application}
            onChange={(p) => updateSection('conditions', p)}
            reminders={licReminders}
            onReminderChange={makeReminderChange}
            onStatusChange={makeStatusChange}
            onClearReminders={onClearReminders}
          />
        </GrayOut>
      )}
      {shownPhase === LICENSING_PHASE_FORM4 && (
        <Form4Phase
          form4={ld.form4}
          onChange={(p) => updateSection('form4', p)}
          reminders={licReminders}
          onReminderChange={makeReminderChange}
          onStatusChange={makeStatusChange}
        />
      )}
      {shownPhase === LICENSING_PHASE_CONFIRMATION && (
        <ConfirmationPhase
          confirmation={ld.confirmation}
          onChange={(p) => updateSection('confirmation', p)}
          reminders={licReminders}
          onReminderChange={makeReminderChange}
          onStatusChange={makeStatusChange}
        />
      )}
    </div>
  );
}
