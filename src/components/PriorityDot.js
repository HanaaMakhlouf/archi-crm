import { useState, useRef, useEffect } from 'react';
import { PRIORITY_OPTIONS } from '../constants';

// Small color-coded priority dot. Read-only for most roles; when `editable`,
// clicking it opens a small custom popover (colored dot + label per option) —
// no native <select> chrome, matches the app's own look.
export default function PriorityDot({ value, editable, onChange, size = 14 }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const opt = PRIORITY_OPTIONS.find(o => o.value === value);
  const color = opt?.color || '#d1d5db';
  const title = opt?.label || 'לא הוגדרה עדיפות';

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const dot = (color2, dashed) => (
    <span style={{
      display: 'inline-block', width: size, height: size, borderRadius: '50%',
      background: dashed ? 'transparent' : color2, border: dashed ? '1px dashed #9ca3af' : 'none',
      flexShrink: 0,
    }} />
  );

  if (!editable) {
    return <span title={title}>{dot(color, !value)}</span>;
  }

  const pick = (v) => { onChange(v); setOpen(false); };

  return (
    <span ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }} onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title={title}
        style={{ background: 'none', border: 'none', padding: 4, margin: -4, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
      >
        {dot(color, !value)}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', insetInlineEnd: 0, marginTop: 4, zIndex: 20,
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 8, boxShadow: '0 4px 14px rgba(0,0,0,0.15)', padding: 4, minWidth: 110,
        }}>
          {PRIORITY_OPTIONS.map(o => (
            <div
              key={o.value}
              onClick={() => pick(o.value)}
              className="priority-menu-item"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
            >
              {dot(o.color, false)}
              {o.label}
            </div>
          ))}
          <div
            onClick={() => pick(null)}
            className="priority-menu-item"
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
              fontSize: 13, color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', marginTop: 2, paddingTop: 8,
            }}
          >
            {dot(null, true)}
            לא הוגדר
          </div>
        </div>
      )}
    </span>
  );
}
