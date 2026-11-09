import { useState, useEffect, useRef } from 'react';

// In-app replacement for window.confirm / window.alert: same look as the rest
// of the app, right-to-left, and no Windows title bar ("client-manager").
//   if (!(await confirmDialog({ title, message, confirmLabel, danger }))) return;
//   alertDialog('שגיאה ...');
// <DialogHost /> is mounted once (index.js); dialogs opened together show one at a time.

let enqueue = null;

const open = (dialog) => new Promise((resolve) => {
  // Host not mounted (shouldn't happen): fall back to the browser's own.
  if (!enqueue) {
    resolve(dialog.kind === 'confirm' ? window.confirm(dialog.message) : (window.alert(dialog.message), undefined));
    return;
  }
  enqueue({ ...dialog, resolve });
});

// Resolves true on confirm; false on cancel, Esc or a click outside.
export const confirmDialog = ({ title, message, confirmLabel = 'אישור', cancelLabel = 'ביטול', danger = false }) =>
  open({ kind: 'confirm', title, message, confirmLabel, cancelLabel, danger });

export const alertDialog = (message, { title, confirmLabel = 'אישור' } = {}) =>
  open({ kind: 'alert', title, message, confirmLabel });

export function DialogHost() {
  const [queue, setQueue] = useState([]);
  const current = queue[0];
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    enqueue = (dialog) => setQueue(q => [...q, dialog]);
    return () => { enqueue = null; };
  }, []);

  const close = (result) => {
    current.resolve(current.kind === 'confirm' ? result : undefined);
    setQueue(q => q.slice(1));
  };

  useEffect(() => {
    if (!current) return;
    // Something that can't be undone starts on ביטול, so Enter doesn't do it by accident.
    (current.danger ? cancelRef : confirmRef).current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') close(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!current) return null;

  return (
    <div className="discard-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) close(false); }}>
      <div className="discard-dialog app-dialog" role="alertdialog" aria-labelledby="app-dialog-title" aria-describedby="app-dialog-text" dir="rtl">
        {current.title && <h3 id="app-dialog-title">{current.title}</h3>}
        <p id="app-dialog-text">{current.message}</p>
        <div className="discard-actions">
          <button
            ref={confirmRef}
            type="button"
            className={`btn ${current.danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => close(true)}
          >
            {current.confirmLabel}
          </button>
          {current.kind === 'confirm' && (
            <button ref={cancelRef} type="button" className="btn btn-ghost" onClick={() => close(false)}>
              {current.cancelLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
