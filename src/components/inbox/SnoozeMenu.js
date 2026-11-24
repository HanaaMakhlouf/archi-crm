import { useState, useEffect, useRef } from 'react';
import DatePickerButton from '../DatePickerButton';
import Icon from '../Icon';
import { ONE_DAY_MS, NOTIFICATION_DELAY_UNIT } from '../../constants';

const ONE_MINUTE_MS = 60 * 1000;
const unitMs = NOTIFICATION_DELAY_UNIT === 'minutes' ? ONE_MINUTE_MS : ONE_DAY_MS;

const SNOOZE_PRESETS = [
  { label: 'יום', days: 1 },
  { label: '3 ימים', days: 3 },
  { label: 'שבוע', days: 7 },
];

// One דחייה button; its menu holds the presets and a date. onDelay(days) gets
// the number of days either way (a date in the past is ignored).
export default function SnoozeMenu({ onDelay, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    // The date picker's calendar floats outside the menu — clicks there don't close it.
    const onDown = (e) => {
      if (!ref.current?.contains(e.target) && !e.target.closest?.('.date-picker-popover')) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pickDays = (days) => { setOpen(false); onDelay(days); };
  const pickDate = (dateStr) => {
    setOpen(false);
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / unitMs);
    if (days > 0) onDelay(days);
  };

  return (
    <div className="snooze-menu" ref={ref}>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <Icon name="clock" size={14} />
        דחייה
        <span className="snooze-menu-caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="snooze-menu-list" role="menu">
          {SNOOZE_PRESETS.map(({ label, days }) => (
            <button key={days} type="button" role="menuitem" className="snooze-menu-item" onClick={() => pickDays(days)}>
              {label}
            </button>
          ))}
          <div className="snooze-menu-sep" />
          <DatePickerButton label="בחירת תאריך…" onSelect={pickDate} />
        </div>
      )}
    </div>
  );
}
