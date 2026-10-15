import { useRef, useCallback, useEffect } from 'react';
import { TEXT_SAVE_IDLE_MS } from '../constants';

const NON_TEXT_INPUTS = new Set(['checkbox', 'radio', 'date', 'file', 'range', 'color', 'button', 'submit']);

// True while the user is typing in a text box (the change came from it).
const isTyping = () => {
  const el = document.activeElement;
  if (!el) return false;
  if (el.tagName === 'TEXTAREA') return true;
  return el.tagName === 'INPUT' && !NON_TEXT_INPUTS.has(el.type);
};

// Every save of a client writes an activity-log entry, so typed text must not
// save on each pause. schedule(value) saves dropdown/button changes at once;
// typed changes wait until the field loses focus (call flush from onBlur),
// the component unmounts, or typing stops for TEXT_SAVE_IDLE_MS.
export function useDeferredSave(save) {
  const pending = useRef(null);
  const timer = useRef(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    if (!pending.current) return;
    const { value } = pending.current;
    pending.current = null;
    saveRef.current(value);
  }, []);

  const schedule = useCallback((value) => {
    pending.current = { value };
    clearTimeout(timer.current);
    if (isTyping()) timer.current = setTimeout(flush, TEXT_SAVE_IDLE_MS);
    else flush();
  }, [flush]);

  useEffect(() => flush, [flush]); // don't lose the last words on close

  return { schedule, flush };
}
