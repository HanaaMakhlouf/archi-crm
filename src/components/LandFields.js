import { useState } from 'react';
import HelkaList from './HelkaList';
import { useDeferredSave } from '../utils/useDeferredSave';
import { landFromClient, landToPayload } from '../utils/land';

const LAND_FIELDS = [
  { key: 'city',    label: 'עיר' },
  { key: 'gush',    label: 'גוש' },
  { key: 'helka',   label: 'חלקה' },
  { key: 'migrash', label: 'מגרש' },
];

// Edits the land fields that live on the client row (shared by רישוי → מידע
// and תיק מפורט). Changes save a moment after typing stops; call flushLand on
// blur to save at once.
export function useLandEditor(client, onSave) {
  const [draft, setDraft] = useState(null);
  const land = draft || landFromClient(client);

  const { schedule, flush: flushLand } = useDeferredSave((next) => {
    onSave?.(landToPayload(next));
    setDraft(null);
  });

  const updateLand = (key, value) => {
    const next = { ...land, [key]: value };
    setDraft(next);
    schedule(next);
  };

  return { land, updateLand, flushLand };
}

export function LandForm({ land, onChange }) {
  return (
    <div className="land-grid">
      {LAND_FIELDS.map(f => (
        <div key={f.key} className="form-group">
          <label>{f.label}</label>
          {f.key === 'helka' ? (
            <HelkaList values={land.helka} onChange={vals => onChange('helka', vals)} />
          ) : (
            <input type="text" value={land[f.key] ?? ''} onChange={e => onChange(f.key, e.target.value)} />
          )}
        </div>
      ))}
    </div>
  );
}

export function LandView({ land }) {
  return LAND_FIELDS.map(f => {
    const value = f.key === 'helka' ? land.helka.filter(Boolean).join(', ') : land[f.key];
    return (
      <div key={f.key} className="detail-row">
        <span className="detail-label">{f.label}</span>
        <span>{value || <span className="muted">—</span>}</span>
      </div>
    );
  });
}

// "✏️ עריכת פרטים" / "✓ שמור" toggle above the details cards.
export function EditToggle({ editMode, onToggle }) {
  return (
    <div className="info-group-header">
      <button className={`btn btn-sm ${editMode ? 'btn-primary' : 'btn-ghost'}`} onClick={onToggle}>
        {editMode ? '✓ שמור' : '✏️ עריכת פרטים'}
      </button>
    </div>
  );
}
