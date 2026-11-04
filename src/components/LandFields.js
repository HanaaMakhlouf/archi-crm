import { useState } from 'react';
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

// All land fields in one row; several חלקות are typed comma-separated.
export function LandForm({ land, onChange }) {
  return (
    <div className="land-grid">
      {LAND_FIELDS.map(f => (
        <div key={f.key} className="form-group">
          <label>{f.label}</label>
          {f.key === 'helka' ? (
            <input
              type="text"
              value={land.helka.join(', ')}
              onChange={e => onChange('helka', e.target.value.split(/\s*,\s*/))}
              placeholder="—"
              title="כמה חלקות: מפרידים בפסיק, למשל 152, 153"
            />
          ) : (
            <input type="text" value={land[f.key] ?? ''} onChange={e => onChange(f.key, e.target.value)} placeholder="—" />
          )}
        </div>
      ))}
    </div>
  );
}
