import { useState, useMemo, useEffect } from 'react';
import Icon from './Icon';
import PriorityDot from './PriorityDot';
import { matchesSearch } from '../utils/clientList';
import { exportClientsPdf } from '../utils/clientExport';
import { alertDialog } from './AppDialog';
import { PRIORITY_OPTIONS, PRIORITY_GREEN, priorityOf } from '../constants';

// Every client has a priority; none set reads as נמוכה (as on the list's dot).
const priorityValue = (c) => priorityOf(c.priority) || PRIORITY_GREEN;

// Pick which clients go into the PDF: narrow by search and priority, tick
// the ones wanted (all to start with), export — in the clients list's order.
// What's printed is what's ticked AND shown.
export default function ExportClientsDialog({ clients, onClose }) {
  const [selected, setSelected] = useState(() => new Set(clients.map(c => c.id)));
  const [search, setSearch] = useState('');
  const [priorities, setPriorities] = useState(() => new Set()); // empty = all
  const [busy, setBusy] = useState(false);

  const shown = useMemo(() => clients.filter(c =>
    matchesSearch(c, search) && (!priorities.size || priorities.has(priorityValue(c)))
  ), [clients, search, priorities]);

  const picked = shown.filter(c => selected.has(c.id));
  const allShownSelected = shown.length > 0 && picked.length === shown.length;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const togglePriority = (value) => setPriorities(prev => {
    const next = new Set(prev);
    if (next.has(value)) next.delete(value); else next.add(value);
    return next;
  });

  const setShown = (on) => setSelected(prev => {
    const next = new Set(prev);
    shown.forEach(c => (on ? next.add(c.id) : next.delete(c.id)));
    return next;
  });

  const handleExport = async () => {
    setBusy(true);
    const err = await exportClientsPdf(picked);
    setBusy(false);
    if (err) { alertDialog(err); return; }
    onClose();
  };

  const filtering = search.trim() || priorities.size;

  return (
    <div className="discard-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="discard-dialog export-dialog" role="dialog" aria-labelledby="export-dialog-title" dir="rtl">
        <h3 id="export-dialog-title">ייצוא רשימת לקוחות</h3>
        <p className="export-dialog-hint">סננו וסמנו — הלקוחות המסומנים יודפסו לקובץ PDF.</p>

        <label className="search-bar export-dialog-search">
          <Icon name="search" size={16} />
          <input
            type="text"
            placeholder="חיפוש לפי שם, עיר, גוש או מס' בקשה..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </label>

        <div className="export-dialog-filters">
          <div className="export-dialog-chips" role="group" aria-label="סינון לפי עדיפות">
            <span className="export-dialog-label">עדיפות:</span>
            {PRIORITY_OPTIONS.map(o => (
              <button
                key={o.value}
                type="button"
                className={`export-chip${priorities.has(o.value) ? ' active' : ''}`}
                aria-pressed={priorities.has(o.value)}
                onClick={() => togglePriority(o.value)}
              >
                <span className="export-chip-dot" style={{ background: o.color }} />
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div className="export-dialog-bar">
          <label className="export-dialog-row export-dialog-all">
            <input
              type="checkbox"
              checked={allShownSelected}
              disabled={!shown.length}
              onChange={() => setShown(!allShownSelected)}
            />
            {filtering ? 'בחירת כל התוצאות' : 'בחירת הכל'}
          </label>
          <span className="export-dialog-count">ייוצאו {picked.length} מתוך {clients.length}</span>
        </div>

        <ul className="export-dialog-list">
          {shown.length === 0 && <li className="export-dialog-empty">לא נמצאו לקוחות</li>}
          {shown.map(c => (
            <li key={c.id}>
              <label className="export-dialog-row">
                <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} />
                <PriorityDot value={c.priority} editable={false} size={11} />
                <span className="export-dialog-name">{c.name}</span>
                {c.city && <span className="export-dialog-city">{c.city}</span>}
              </label>
            </li>
          ))}
        </ul>

        <div className="discard-actions">
          <button type="button" className="btn btn-primary" onClick={handleExport} disabled={!picked.length || busy}>
            <Icon name="download" size={16} />
            {busy ? 'מייצא...' : `ייצוא ל-PDF${picked.length ? ` (${picked.length})` : ''}`}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>ביטול</button>
        </div>
      </div>
    </div>
  );
}
