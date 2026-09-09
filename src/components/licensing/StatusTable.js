import { useState } from 'react';
import { calcDaysRemaining, isReminderDue } from '../../notifications/reminderUtils';
import { REMINDER_DAYS_PRESETS, ONE_DAY_MS, NOTIFICATION_DELAY_UNIT } from '../../constants';
import DatePickerButton from '../DatePickerButton';

const ONE_MINUTE_MS = 60 * 1000;
const unitMs = NOTIFICATION_DELAY_UNIT === 'minutes' ? ONE_MINUTE_MS : ONE_DAY_MS;

// ── ReminderCell ────────────────────────────────────────────────────────────
// Renders the תזכורת column cell.
// States:
//   no reminder set → select (preset + custom)
//   custom selected → date picker
//   reminder set, not due → countdown badge + clear
//   reminder due (≤ 0) → "היום!" badge + clear
function ReminderCell({ reminder, onChange }) {
  const [customMode, setCustomMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const daysLeft = calcDaysRemaining(reminder);
  const due = isReminderDue(reminder);

  const fire = async (days) => {
    setLoading(true);
    try {
      await onChange(days);
    } finally {
      setLoading(false);
    }
  };

  const confirmDate = (dateStr) => {
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / unitMs);
    if (days > 0) {
      fire(days);
      setCustomMode(false);
    }
  };

  if (loading) {
    return <div className="reminder-spinner" />;
  }

  // — Active reminder: show countdown or "due" badge —
  if (reminder && !customMode) {
    return (
      <div className={`reminder-badge ${due ? 'reminder-due' : 'reminder-active'}`}>
        <span className="reminder-text">
          {due ? 'היום!' : `${daysLeft} ${daysLeft === 1 ? 'יום' : 'ימים'}`}
        </span>
        <button
          className="reminder-clear-btn"
          onClick={() => fire(null)}
          title="מחק תזכורת"
        >
          ✕
        </button>
      </div>
    );
  }

  // — Custom: pick a date —
  if (customMode) {
    return (
      <div className="reminder-custom">
        <DatePickerButton onSelect={confirmDate} />
        <button className="btn btn-ghost btn-sm" onClick={() => setCustomMode(false)}>✕</button>
      </div>
    );
  }

  // — No reminder set: show select —
  return (
    <select
      className="reminder-select"
      value=""
      onChange={e => {
        const v = e.target.value;
        if (!v) return;
        if (v === 'custom') { setCustomMode(true); return; }
        fire(parseInt(v, 10));
      }}
    >
      <option value="">הוסף תזכורת</option>
      {REMINDER_DAYS_PRESETS.map(d => (
        <option key={d} value={d}>
          {d === 1 ? 'יום אחד' : `${d} ימים`}
        </option>
      ))}
      <option value="custom">מותאם...</option>
    </select>
  );
}

// ── StatusTable ─────────────────────────────────────────────────────────────
// Props:
//   title, rows, columns, onChange, showHeader, rowClassName, footer — existing
//   reminders     — array of row_reminders DB rows for this section (filtered externally)
//   onReminderChange(rowLabel, days|null) — set or clear a reminder for a row
export default function StatusTable({
  title, rows, columns, onChange,
  showHeader = true, rowClassName, footer,
  reminders = [], onReminderChange,
}) {
  const updateCell = (rowIdx, key, value) => {
    onChange(rows.map((r, i) => i === rowIdx ? { ...r, [key]: value } : r));
  };

  const renderCell = (row, col, rowIdx) => {
    const value = row[col.key] ?? '';

    if (col.type === 'text') return value;

    if (col.type === 'select') {
      const colorName = col.statusColors?.[value];
      const lastOptionValue = col.options?.length ? col.options[col.options.length - 1].value : null;
      return (
        <div className={`status-badge-wrap${colorName ? ` status-badge-${colorName}` : ''}`}>
          <select value={value} onChange={(e) => {
            const newVal = e.target.value;
            updateCell(rowIdx, col.key, newVal);
            // Auto-clear reminder on terminal statuses (done or not-needed).
            const isTerminal = newVal && (newVal === lastOptionValue || newVal === 'not_required' || newVal === 'present');
            if (isTerminal && onReminderChange) {
              const rowLabel = row.label || row.type || String(rowIdx);
              onReminderChange(rowLabel, null);
            }
          }}>
            {col.options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );
    }

    if (col.type === 'input') {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => updateCell(rowIdx, col.key, e.target.value)}
          placeholder={col.placeholder || ''}
        />
      );
    }

    if (col.type === 'reminder') {
      const rowLabel = row.label || row.type || String(rowIdx);
      const reminder = reminders.find(r => r.row_label === rowLabel);
      return (
        <ReminderCell
          reminder={reminder}
          onChange={(days) => onReminderChange?.(rowLabel, days)}
        />
      );
    }

    return null;
  };

  return (
    <div className="detail-section">
      {title && <h3 className="detail-section-title">{title}</h3>}
      <table className="docs-table">
        {showHeader && (
          <thead>
            <tr>{columns.map(c => <th key={c.key}>{c.header || ''}</th>)}</tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || row.type || i} className={rowClassName ? rowClassName(row) : ''}>
              {columns.map(c => <td key={c.key}>{renderCell(row, c, i)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {footer && <div className="status-table-footer">{footer}</div>}
    </div>
  );
}
