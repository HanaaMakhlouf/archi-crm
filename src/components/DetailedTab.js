import { useState, useRef, useEffect, useMemo } from 'react';
import PersonForm, { makeEmptyPerson } from './licensing/PersonForm';
import { InfoCard, PersonReadOnly } from './licensing/InfoPhase';
import StatusTable from './licensing/StatusTable';
import GrayOut from './GrayOut';
import { useLandEditor, LandForm, LandView, EditToggle } from './LandFields';
import { useDeferredSave } from '../utils/useDeferredSave';
import { useOnLock } from '../utils/useOnLock';
import {
  FIELD_DETAILED_DATA,
  DETAILED_HACHANA_BE_TIPUL, DETAILED_HACHANA_KEN, DETAILED_HACHANA_LO,
  DETAILED_SHUBATS, DETAILED_LO_SHUBATS,
  DETAILED_LO_NISHLACH, DETAILED_NISHLACH, DETAILED_HITKABEL,
} from '../constants';

// ── Column / option definitions ──

export const HACHANA_OPTIONS = [
  { value: DETAILED_HACHANA_BE_TIPUL, label: 'בטיפול' },
  { value: DETAILED_HACHANA_KEN,      label: 'כן' },
  { value: DETAILED_HACHANA_LO,       label: 'לא' },
];
const HACHANA_COLORS = {
  [DETAILED_HACHANA_BE_TIPUL]: 'orange',
  [DETAILED_HACHANA_KEN]:      'green',
  [DETAILED_HACHANA_LO]:       'red',
};

export const HAFKADA_ISHUR_OPTIONS = [
  { value: DETAILED_SHUBATS,    label: 'שובץ' },
  { value: DETAILED_LO_SHUBATS, label: 'לא שובץ' },
];
const HAFKADA_ISHUR_COLORS = {
  [DETAILED_SHUBATS]:    'green',
  [DETAILED_LO_SHUBATS]: 'red',
};

export const PIRSOOM_OPTIONS = [
  { value: DETAILED_LO_NISHLACH, label: 'לא נשלח' },
  { value: DETAILED_NISHLACH,    label: 'נשלח' },
  { value: DETAILED_HITKABEL,    label: 'התקבל' },
];
const PIRSOOM_COLORS = {
  [DETAILED_LO_NISHLACH]: 'red',
  [DETAILED_NISHLACH]:    'orange',
  [DETAILED_HITKABEL]:    'green',
};

// ── Section keys ──
const SK_HACHANA  = 'detailed.hachana';
const SK_HAFKADA  = 'detailed.hafkada';
const SK_PIRSUM_A = 'detailed.pirsum_a';
const SK_ISHUR    = 'detailed.ishur';
const SK_PIRSUM_B = 'detailed.pirsum_b';

const makeTableCols = (options, statusColors) => [
  { key: 'label',    type: 'text' },
  { key: 'status',   type: 'select', options, statusColors },
  { key: 'note',     type: 'input', placeholder: 'הערה' },
  { key: 'reminder', type: 'reminder', header: 'תזכורת' },
];

const HACHANA_COLS  = makeTableCols(HACHANA_OPTIONS,        HACHANA_COLORS);
const HAFKADA_COLS  = makeTableCols(HAFKADA_ISHUR_OPTIONS,  HAFKADA_ISHUR_COLORS);
const PIRSOOM_COLS  = makeTableCols(PIRSOOM_OPTIONS,        PIRSOOM_COLORS);
const ISHUR_COLS    = makeTableCols(HAFKADA_ISHUR_OPTIONS,  HAFKADA_ISHUR_COLORS);

// ── Initial state builder ──

const stepEntry = (e, fallbackStatus) => ({ status: e?.status || fallbackStatus, note: e?.note || '' });

const buildInitialDetailed = (client, src = {}) => {
  const existing = src || {};
  return {
    info: {
      requesters: existing.info?.requesters?.length
        ? existing.info.requesters
        : [makeEmptyPerson({ name: client.name || '', phone: client.phone || '', email: client.email || '' })],
      description: existing.info?.description || '',
    },
    hachana:  stepEntry(existing.hachana,  DETAILED_HACHANA_BE_TIPUL),
    hafkada:  stepEntry(existing.hafkada,  DETAILED_LO_SHUBATS),
    pirsum_a: stepEntry(existing.pirsum_a, DETAILED_LO_NISHLACH),
    ishur:    stepEntry(existing.ishur,    DETAILED_LO_SHUBATS),
    pirsum_b: stepEntry(existing.pirsum_b, DETAILED_LO_NISHLACH),
  };
};

// ── Component ──

// Each step unlocks the next, so a step that greys out again clears the
// reminders of every step after it.
const STEP_SECTIONS = [SK_HAFKADA, SK_PIRSUM_A, SK_ISHUR, SK_PIRSUM_B];

export default function DetailedTab({ client, onUpdate, reminders = [], onReminderChange, onClearReminders }) {
  const [dd, setDd] = useState(() => buildInitialDetailed(client, client[FIELD_DETAILED_DATA]));
  const [editMode, setEditMode] = useState(false);
  const { land, updateLand, flushLand } = useLandEditor(client, onUpdate);
  const ddRef = useRef(dd);
  ddRef.current = dd;

  useEffect(() => {
    setDd(buildInitialDetailed(client, client[FIELD_DETAILED_DATA]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id]);

  const { schedule: persist, flush: flushDd } = useDeferredSave((next) => onUpdate({ [FIELD_DETAILED_DATA]: next }));

  const updateField = (key, patch) => {
    const next = { ...ddRef.current, [key]: { ...ddRef.current[key], ...patch } };
    setDd(next);
    persist(next);
  };

  const updateInfo = (patch) => updateField('info', patch);

  const tableRow = (key, label) => [{ id: key, label, status: dd[key].status, note: dd[key].note }];
  const onTableChange = (key) => (next) => updateField(key, { status: next[0].status, note: next[0].note });

  const hachanaDone = dd.hachana.status  === DETAILED_HACHANA_KEN;
  const hafkadaDone = dd.hafkada.status  === DETAILED_SHUBATS;
  const pirsumADone = dd.pirsum_a.status === DETAILED_HITKABEL;
  const ishurDone   = dd.ishur.status    === DETAILED_SHUBATS;

  // GrayOut resets: clear the later steps' reminders whenever a step greys out.
  const clearStepsFrom = (i) => STEP_SECTIONS.slice(i).forEach(sk => onClearReminders?.(sk));
  useOnLock(hachanaDone, () => clearStepsFrom(0));
  useOnLock(hafkadaDone, () => clearStepsFrom(1));
  useOnLock(pirsumADone, () => clearStepsFrom(2));
  useOnLock(ishurDone,   () => clearStepsFrom(3));

  const sectionReminders = useMemo(() => (sk) => reminders.filter(r => r.section_key === sk), [reminders]);

  return (
    <div dir="rtl" className="licensing-tab" onBlur={() => { flushDd(); flushLand(); }}>

      {/* ── Section 1: Info ── */}
      <EditToggle editMode={editMode} onToggle={() => setEditMode(m => !m)} />

      {editMode ? (
        <>
          <PersonForm
            title="פרטי מבקש"
            people={dd.info.requesters}
            onChange={(next) => updateInfo({ requesters: next })}
          />
          <div className="detail-section">
            <h3 className="detail-section-title">פרטי קרקע</h3>
            <LandForm land={land} onChange={updateLand} />
          </div>
          <div className="detail-section">
            <h3 className="detail-section-title">מהות הבקשה</h3>
            <div className="form-group">
              <textarea
                value={dd.info.description}
                onChange={(e) => updateInfo({ description: e.target.value })}
                placeholder="תיאור מהות הפרויקט"
              />
            </div>
          </div>
        </>
      ) : (
        <div className="info-readonly-layout">
          <div className="info-cards-row">
            <InfoCard title="פרטי מבקש">
              <PersonReadOnly people={dd.info.requesters} />
            </InfoCard>
            <InfoCard title="פרטי קרקע">
              <LandView land={land} />
            </InfoCard>
          </div>
          <InfoCard title="מהות הבקשה" wide>
            <span className="info-description-text">
              {dd.info.description || <span className="muted">לא הוגדר</span>}
            </span>
          </InfoCard>
        </div>
      )}

      {/* ── Section 2: Progressive Tables ── */}
      <StatusTable
        title="הכנה"
        showHeader={false}
        rows={tableRow('hachana', 'הכנה')}
        columns={HACHANA_COLS}
        onChange={onTableChange('hachana')}
        reminders={sectionReminders(SK_HACHANA)}
        onReminderChange={(rl, days) => onReminderChange?.(SK_HACHANA, rl, days)}
      />

      <GrayOut disabled={!hachanaDone} reason="ממתין לסיום הכנה">
        <StatusTable
          title="הפקדה"
          showHeader={false}
          rows={tableRow('hafkada', 'הפקדה')}
          columns={HAFKADA_COLS}
          onChange={onTableChange('hafkada')}
          reminders={sectionReminders(SK_HAFKADA)}
          onReminderChange={(rl, days) => onReminderChange?.(SK_HAFKADA, rl, days)}
        />
      </GrayOut>

      <GrayOut disabled={!hachanaDone || !hafkadaDone} reason="ממתין לסיום הכנה וההפקדה">
        <StatusTable
          title="פירסום"
          showHeader={false}
          rows={tableRow('pirsum_a', 'פירסום')}
          columns={PIRSOOM_COLS}
          onChange={onTableChange('pirsum_a')}
          reminders={sectionReminders(SK_PIRSUM_A)}
          onReminderChange={(rl, days) => onReminderChange?.(SK_PIRSUM_A, rl, days)}
        />
      </GrayOut>

      <GrayOut disabled={!hachanaDone || !hafkadaDone || !pirsumADone} reason="ממתין לסיום הפירסום הראשון">
        <StatusTable
          title="אישור"
          showHeader={false}
          rows={tableRow('ishur', 'אישור')}
          columns={ISHUR_COLS}
          onChange={onTableChange('ishur')}
          reminders={sectionReminders(SK_ISHUR)}
          onReminderChange={(rl, days) => onReminderChange?.(SK_ISHUR, rl, days)}
        />
      </GrayOut>

      <GrayOut disabled={!hachanaDone || !hafkadaDone || !pirsumADone || !ishurDone} reason="ממתין לסיום כל השלבים הקודמים">
        <StatusTable
          title="פירסום"
          showHeader={false}
          rows={tableRow('pirsum_b', 'פירסום')}
          columns={PIRSOOM_COLS}
          onChange={onTableChange('pirsum_b')}
          reminders={sectionReminders(SK_PIRSUM_B)}
          onReminderChange={(rl, days) => onReminderChange?.(SK_PIRSUM_B, rl, days)}
        />
      </GrayOut>

    </div>
  );
}
