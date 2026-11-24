import { useCallback, useEffect, useRef } from 'react';

// The app has no page addresses, so the browser's (and the phone's) back
// button would leave the app. Each page and client is written into the browser
// history instead, so back returns to the step before; inside a client's page,
// back from any tab returns to כללי (see useHistoryStep).
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

// A step inside a client's page (`name` = 'tab' or 'phase'); `select` moves to
// a value and records it.
//  • With a `home` value (the client's tabs, home = כללי): any other tab is one
//    back-step above the client's page, so back from any tab returns to כללי,
//    and back from כללי leaves the client. Moving between other tabs doesn't
//    add steps.
//  • Without one (licensing stages): the stage is only remembered in the
//    current step, so back leaves the tab rather than walking the stages.
export function useHistoryStep(name, value, setValue, clientId, home) {
  const first = useRef(value); // what an entry without this step shows
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const onPop = (e) => {
      const st = e.state || {};
      if (st.nav?.clientId !== clientId) return; // another page — App.js handles it
      const v = st[name] ?? home ?? first.current;
      if (v !== valueRef.current) setValue(v);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [name, setValue, clientId, home]);

  // Opened straight on another tab (remembered, or from התראות): add the step
  // above the client's page, so back goes to `home` first. It waits a moment
  // so the client's own page step (App.js) is written before it.
  useEffect(() => {
    if (home === undefined || first.current === home) return undefined;
    const t = setTimeout(() => {
      const st = historyState();
      if (st.nav?.clientId !== clientId || st[name] !== undefined || valueRef.current === home) return;
      window.history.pushState({ ...st, [name]: valueRef.current, idx: (st.idx ?? 0) + 1 }, '');
    }, 0);
    return () => clearTimeout(t);
  }, [name, clientId, home]);

  return useCallback((v) => {
    if (v === valueRef.current) return;
    setValue(v);
    const st = historyState();
    if (home === undefined) {
      window.history.replaceState({ ...st, [name]: v }, '');
      return;
    }
    const { phase, ...rest } = st; // a new tab starts its stages fresh
    const onHome = st[name] === undefined || st[name] === home;
    if (v === home) {
      if (!onHome) window.history.back(); // back down to the client's page
    } else if (onHome) {
      window.history.pushState({ ...rest, [name]: v, idx: (st.idx ?? 0) + 1 }, '');
    } else {
      window.history.replaceState({ ...rest, [name]: v }, '');
    }
  }, [name, setValue, home]);
}
