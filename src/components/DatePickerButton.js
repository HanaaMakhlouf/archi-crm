import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const WEEKDAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

const POPOVER_WIDTH = 220;
const GAP = 6;     // between the button and the popover
const MARGIN = 8;  // kept clear of the window edges

// Button that opens a calendar-grid popover; onSelect gets 'YYYY-MM-DD' for the picked day.
// Popover renders in a portal at fixed position so it floats over the page,
// detached from any hover/transform effects on ancestor cards (avoids hover flicker).
// It opens below the button, or above it when there's no room below (e.g. the
// last row of a table near the bottom of the window), and follows the button
// when the page scrolls.
export default function DatePickerButton({ onSelect, label = 'בחר תאריך' }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [pos, setPos] = useState(null);
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  const place = useCallback(() => {
    if (!buttonRef.current || !popoverRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    // The button scrolled out of view: nothing left to anchor to.
    if (rect.bottom < 0 || rect.top > window.innerHeight) { setOpen(false); return; }
    const height = popoverRef.current.offsetHeight;
    const fitsBelow = rect.bottom + GAP + height <= window.innerHeight - MARGIN;
    const top = fitsBelow ? rect.bottom + GAP : rect.top - GAP - height;
    setPos({
      top: Math.max(MARGIN, Math.min(top, window.innerHeight - height - MARGIN)),
      left: Math.max(MARGIN, Math.min(rect.right - POPOVER_WIDTH, window.innerWidth - POPOVER_WIDTH - MARGIN)),
    });
  }, []);

  // Measure once rendered (hidden), then place, before the browser paints.
  // Re-placed on month change too: a month can take 5 or 6 rows.
  useLayoutEffect(() => {
    if (open) place();
    else setPos(null);
  }, [open, place, viewDate]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target) &&
        popoverRef.current && !popoverRef.current.contains(e.target)
      ) close();
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, close, place]);

  const toggleOpen = () => {
    if (!open) setViewDate(new Date());
    setOpen((o) => !o);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells = [
    ...Array(firstDayIndex).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const handlePick = (day) => {
    const picked = new Date(year, month, day);
    const iso = `${picked.getFullYear()}-${String(picked.getMonth() + 1).padStart(2, '0')}-${String(picked.getDate()).padStart(2, '0')}`;
    onSelect(iso);
    close();
  };

  return (
    <>
      <button type="button" ref={buttonRef} className="btn btn-ghost btn-sm" onClick={toggleOpen}>
        {label}
      </button>
      {open && createPortal(
        <div
          className="date-picker-popover"
          ref={popoverRef}
          style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, width: POPOVER_WIDTH, visibility: pos ? 'visible' : 'hidden' }}
        >
          <div className="date-picker-header">
            <button type="button" className="date-picker-nav" onClick={() => setViewDate(new Date(year, month - 1, 1))}>‹</button>
            <span>{MONTH_NAMES[month]} {year}</span>
            <button type="button" className="date-picker-nav" onClick={() => setViewDate(new Date(year, month + 1, 1))}>›</button>
          </div>
          <div className="date-picker-grid date-picker-weekdays">
            {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
          </div>
          <div className="date-picker-grid">
            {cells.map((day, i) => {
              if (day === null) return <span key={`empty_${i}`} />;
              const cellDate = new Date(year, month, day);
              const isPast = cellDate < today;
              const isToday = cellDate.getTime() === today.getTime();
              return (
                <button
                  type="button"
                  key={day}
                  className={`date-picker-day${isToday ? ' is-today' : ''}`}
                  disabled={isPast}
                  onClick={() => handlePick(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
