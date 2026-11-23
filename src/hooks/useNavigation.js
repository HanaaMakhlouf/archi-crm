import { useState, useEffect, useRef } from 'react';
import { historyState } from '../utils/useHistoryStep';
import {
  TYPE_PLANNING, TYPE_LICENSING, TYPE_DETAILED,
  VIEW_CLIENTS, VIEW_DETAIL, VIEW_FORM,
  LICENSING_PHASE_INFO, LICENSING_PHASE_APPLICATION,
  LICENSING_PHASE_CONDITIONS, LICENSING_PHASE_CONFIRMATION, LICENSING_PHASE_FORM4,
} from '../constants';

// Maps a reminder's section_key to the tab + licensing phase to navigate to.
export function resolveNavHint(sectionKey) {
  if (!sectionKey) return null;
  if (sectionKey.startsWith('planning.')) return { tab: TYPE_PLANNING, phase: null };
  if (sectionKey.startsWith('detailed.'))  return { tab: TYPE_DETAILED,  phase: null };
  if (sectionKey.startsWith('licensing.info'))         return { tab: TYPE_LICENSING, phase: LICENSING_PHASE_INFO };
  if (sectionKey.startsWith('licensing.application'))  return { tab: TYPE_LICENSING, phase: LICENSING_PHASE_APPLICATION };
  if (sectionKey.startsWith('licensing.conditions'))   return { tab: TYPE_LICENSING, phase: LICENSING_PHASE_CONDITIONS };
  if (sectionKey.startsWith('licensing.confirmation')) return { tab: TYPE_LICENSING, phase: LICENSING_PHASE_CONFIRMATION };
  if (sectionKey.startsWith('licensing.form4'))        return { tab: TYPE_LICENSING, phase: LICENSING_PHASE_FORM4 };
  return null;
}

const NAV_STORAGE_KEY = 'nav_state';

function readSavedNav() {
  try {
    return JSON.parse(sessionStorage.getItem(NAV_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

// Which page is showing (view) and which client is open.
//  • The page survives a refresh (per browser tab). An unsaved form can't be
//    restored, so a refresh mid-edit lands on that client's page.
//  • Each page change is a browser-history step, so the browser's (and the
//    phone's) back button returns to the page before instead of leaving the app.
//    The form is a passing step: leaving it forward replaces it.
// The client form lives in App: editingId is the client it edits, and
// onPopToForm(client) / onPopAway() reopen it or let go of it on back/forward.
export function useNavigation({ clients, loading, editingId, onPopToForm, onPopAway }) {
  const [view, setView] = useState(() => {
    const { view: v, clientId } = readSavedNav();
    if (v === VIEW_FORM) return clientId ? VIEW_DETAIL : VIEW_CLIENTS;
    return v || VIEW_CLIENTS;
  });
  const [selectedClient, setSelectedClient] = useState(null);
  const [initialTab, setInitialTab] = useState(null); // set when navigating from Inbox

  // Keep selectedClient in sync after any client list update
  useEffect(() => {
    setSelectedClient(prev => {
      if (!prev) return prev;
      const fresh = clients.find(c => c.id === prev.id);
      return fresh || prev;
    });
  }, [clients]);

  // After a refresh on a client's page, re-select that client once loaded.
  useEffect(() => {
    if (loading || view !== VIEW_DETAIL || selectedClient) return;
    const saved = clients.find(c => c.id === readSavedNav().clientId);
    if (saved) setSelectedClient(saved);
    else setView(VIEW_CLIENTS); // client was deleted or belongs to another office
  }, [loading, view, selectedClient, clients]);

  useEffect(() => {
    // Still restoring the client after a refresh: saving now would forget which one.
    if (view === VIEW_DETAIL && !selectedClient) return;
    const clientId = view === VIEW_FORM ? editingId : selectedClient?.id;
    try {
      sessionStorage.setItem(NAV_STORAGE_KEY, JSON.stringify({ view, clientId: clientId || null }));
    } catch { /* storage unavailable — just don't persist */ }
  }, [view, selectedClient, editingId]);

  // ── BROWSER BACK ──
  const navClientId = view === VIEW_DETAIL ? selectedClient?.id ?? null : view === VIEW_FORM ? editingId : null;
  useEffect(() => {
    if (view === VIEW_DETAIL && !selectedClient) return; // still loading the client
    const st = historyState();
    const next = { view, clientId: navClientId };
    if (st.nav?.view === next.view && st.nav?.clientId === next.clientId) return;
    if (!st.nav) window.history.replaceState({ nav: next, idx: 0 }, '');
    else if (st.nav.view === VIEW_FORM) window.history.replaceState({ nav: next, idx: st.idx ?? 0 }, '');
    else window.history.pushState({ nav: next, idx: (st.idx ?? 0) + 1 }, '');
  }, [view, navClientId, selectedClient]);

  const clientsRef = useRef(clients);
  clientsRef.current = clients;
  const formRef = useRef({ onPopToForm, onPopAway });
  formRef.current = { onPopToForm, onPopAway };
  useEffect(() => {
    const onPop = (e) => {
      const nav = e.state?.nav;
      if (!nav) return;
      const client = nav.clientId != null ? clientsRef.current.find(c => c.id === nav.clientId) : null;
      if (nav.view === VIEW_FORM) { formRef.current.onPopToForm(client); return; }
      if (nav.view === VIEW_DETAIL) {
        if (!client) { setSelectedClient(null); setView(VIEW_CLIENTS); return; }
        setInitialTab(e.state.tab || null);
        setSelectedClient(client);
        setView(VIEW_DETAIL);
        return;
      }
      setSelectedClient(null);
      formRef.current.onPopAway();
      setView(nav.view);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return { view, setView, selectedClient, setSelectedClient, initialTab, setInitialTab };
}
