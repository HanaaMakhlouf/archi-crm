import { useEffect, useRef, useState } from 'react';
import { makeEmptyPerson } from './PersonForm';
import StatusTable from './StatusTable';
import GrayOut from '../GrayOut';
import {
  LICENSING_DOCUMENTS,
  DOC_STATUS_MISSING, DOC_STATUS_PRESENT,
  INFO_NOTE_SENT, INFO_NOTE_NOT_SENT,
  DOC_STATUS_OPTIONS, INFO_NOTE_OPTIONS,
  CONDITIONS_STATUS_OPTIONS, CONDITIONS_STATUS_RECEIVED,
  CONDITIONS_STATUS_NOT_SENT,
  DEBOUNCE_DELAY_MS,
  NUMERIC_LAND_FIELDS,
} from '../../constants';

const SK_DOCS = 'licensing.info.documents';
const SK_INFO_NOTE = 'licensing.info.info_note';
const SK_CONDITIONS = 'licensing.info.conditions';

const PERSON_FIELDS = [
  { key: 'name',      label: 'שם',      type: 'text'  },
  { key: 'surname',   label: 'משפחה',   type: 'text'  },
  { key: 'id_number', label: 'ת"ז',     type: 'text'  },
  { key: 'phone',     label: 'טלפון',   type: 'tel'   },
  { key: 'email',     label: 'אימייל',  type: 'email' },
];

const DOC_COLUMNS = [
  { key: 'label', type: 'text', header: 'מסמך' },
  {
    key: 'status', type: 'select', header: 'סטטוס', options: DOC_STATUS_OPTIONS,
    statusColors: { [DOC_STATUS_PRESENT]: 'green', [DOC_STATUS_MISSING]: 'red' }
  },
  { key: 'note', type: 'input', header: 'הערה', placeholder: 'הערה' },
  { key: 'reminder', type: 'reminder', header: 'תזכורת' },
];

const INFO_NOTE_COLUMNS = [
  { key: 'label', type: 'text' },
  {
    key: 'status', type: 'select', options: INFO_NOTE_OPTIONS,
    statusColors: { [INFO_NOTE_SENT]: 'green', [INFO_NOTE_NOT_SENT]: 'gray' }
  },
  { key: 'note', type: 'input', placeholder: 'הערה' },
  { key: 'reminder', type: 'reminder', header: 'תזכורת' },
];

const CONDITIONS_COLUMNS = [
  { key: 'label', type: 'text' },
  {
    key: 'status', type: 'select', options: CONDITIONS_STATUS_OPTIONS,
    statusColors: { [CONDITIONS_STATUS_RECEIVED]: 'green', [CONDITIONS_STATUS_NOT_SENT]: 'gray' }
  },
  { key: 'note', type: 'input', placeholder: 'הערה' },
  { key: 'reminder', type: 'reminder', header: 'תזכורת' },
];

const DOC_LABELS = Object.fromEntries(LICENSING_DOCUMENTS.map(d => [d.type, d.label]));

export function InfoCard({ title, children, wide }) {
  return (
    <div className={`info-card${wide ? ' info-card-wide' : ''}`}>
      <div className="info-card-title">{title}</div>
      {children}
    </div>
  );
}

export function PersonReadOnly({ people }) {
  if (!people.length) return <span className="muted small">לא נוספו</span>;
  return people.map((p, idx) => (
    <div key={p.id} className="info-card-person">
      {people.length > 1 && <div className="muted small" style={{ marginBottom: 4 }}>#{idx + 1}</div>}
      {[
        { label: 'שם', value: [p.name, p.surname].filter(Boolean).join(' ') },
        { label: 'ת"ז', value: p.id_number },
        { label: 'טלפון', value: p.phone },
        { label: 'אימייל', value: p.email },
      ].map(f => (
        <div key={f.label} className="detail-row">
          <span className="detail-label">{f.label}</span>
          <span>{f.value || <span className="muted">—</span>}</span>
        </div>
      ))}
    </div>
  ));
}

function PersonCardEdit({ people, onChange, onFillFromClient, copyFrom }) {
  const [selectedIds, setSelectedIds] = useState([]);

  const updateField = (id, key, value) =>
    onChange(people.map(p => p.id === id ? { ...p, [key]: value } : p));
  const addPerson = () => onChange([...people, makeEmptyPerson()]);
  const removePerson = (id) => onChange(people.filter(p => p.id !== id));

  const toggleSelected = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const copySelected = () => {
    const copies = copyFrom.people
      .filter(p => selectedIds.includes(p.id))
      .map(p => ({ ...p, id: crypto.randomUUID() }));
    onChange([...people, ...copies]);
    setSelectedIds([]);
  };

  return (
    <>
      {copyFrom && copyFrom.people.length > 0 && (
        <div className="person-copy-box">
          <span className="muted small">העתק מתוך {copyFrom.label}:</span>
          <div className="person-copy-options">
            {copyFrom.people.map(p => (
              <label key={p.id} className="person-copy-option">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(p.id)}
                  onChange={() => toggleSelected(p.id)}
                />
                {[p.name, p.surname].filter(Boolean).join(' ') || 'ללא שם'}
              </label>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" disabled={!selectedIds.length} onClick={copySelected}>
            העתק נבחרים
          </button>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 8, marginBottom: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={addPerson}>+ הוסף</button>
        {onFillFromClient && (
          <button className="btn btn-ghost btn-sm" onClick={onFillFromClient}>העתק מפרטי הלקוח</button>
        )}
      </div>
      {people.length === 0 && <p className="muted small">לא נוספו רשומות</p>}
      {people.map((p, idx) => (
        <div key={p.id} className="person-row">
          <div className="person-row-header">
            <span className="muted small">#{idx + 1}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => removePerson(p.id)}>✕</button>
          </div>
          <div className="person-fields">
            {PERSON_FIELDS.map(f => (
              <div key={f.key} className="form-group">
                <label>{f.label}</label>
                <input
                  type={f.type}
                  value={p[f.key] || ''}
                  onChange={e => updateField(p.id, f.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

const LAND_FIELDS = [
  { key: 'city', label: 'עיר' },
  { key: 'gush', label: 'גוש' },
  { key: 'helka', label: 'חלקה' },
  { key: 'migrash', label: 'מגרש' },
];

export default function InfoPhase({ client, onUpdateClient, info, onChange, reminders = [], onReminderChange, onClearReminders }) {
  const [editMode, setEditMode] = useState(false);
  const [landDraft, setLandDraft] = useState(null);
  const landDebounce = useRef(null);

  const patch = (key, value) => onChange({ [key]: value });

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
      onUpdateClient?.(payload);
      setLandDraft(null);
    }, DEBOUNCE_DELAY_MS);
  };

  useEffect(() => () => clearTimeout(landDebounce.current), []);

  const allDocumentsDone = info.documents.every(d => d.status !== DOC_STATUS_MISSING);
  const infoNoteSent = info.info_note_status === INFO_NOTE_SENT;

  const prevAllDocsDone = useRef(allDocumentsDone);
  useEffect(() => {
    if (!allDocumentsDone && prevAllDocsDone.current) {
      onClearReminders?.(SK_INFO_NOTE);
    }
    prevAllDocsDone.current = allDocumentsDone;
  }, [allDocumentsDone, onClearReminders]);

  const sectionReminders = (sk) => reminders.filter(r => r.section_key === sk);

  return (
    <div className="licensing-info">

      {/* ── Edit toggle ── */}
      <div className="info-group-header">
        <button
          className={`btn btn-sm ${editMode ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setEditMode(m => !m)}
        >
          {editMode ? '✓ שמור' : '✏️ עריכת פרטים'}
        </button>
      </div>

      {/* ── Cards stacked vertically, each full width ── */}
      <InfoCard title="פרטי קרקע">
        {editMode ? (
          <div className="land-grid">
            {LAND_FIELDS.map(f => (
              <div key={f.key} className="form-group">
                <label>{f.label}</label>
                <input
                  type="text"
                  value={land[f.key] ?? ''}
                  onChange={e => updateLand(f.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        ) : (
          LAND_FIELDS.map(f => (
            <div key={f.key} className="detail-row">
              <span className="detail-label">{f.label}</span>
              <span>{land[f.key] || <span className="muted">—</span>}</span>
            </div>
          ))
        )}
      </InfoCard>

      <InfoCard title="פרטי מבקש">
        {editMode ? (
          <PersonCardEdit
            people={info.requesters}
            onChange={next => patch('requesters', next)}
            onFillFromClient={() => {
              const fill = (p) => ({ ...p, name: client.name || '', phone: client.phone || '', email: client.email || '' });
              patch('requesters', info.requesters.length
                ? info.requesters.map((p, i) => i === 0 ? fill(p) : p)
                : [fill(makeEmptyPerson())]);
            }}
          />
        ) : (
          <PersonReadOnly people={info.requesters} />
        )}
      </InfoCard>

      <InfoCard title="בעלי זכות">
        {editMode ? (
          <PersonCardEdit
            people={info.rights_holders}
            onChange={next => patch('rights_holders', next)}
            copyFrom={{ people: info.requesters, label: 'המבקשים' }}
          />
        ) : (
          <PersonReadOnly people={info.rights_holders} />
        )}
      </InfoCard>

      <InfoCard title="מהות בקשה">
        <textarea
          value={info.description}
          onChange={e => patch('description', e.target.value)}
          placeholder="תיאור מהות הפרויקט"
          rows={3}
        />
      </InfoCard>

      {/* ── Documents table ── */}
      <StatusTable
        title="מסמכים נדרשים"
        rows={info.documents.map(d => ({ ...d, label: DOC_LABELS[d.type] }))}
        columns={DOC_COLUMNS}
        onChange={(next) => patch('documents', next.map(({ label, ...rest }) => rest))}
        rowClassName={(r) => r.status === DOC_STATUS_MISSING ? 'doc-missing' : 'doc-present'}
        reminders={sectionReminders(SK_DOCS)}
        onReminderChange={(rl, days) => onReminderChange?.(SK_DOCS)(rl, days)}
      />

      {/* ── Info note ── */}
      <GrayOut disabled={!allDocumentsDone} reason="ממתין לסיום כל המסמכים">
        <StatusTable
          title="בקשת מידע"
          showHeader={false}
          rows={[{
            id: 'info_note',
            label: 'שלח בקשת מידע',
            status: info.info_note_status,
            note: info.info_note_note || '',
          }]}
          columns={INFO_NOTE_COLUMNS}
          onChange={(next) => onChange({
            info_note_status: next[0].status,
            info_note_note: next[0].note,
          })}
          rowClassName={() => infoNoteSent ? 'doc-present' : 'doc-missing'}
          reminders={sectionReminders(SK_INFO_NOTE)}
          onReminderChange={(rl, days) => onReminderChange?.(SK_INFO_NOTE)(rl, days)}
        />
      </GrayOut>

      {/* ── Preliminary conditions — single-row status table ── */}
      <GrayOut disabled={!infoNoteSent} reason="ממתין לשליחת אגרת מידע">
        <StatusTable
          showHeader={false}
          rows={[{
            id: 'conditions',
            label: 'האם עבר תנאים מקדמיים?',
            status: info.conditions_passed,
            note: info.conditions_note || '',
          }]}
          columns={CONDITIONS_COLUMNS}
          onChange={(next) => onChange({
            conditions_passed: next[0].status,
            conditions_note: next[0].note,
          })}
          rowClassName={() => info.conditions_passed === CONDITIONS_STATUS_RECEIVED ? 'doc-present' : 'doc-missing'}
          reminders={sectionReminders(SK_CONDITIONS)}
          onReminderChange={(rl, days) => onReminderChange?.(SK_CONDITIONS)(rl, days)}
          footer={info.conditions_passed === CONDITIONS_STATUS_RECEIVED
            ? <span style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: 14 }}>✓ עבור לשלב הבא</span>
            : null}
        />
      </GrayOut>

    </div>
  );
}
