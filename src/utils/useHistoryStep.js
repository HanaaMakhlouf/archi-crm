import { useCallback, useEffect, useRef } from 'react';

// The app has no page addresses, so the browser's (and the phone's) back
// button would leave the app. Each step — page, client, tab, licensing stage —
// is written into the browser history instead, so back returns to the step
// before.
//
// history.state looks like { nav: { view, clientId }, idx, tab?, phase? }:
//   nav — the page (App.js), idx — how many steps deep we are in the app,
//   tab / phase — the step inside a client's page.

export const historyState = () => window.history.state || {};

// One step back in the app; when there's no earlier step, `fallback` runs.
export function goBack(fallback) {
  if ((historyState().idx ?? 0) > 0) window.history.back();
  else fallback?.();
}

// The value this entry recorded for a client's step, if any (to start on it).
export const recordedStep = (name, clientId) => {
  const st = historyState();
  return st.nav?.clientId === clientId ? st[name] : undefined;
};

// A step inside a client's page (`name` = 'tab' or 'phase'). `select` moves
// to a value and records it, so back returns to the value before it.
export function useHistoryStep(name, value, setValue, clientId) {
  const first = useRef(value); // what an entry without this step shows
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const onPop = (e) => {
      const st = e.state || {};
      if (st.nav?.clientId !== clientId) return; // another page — App.js handles it
      const v = st[name] ?? first.current;
      if (v !== valueRef.current) setValue(v);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [name, setValue, clientId]);

  return useCallback((v) => {
    if (v === valueRef.current) return;
    setValue(v);
    const { phase, ...st } = historyState();
    // A new tab starts its stages fresh; within a tab the stage is kept.
    const keep = name === 'tab' ? st : { ...st, phase };
    window.history.pushState({ ...keep, [name]: v, idx: (st.idx ?? 0) + 1 }, '');
  }, [name, setValue]);
}
