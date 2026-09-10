import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import PersonForm, { makeEmptyPerson } from './licensing/PersonForm';
import { InfoCard, PersonReadOnly } from './licensing/InfoPhase';
import StatusTable from './licensing/StatusTable';
import GrayOut from './GrayOut';
import {
  FIELD_DETAILED_DATA,
  DETAILED_HACHANA_BE_TIPUL, DETAILED_HACHANA_KEN, DETAILED_HACHANA_LO,
  DETAILED_SHUBATS, DETAILED_LO_SHUBATS,
  DETAILED_LO_NISHLACH, DETAILED_NISHLACH, DETAILED_HITKABEL,
  DEBOUNCE_DELAY_MS,
  NUMERIC_LAND_FIELDS,
} from '../constants';

// ── Column / option definitions ──

const HACHANA_OPTIONS = [
  { value: DETAILED_HACHANA_BE_TIPUL, label: 'בטיפול' },
  { value: DETAILED_HACHANA_KEN,      label: 'כן' },
  { value: DETAILED_HACHANA_LO,       label: 'לא' },
];
const HACHANA_COLORS = {
  [DETAILED_HACHANA_BE_TIPUL]: 'orange',
  [DETAILED_HACHANA_KEN]:      'green',
  [DETAILED_HACHANA_LO]:       'red',
};

const HAFKADA_ISHUR_OPTIONS = [
  { value: DETAILED_SHUBATS,    label: 'שובץ' },
  { value: DETAILED_LO_SHUBATS, label: 'לא שובץ' },
];
const HAFKADA_ISHUR_COLORS = {
  [DETAILED_SHUBATS]:    'green',
  [DETAILED_LO_SHUBATS]: 'red',
};

const PIRSOOM_OPTIONS = [
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

const buildInitialDetailed = (client, src = {}) => {
  const existing = src || {};
  return {
    info: {
      requesters: existing.info?.requesters?.length
        ? existing.info.requesters
        : [makeEmptyPerson({ name: client.name || '', phone: client.phone || '', email: client.email || '' })],
      description: existing.info?.description || '',
    },
    hachana:  { status: existing.hachana?.status  || DETAILED_HACHANA_BE_TIPUL, note: existing.hachana?.note  || '' },
    hafkada:  { status: existing.hafkada?.status  || DETAILED_LO_SHUBATS,       note: existing.hafkada?.note  || '' },
    pirsum_a: { status: existing.pirsum_a?.status || DETAILED_LO_NISHLACH,      note: existing.pirsum_a?.note || '' },
    ishur:    { status: existing.ishur?.status    || DETAILED_LO_SHUBATS,       note: existing.ishur?.note    || '' },
    pirsum_b: { status: existing.pirsum_b?.status || DETAILED_LO_NISHLACH,      note: existing.pirsum_b?.note || '' },
  };
};

// ── Component ──

const LAND_FIELDS = [
  { key: 'city',    label: 'עיר' },
  { key: 'gush',    label: 'גוש' },
  { key: 'helka',   label: 'חלקה' },
  { key: 'migrash', label: 'מגרש' },
];

export default function DetailedTab({ client, onUpdate, reminders = [], onReminderChange, onClearReminders }) {
  const [dd, setDd] = useState(() => buildInitialDetailed(client, client[FIELD_DETAILED_DATA]));
  const [editMode, setEditMode] = useState(false);
  const [landDraft, setLandDraft] = useState(null);
  const debounceTimer = useRef(null);
  const landDebounce = useRef(null);
  const ddRef = useRef(dd);
  ddRef.current = dd;

  useEffect(() => {
    setDd(buildInitialDetailed(client, client[FIELD_DETAILED_DATA]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id]);

  useEffect(() => () => {
    clearTimeout(debounceTimer.current);
    clearTimeout(landDebounce.current);
  }, []);

  const persist = useCallback((next) => {
    onUpdate({ [FIELD_DETAILED_DATA]: next });
  }, [onUpdate]);

  const updateField = (key, patch) => {
    const next = { ...ddRef.current, [key]: { ...ddRef.current[key], ...patch } };
    setDd(next);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => persist(next), DEBOUNCE_DELAY_MS);
  };

  const updateInfo = (patch) => updateField('info', patch);

  const land = landDraft || {
    city: client.city || '', gush: client.gush ?? '', helka: client.helka ?? '', migrash: client.migrash ?? '',
  };

  const updateLand = (key, value) => {
    const next = { ...land, [key]: value };
    setLandDraft(next);
    clearTimeout(landDebounce.current);
    landDebounce.current = setTimeout(() => {
      const payload = { ...next };
      NUMERIC_LAND_FIELDS.forEach(k => {
        payload[k] = payload[k] === '' ? (k === 'migrash' ? null : payload[k]) : Number(payload[k]);
      });
      onUpdate(payload);
      setLandDraft(null);
    }, DEBOUNCE_DELAY_MS);
  };

  const tableRow = (key, label) => [{ id: key, label, status: dd[key].status, note: dd[key].note }];
  const onTableChange = (key) => (next) => updateField(key, { status: next[0].status, note: next[0].note });

  const hachanaDone = dd.hachana.status  === DETAILED_HACHANA_KEN;
  const hafkadaDone = dd.hafkada.status  === DETAILED_SHUBATS;
  const pirsumADone = dd.pirsum_a.status === DETAILED_HITKABEL;
  const ishurDone   = dd.ishur.status    === DETAILED_SHUBATS;

  // GrayOut resets: clear reminders whenever a table becomes grayed.
  const prevHachanaDone = useRef(hachanaDone);
  useEffect(() => {
    if (!hachanaDone && prevHachanaDone.current) {
      onClearReminders?.(SK_HAFKADA);
      onClearReminders?.(SK_PIRSUM_A);
      onClearReminders?.(SK_ISHUR);
      onClearReminders?.(SK_PIRSUM_B);
    }
    prevHachanaDone.current = hachanaDone;
  }, [hachanaDone, onClearReminders]);

  const prevHafkadaDone = useRef(hafkadaDone);
  useEffect(() => {
    if (!hafkadaDone && prevHafkadaDone.current) {
      onClearReminders?.(SK_PIRSUM_A);
      onClearReminders?.(SK_ISHUR);
      onClearReminders?.(SK_PIRSUM_B);
    }
    prevHafkadaDone.current = hafkadaDone;
  }, [hafkadaDone, onClearReminders]);

  const prevPirsumADone = useRef(pirsumADone);
  useEffect(() => {
    if (!pirsumADone && prevPirsumADone.current) {
      onClearReminders?.(SK_ISHUR);
      onClearReminders?.(SK_PIRSUM_B);
    }
    prevPirsumADone.current = pirsumADone;
  }, [pirsumADone, onClearReminders]);

  const prevIshurDone = useRef(ishurDone);
  useEffect(() => {
    if (!ishurDone && prevIshurDone.current) {
      onClearReminders?.(SK_PIRSUM_B);
    }
    prevIshurDone.current = ishurDone;
  }, [ishurDone, onClearReminders]);

  const sectionReminders = useMemo(() => (sk) => reminders.filter(r => r.section_key === sk), [reminders]);

  return (
    <div dir="rtl" className="licensing-tab">

      {/* ── Section 1: Info ── */}
      <div className="info-group-header">
        <button
          className={`btn btn-sm ${editMode ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setEditMode(m => !m)}
        >
          {editMode ? '✓ שמור' : '✏️ עריכת פרטים'}
        </button>
      </div>

      {editMode ? (
        <>
          <PersonForm
            title="פרטי מבקש"
            people={dd.info.requesters}
            onChange={(next) => updateInfo({ requesters: next })}
          />
          <div className="detail-section">
            <h3 className="detail-section-title">פרטי קרקע</h3>
            <div className="land-grid">
              {LAND_FIELDS.map(f => (
                <div key={f.key} className="form-group">
                  <label>{f.label}</label>
                  <input
                    type="text"
                    value={land[f.key] ?? ''}
                    onChange={(e) => updateLand(f.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
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
              {LAND_FIELDS.map(f => (
                <div key={f.key} className="detail-row">
                  <span className="detail-label">{f.label}</span>
                  <span>{land[f.key] || <span className="muted">—</span>}</span>
                </div>
              ))}
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
