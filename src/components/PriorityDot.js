import { PRIORITY_OPTIONS } from '../constants';

// Small color-coded priority dot. Read-only for most roles; when `editable`,
// a transparent <select> sits on top of the dot so clicking it opens a
// native dropdown to change the value — no custom menu needed.
export default function PriorityDot({ value, editable, onChange, size = 14 }) {
  const opt = PRIORITY_OPTIONS.find(o => o.value === value);
  const color = opt?.color || '#d1d5db';
  const title = opt?.label || 'לא הוגדרה עדיפות';

  const dot = (
    <span
      style={{
        display: 'inline-block', width: size, height: size, borderRadius: '50%',
        background: color, border: value ? 'none' : '1px dashed #9ca3af',
      }}
    />
  );

  if (!editable) {
    return <span title={title}>{dot}</span>;
  }

  return (
    <span
      title={title}
      style={{ position: 'relative', display: 'inline-block', width: size, height: size }}
      onClick={e => e.stopPropagation()}
    >
      {dot}
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value || null)}
        style={{
          position: 'absolute', inset: 0, width: size, height: size,
          opacity: 0, cursor: 'pointer', border: 'none', padding: 0,
        }}
      >
        <option value="">לא הוגדר</option>
        {PRIORITY_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </span>
  );
}
