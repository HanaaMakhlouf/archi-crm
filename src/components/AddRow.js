import { useEffect, useRef, useState } from 'react';
import { confirmDialog } from './AppDialog';
import { Highlight } from './ClientNameInput';

const EDIT_OPTIONS = '__edit_options';

const sameOptions = (a, b) => !!a && !!b && a.length === b.length
  && a.every((o, i) => o.value === b[i].value && o.label === b[i].label);
const newOptionValue = () => `opt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// "+ הוסף" under a status table → one line: the row's name, its status, הוספה.
// Rejects names already in the table, since a row's name keys its reminder.
//   history: [{ label, options }] rows added to this section before (on any
//     client), offered under the name field so they're quick to add again.
//   statusOptions(label) + defaultStatus(label): the status dropdown. Its last
//     item opens a small editor to change the new row's options.
// onAdd(label, status, options): options is null while the usual list is kept.
export default function AddRow({
  existing, placeholder, onAdd, history = [],
  statusOptions, defaultStatus,
  buttonLabel = '+ הוסף', buttonClassName = 'add-row-btn',
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState(null);   // null: the default for the name
  const [edited, setEdited] = useState(null);   // null: the usual options for the name
  const [editing, setEditing] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const editorRef = useRef(null);
  const focusLast = useRef(false);

  const trimmed = name.trim();
  const duplicate = existing.includes(trimmed);

  const baseOptions = statusOptions?.(trimmed);
  const options = edited || baseOptions;
  const usable = options?.filter(o => o.label.trim());
  const chosen = usable && (usable.some(o => o.value === status) ? status
    : usable.some(o => o.value === defaultStatus(trimmed)) ? defaultStatus(trimmed) : usable[0]?.value);

  // Earlier rows matching what's typed, minus the ones this client already has.
  const suggestions = history
    .filter(h => !existing.includes(h.label) && (!trimmed || h.label.includes(trimmed)))
    .slice(0, 8);
  const showSuggestions = suggestOpen && suggestions.length > 0 && !editing;

  useEffect(() => {
    if (!focusLast.current) return;
    focusLast.current = false;
    const inputs = editorRef.current?.querySelectorAll('input');
    inputs?.[inputs.length - 1]?.focus();
  }, [edited]);

  const close = () => {
    setOpen(false); setName(''); setStatus(null); setEdited(null); setEditing(false); setSuggestOpen(false);
  };
  const canSubmit = trimmed && !duplicate && usable?.length !== 0;
  const submit = () => {
    if (!canSubmit) return;
    const custom = usable && !sameOptions(usable, baseOptions)
      ? usable.map(o => ({ ...o, label: o.label.trim() }))
      : null;
    onAdd(trimmed, chosen, custom);
    close();
  };

  const pickSuggestion = (h) => {
    setName(h.label);
    setEdited(h.options || null);
    setStatus(null);
    setSuggestOpen(false);
    setActive(-1);
  };

  const setOption = (i, label) => setEdited(options.map((o, j) => (j === i ? { ...o, label } : o)));
  const removeOption = (i) => setEdited(options.filter((_, j) => j !== i));
  const addOption = () => { focusLast.current = true; setEdited([...options, { value: newOptionValue(), label: '' }]); };

  // Reordering: hold an option's ⋮⋮ handle and drag it up or down (mouse or touch).
  const [dragging, setDragging] = useState(null); // index of the option being moved
  const dragTo = (clientY) => {
    const rows = [...(editorRef.current?.querySelectorAll('.options-editor-row') || [])];
    let target = rows.findIndex(r => { const b = r.getBoundingClientRect(); return clientY < b.top + b.height / 2; });
    if (target < 0) target = rows.length - 1;
    if (target === dragging || dragging === null) return;
    const next = [...options];
    const [moved] = next.splice(dragging, 1);
    next.splice(target, 0, moved);
    setEdited(next);
    setDragging(target);
  };

  if (!open) {
    return <button type="button" className={buttonClassName} onClick={() => setOpen(true)}>{buttonLabel}</button>;
  }
  return (
    <div className="add-row-box">
      <div className="add-row-form">
        <div className="suggest-wrap add-row-name">
          <input
            type="text"
            autoFocus
            value={name}
            placeholder={placeholder}
            autoComplete="off"
            onChange={e => { setName(e.target.value); setSuggestOpen(true); setActive(-1); }}
            onFocus={() => setSuggestOpen(true)}
            onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
            onKeyDown={e => {
              if (e.key === 'ArrowDown' && suggestions.length) {
                e.preventDefault(); setSuggestOpen(true); setActive(i => (i + 1) % suggestions.length);
              } else if (e.key === 'ArrowUp' && suggestions.length) {
                e.preventDefault(); setActive(i => (i <= 0 ? suggestions.length - 1 : i - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (showSuggestions && active >= 0) pickSuggestion(suggestions[active]); else submit();
              } else if (e.key === 'Escape') {
                if (showSuggestions) setSuggestOpen(false); else close();
              }
            }}
          />
          {showSuggestions && (
            <div className="suggest-list add-row-suggest" role="listbox">
              <div className="add-row-suggest-title">נוספו בעבר</div>
              {suggestions.map((h, i) => (
                <button
                  key={h.label}
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  className={`suggest-item add-row-suggest-item${i === active ? ' active' : ''}`}
                  onMouseDown={e => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pickSuggestion(h)}
                >
                  <span>{trimmed ? <Highlight text={h.label} query={trimmed} /> : h.label}</span>
                  {h.options && <span className="add-row-suggest-options">{h.options.map(o => o.label).join(' · ')}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {usable && (
          <select
            className="add-row-status"
            value={chosen ?? ''}
            aria-label="סטטוס"
            onChange={e => {
              if (e.target.value === EDIT_OPTIONS) { setEdited(options); setEditing(true); return; }
              setStatus(e.target.value);
            }}
          >
            {usable.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            <option disabled>──────────</option>
            <option value={EDIT_OPTIONS}>✎ עריכת האפשרויות…</option>
          </select>
        )}
        <button type="button" className="btn btn-primary btn-sm" disabled={!canSubmit} onClick={submit}>הוספה</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={close}>ביטול</button>
        {duplicate && <span className="add-row-error">כבר קיימת שורה בשם הזה</span>}
      </div>

      {editing && (
        <div className="options-editor" ref={editorRef}>
          <div className="options-editor-head">
            <span>האפשרויות ברשימה</span>
            {!sameOptions(options, baseOptions) && (
              <button type="button" className="link-btn" onClick={() => { setEdited(null); setStatus(null); }}>חזרה לרשימה הרגילה</button>
            )}
          </div>
          {options.map((o, i) => (
            <div key={o.value} className={`options-editor-row${dragging === i ? ' is-dragging' : ''}`}>
              <span
                className="drag-handle"
                title="גרירה לשינוי הסדר"
                aria-hidden="true"
                onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); setDragging(i); }}
                onPointerMove={e => { if (dragging !== null) dragTo(e.clientY); }}
                onPointerUp={() => setDragging(null)}
                onPointerCancel={() => setDragging(null)}
              >
                ⋮⋮
              </span>
              <input
                type="text"
                value={o.label}
                placeholder="שם האפשרות"
                onChange={e => setOption(i, e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
              />
              {i === options.length - 1
                ? <span className="options-editor-done" title="בחירה באפשרות האחרונה מסמנת שהשורה הושלמה">✓ הושלם</span>
                : <span className="options-editor-done" />}
              <button type="button" className="row-remove-btn" title="הסרת אפשרות" disabled={options.length <= 1} onClick={() => removeOption(i)}>✕</button>
            </div>
          ))}
          <div className="options-editor-foot">
            <button type="button" className="link-btn" onClick={addOption}>+ אפשרות</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>סיום</button>
          </div>
        </div>
      )}
    </div>
  );
}

// A row's name with an ✕ that removes the row (after asking).
export function RemovableLabel({ row, onRemove }) {
  return (
    <span className="row-label">
      {row.label}
      <button
        type="button"
        className="row-remove-btn"
        title="הסרת שורה"
        onClick={async () => {
          if (await confirmDialog({ title: 'הסרת שורה', message: `להסיר את "${row.label}"?`, confirmLabel: 'הסרה', danger: true })) onRemove(row);
        }}
      >
        ✕
      </button>
    </span>
  );
}

// Licensing tables' look: a filled "+ הוסף שורה" button.
export const LICENSING_ADD_ROW_PROPS = { buttonLabel: '+ הוסף שורה', buttonClassName: 'btn btn-primary btn-sm' };

// A new row for a status table. options: the row's own dropdown, when it has one.
export const newStatusRow = (label, status, options = null) => ({
  id: crypto.randomUUID(), label, status, note: '', ...(options && { options }),
});

// A row with its own options is done at the last one.
export const isLastOwnOption = (row) => !!row.options?.length && row.status === row.options[row.options.length - 1].value;
