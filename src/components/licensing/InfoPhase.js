import { Fragment } from 'react';
import { useOnLock } from '../../utils/useOnLock';
import StatusTable from './StatusTable';
import GrayOut from '../GrayOut';
import {
  LICENSING_DOCUMENTS,
  DOC_STATUS_MISSING, DOC_STATUS_PRESENT, DOC_STATUS_NOT_REQUIRED,
  INFO_NOTE_SENT, INFO_NOTE_NOT_SENT,
  DOC_STATUS_OPTIONS, INFO_NOTE_OPTIONS,
  CONDITIONS_STATUS_OPTIONS, CONDITIONS_STATUS_RECEIVED,
  CONDITIONS_STATUS_NOT_SENT,
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
    statusColors: { [DOC_STATUS_PRESENT]: 'green', [DOC_STATUS_MISSING]: 'red', [DOC_STATUS_NOT_REQUIRED]: 'gray' }
  },
  { key: 'note', type: 'input', header: 'הערה', placeholder: '—' },
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

// The client's details as one panel: a row per topic, its title on the side.
export function InfoPanel({ children }) {
  return <div className="info-panel">{children}</div>;
}

export function InfoRow({ title, actions, children }) {
  return (
    <section className="info-row">
      <div className="info-row-side">
        <h3 className="info-row-title">{title}</h3>
        {actions}
      </div>
      <div className="info-row-body">{children}</div>
    </section>
  );
}

const fullName = (p) => [p.name, p.surname].filter(Boolean).join(' ');

// People edited in place: one row per person, the field names once on top.
// copyFrom offers the other list's people as one-click chips (hidden once copied).
export function PeopleEditor({ people, onChange, copyFrom }) {
  const updateField = (id, key, value) =>
    onChange(people.map(p => p.id === id ? { ...p, [key]: value } : p));
  const removePerson = (id) => onChange(people.filter(p => p.id !== id));

  const alreadyHere = (p) => people.some(q => fullName(q) === fullName(p) && (q.id_number || '') === (p.id_number || ''));
  const copyable = (copyFrom?.people || []).filter(p => !alreadyHere(p));
  const copyPerson = (p) => onChange([...people, { ...p, id: crypto.randomUUID() }]);

  return (
    <>
      {copyable.length > 0 && (
        <div className="person-copy-box">
          <span className="person-copy-label">העתקה מ{copyFrom.label}:</span>
          {copyable.map(p => (
            <button key={p.id} type="button" className="person-copy-chip" onClick={() => copyPerson(p)}>
              + {fullName(p) || 'ללא שם'}
            </button>
          ))}
        </div>
      )}
      {people.length === 0 ? (
        <p className="muted small">לא נוספו עדיין</p>
      ) : (
        <div className="person-grid">
          {PERSON_FIELDS.map(f => <span key={f.key} className="person-grid-head">{f.label}</span>)}
          <span />
          {people.map(p => (
            <Fragment key={p.id}>
              {PERSON_FIELDS.map(f => (
                <input
                  key={f.key}
                  type={f.type}
                  aria-label={f.label}
                  placeholder="—"
                  value={p[f.key] || ''}
                  onChange={e => updateField(p.id, f.key, e.target.value)}
                />
              ))}
              <button type="button" className="row-icon-btn" onClick={() => removePerson(p.id)} title="הסרה" aria-label="הסרה">✕</button>
            </Fragment>
          ))}
        </div>
      )}
    </>
  );
}

export default function InfoPhase({ info, onChange, reminders = [], onReminderChange, onClearReminders, onNext }) {
  const patch = (key, value) => onChange({ [key]: value });

  const allDocumentsDone = info.documents.every(d => d.status !== DOC_STATUS_MISSING);
  const infoNoteSent = info.info_note_status === INFO_NOTE_SENT;

  useOnLock(allDocumentsDone, () => onClearReminders?.(SK_INFO_NOTE));

  const sectionReminders = (sk) => reminders.filter(r => r.section_key === sk);

  return (
    <div className="licensing-info">
      {/* ── Documents table ── */}
      <StatusTable
        title="מסמכים נדרשים"
        rows={info.documents.map(d => ({ ...d, label: DOC_LABELS[d.type] }))}
        columns={DOC_COLUMNS}
        onChange={(next) => patch('documents', next.map(({ label, ...rest }) => rest))}
        rowClassName={(r) => r.status === DOC_STATUS_MISSING ? 'doc-missing' : r.status === DOC_STATUS_PRESENT ? 'doc-present' : ''}
        reminders={sectionReminders(SK_DOCS)}
        onReminderChange={onReminderChange?.(SK_DOCS)}
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
          onReminderChange={onReminderChange?.(SK_INFO_NOTE)}
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
          onReminderChange={onReminderChange?.(SK_CONDITIONS)}
          footer={info.conditions_passed === CONDITIONS_STATUS_RECEIVED
            ? <button className="btn btn-primary btn-sm" onClick={onNext}>עבור לשלב הבא ←</button>
            : null}
        />
      </GrayOut>

    </div>
  );
}
