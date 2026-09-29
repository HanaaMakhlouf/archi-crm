// Editable list of חלקה (plot subdivision) numbers — add/remove rows.
// `values` is always an array of raw strings (never empty) so typing works
// naturally; callers coerce to numbers on save.
export default function HelkaList({ values, onChange }) {
  const list = values && values.length ? values : [''];

  const setAt = (i, v) => onChange(list.map((x, idx) => (idx === i ? v : x)));
  const removeAt = (i) => {
    const next = list.filter((_, idx) => idx !== i);
    onChange(next.length ? next : ['']);
  };
  const add = () => onChange([...list, '']);

  return (
    <div className="helka-list">
      {list.map((v, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <input
            type="text"
            value={v}
            onChange={e => setAt(i, e.target.value)}
            style={{ flex: 1 }}
          />
          {list.length > 1 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeAt(i)}>✕</button>
          )}
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" onClick={add}>+ הוסף חלקה</button>
    </div>
  );
}
