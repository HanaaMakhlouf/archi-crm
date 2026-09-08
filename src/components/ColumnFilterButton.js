import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const POPOVER_WIDTH = 200;

// Small funnel icon meant to sit inside a table column header (<th>).
// Opens a fixed-position popover (via portal) with arbitrary filter/sort controls.
export default function ColumnFilterButton({ active, children }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target) &&
        popoverRef.current && !popoverRef.current.contains(e.target)
      ) close();
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open, close]);

  const toggleOpen = (e) => {
    e.stopPropagation();
    if (!open) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 8)),
      });
    }
    setOpen((o) => !o);
  };

  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        className={`filter-icon-btn${active ? ' is-active' : ''}`}
        onClick={toggleOpen}
        title="סינון ומיון"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        {active && <span className="filter-icon-dot" />}
      </button>

      {open && createPortal(
        <div
          className="filter-popover"
          ref={popoverRef}
          style={{ top: pos.top, left: pos.left, width: POPOVER_WIDTH }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>,
        document.body
      )}
    </>
  );
}
