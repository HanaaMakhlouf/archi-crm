import { useState } from 'react';

// "+ הוסף" under a status table → inline name field. Rejects names already in
// the table, since a row's name keys its reminder.
export default function AddRow({
  existing, placeholder, onAdd,
  buttonLabel = '+ הוסף', buttonClassName = 'add-row-btn',
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const trimmed = name.trim();
  const duplicate = existing.includes(trimmed);

  const close = () => { setOpen(false); setName(''); };
  const submit = () => {
    if (!trimmed || duplicate) return;
    onAdd(trimmed);
    close();
  };

  if (!open) {
    return <button type="button" className={buttonClassName} onClick={() => setOpen(true)}>{buttonLabel}</button>;
  }
  return (
    <div className="add-row-form">
      <input
        type="text"
        autoFocus
        value={name}
        placeholder={placeholder}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); submit(); }
          if (e.key === 'Escape') close();
        }}
      />
      <button type="button" className="btn btn-primary btn-sm" disabled={!trimmed || duplicate} onClick={submit}>הוספה</button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={close}>ביטול</button>
      {duplicate && <span className="add-row-error">כבר קיימת שורה בשם הזה</span>}
    </div>
  );
}

// Licensing tables' look: a filled "+ הוסף שורה" button.
export const LICENSING_ADD_ROW_PROPS = { buttonLabel: '+ הוסף שורה', buttonClassName: 'btn btn-primary btn-sm' };

// A new row for a status table.
export const newStatusRow = (label, status) => ({ id: crypto.randomUUID(), label, status, note: '' });
