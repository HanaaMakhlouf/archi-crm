const FIELDS = [
  { key: 'name',      label: 'שם',       type: 'text' },
  { key: 'surname',   label: 'משפחה',    type: 'text' },
  { key: 'id_number', label: 'ת"ז',      type: 'text' },
  { key: 'phone',     label: 'טלפון',    type: 'tel'  },
  { key: 'email',     label: 'אימייל',   type: 'email'},
];

export const makeEmptyPerson = (overrides = {}) => ({
  id: crypto.randomUUID(),
  name: '', surname: '', id_number: '', phone: '', email: '',
  ...overrides,
});

export default function PersonForm({ title, people, onChange, readOnly = false }) {
  const updateField = (id, key, value) => {
    onChange(people.map(p => p.id === id ? { ...p, [key]: value } : p));
  };
  const addPerson = () => onChange([...people, makeEmptyPerson()]);
  const removePerson = (id) => onChange(people.filter(p => p.id !== id));

  // ── Read-only compact view ──
  if (readOnly) {
    return (
      <div className="detail-section">
        <h3 className="detail-section-title">{title}</h3>
        {people.length === 0 ? (
          <p className="muted small">לא נוספו רשומות</p>
        ) : people.map((p, idx) => (
          <div key={p.id} className="person-readonly-card">
            {people.length > 1 && <div className="detail-label" style={{ paddingBottom: 4 }}>#{idx + 1}</div>}
            {[
              { label: 'שם',     value: [p.name, p.surname].filter(Boolean).join(' ') },
              { label: 'ת"ז',   value: p.id_number },
              { label: 'טלפון', value: p.phone },
              { label: 'אימייל',value: p.email },
            ].filter(f => f.value).map(f => (
              <div key={f.label} className="detail-row">
                <span className="detail-label">{f.label}</span>
                <span>{f.value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // ── Edit view ──
  return (
    <div className="detail-section">
      <div className="flow-row">
        <h3 className="detail-section-title" style={{ margin: 0 }}>{title}</h3>
        <button className="btn btn-primary btn-sm" onClick={addPerson}>+ הוסף</button>
      </div>

      {people.length === 0 && (
        <p className="muted small">לא נוספו רשומות</p>
      )}

      {people.map((p, idx) => (
        <div key={p.id} className="person-row">
          <div className="person-row-header">
            <span className="muted small">#{idx + 1}</span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => removePerson(p.id)}
              aria-label="הסר"
            >
              ✕
            </button>
          </div>
          <div className="person-fields">
            {FIELDS.map(f => (
              <div key={f.key} className="form-group">
                <label>{f.label}</label>
                <input
                  type={f.type}
                  value={p[f.key] || ''}
                  onChange={(e) => updateField(p.id, f.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
