import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { PRIORITY_OPTIONS, PRIORITY_GREEN, priorityOf } from '../constants';

const GAP = 4;     // between the dot and the menu
const MARGIN = 8;  // kept clear of the window edges

// Small color-coded priority dot. Read-only for most roles; when `editable`,
// clicking it opens a small custom popover (colored dot + label per option) —
// no native <select> chrome, matches the app's own look. Every client always
// has a priority (defaults to green/low in the DB), so there's no "unset" state.
// The menu floats over the page (a portal at a fixed position), so the clients
// table's card — which clips its overflow — can't cut it off; it opens upwards
// when there's no room below.
export default function PriorityDot({ value, editable, onChange, size = 14 }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const opt = PRIORITY_OPTIONS.find(o => o.value === priorityOf(value)) || PRIORITY_OPTIONS.find(o => o.value === PRIORITY_GREEN);

  const place = useCallback(() => {
    if (!buttonRef.current || !menuRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    // The dot scrolled out of view: nothing left to anchor to.
    if (rect.bottom < 0 || rect.top > window.innerHeight) { setOpen(false); return; }
    const { offsetWidth: width, offsetHeight: height } = menuRef.current;
    const fitsBelow = rect.bottom + GAP + height <= window.innerHeight - MARGIN;
    const top = fitsBelow ? rect.bottom + GAP : rect.top - GAP - height;
    setPos({
      top: Math.max(MARGIN, Math.min(top, window.innerHeight - height - MARGIN)),
      left: Math.max(MARGIN, Math.min(rect.left, window.innerWidth - width - MARGIN)),
    });
  }, []);

  // Measure once rendered (hidden), then place, before the browser paints.
  useLayoutEffect(() => {
    if (open) place();
    else setPos(null);
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (!wrapRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, place]);

  const dot = (c) => (
    <span style={{
      display: 'inline-block', width: size, height: size, borderRadius: '50%',
      background: c, flexShrink: 0,
    }} />
  );

  if (!editable) {
    return <span title={opt.label}>{dot(opt.color)}</span>;
  }

  return (
    <span ref={wrapRef} style={{ display: 'inline-block' }} onClick={e => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        title={opt.label}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{ background: 'none', border: 'none', padding: 4, margin: -4, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
      >
        {dot(opt.color)}
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          role="menu"
          // Clicks inside still reach the wrapper (React bubbles through portals), which stops them opening the client.
          style={{
            position: 'fixed', top: pos?.top ?? 0, left: pos?.left ?? 0, zIndex: 1000,
            visibility: pos ? 'visible' : 'hidden',
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 8, boxShadow: '0 4px 14px rgba(0,0,0,0.15)', padding: 4, minWidth: 110,
          }}
        >
          {PRIORITY_OPTIONS.map(o => (
            <div
              key={o.value}
              role="menuitem"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className="priority-menu-item"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
            >
              {dot(o.color)}
              {o.label}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </span>
  );
}
