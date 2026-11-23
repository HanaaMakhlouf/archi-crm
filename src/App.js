import { useState, useEffect, useMemo, useCallback, useDeferredValue, useRef } from 'react';
import './App.css';
import './styles/Mobile.css';
import { supabase } from './supabaseClient';
import { useAuth } from './contexts/AuthContext';
import { useClients } from './hooks/useClients';
import { useReminders } from './hooks/useReminders';
import Sidebar from './components/Sidebar';
import ClientDetail from './components/ClientDetail';
import ClientForm from './components/ClientForm';
import Inbox from './components/Inbox';
import SettingsView from './components/SettingsView';
import ActivityView from './components/ActivityView';
import ArchiveView from './components/ArchiveView';
import PriorityDot from './components/PriorityDot';
import ExportClientsDialog from './components/ExportClientsDialog';
import { alertDialog } from './components/AppDialog';
import Icon, { getInitials } from './components/Icon';
import { getCurrentLicensingPhaseLabel } from './components/LicensingTab';
import { getCurrentPlanningStageLabel } from './components/PlanningTab';
import { formatDate } from './utils/format';
import { DEFAULT_SORT, filterAndSortClients } from './utils/clientList';
import { openClientFolder } from './utils/openClientFolder';
import { helkaToStrings } from './utils/land';
import { useFitColumns } from './utils/useFitColumns';
import { ClientsContext } from './utils/addedRows';
import { goBack, historyState } from './utils/useHistoryStep';
import { useNotifications } from './notifications/useNotifications';
import { useMessages } from './notifications/useMessages';
import {
  TYPE_PLANNING, TYPE_LICENSING, TYPE_DETAILED, CLIENT_TYPES,
  VIEW_CLIENTS, VIEW_DETAIL, VIEW_FORM, VIEW_INBOX, VIEW_SETTINGS, VIEW_ACTIVITY, VIEW_ARCHIVE, TAB_ACTIVITY,
  FIELD_ARCHIVED_AT,
  LICENSING_PHASE_INFO, LICENSING_PHASE_APPLICATION,
  LICENSING_PHASE_CONDITIONS, LICENSING_PHASE_CONFIRMATION, LICENSING_PHASE_FORM4,
  FILE_LINK_2_PATH, ROLE_MANAGER, PRIORITY_RED,
} from './constants';

// Maps a reminder's section_key to the tab + licensing phase to navigate to.
function resolveNavHint(sectionKey) {
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

// Clickable column title. The first click sorts by `firstDir` (A→ת for text,
// newest first for dates); each further click reverses it. One column at a time.
function SortHeader({ column, label, sort, onChange, firstDir = 'asc' }) {
  const active = sort !== DEFAULT_SORT && sort.key === column; // the untouched default shows no arrow
  const toggle = () => onChange({
    key: column,
    dir: active ? (sort.dir === 'asc' ? 'desc' : 'asc') : firstDir,
  });
  return (
    <button type="button" className={`th-sort-btn${active ? ' active' : ''}`} onClick={toggle}>
      {label}
      <span className="th-sort-arrow">{active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
    </button>
  );
}

const EMPTY_FORM = {
  name: '', phone: '', city: '', email: '',
  gush: '', helka: [''], migrash: '', notes: '', client_type: [], type_attributes: {},
  planning_data: {},
};

const NAV_STORAGE_KEY = 'nav_state';

function readSavedNav() {
  try {
    return JSON.parse(sessionStorage.getItem(NAV_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export default function App() {
  const { isViewer, isAdmin, userRole } = useAuth();
  const isManager = isAdmin || userRole === ROLE_MANAGER;
  const canEditPriority = isManager;

  // ── DATA ──
  const {
    clients, openClients, archivedClients, loading, fetchError,
    fetchClients, handleUpdateClient, handleDelete, handleArchive, handleReactivate,
  } = useClients({ isManager });
  const {
    reminders, fetchReminders, handleReminderChange, handleClearReminders, handleUpdateReminder,
  } = useReminders();

  // ── NAVIGATION / VIEW ──
  // The current page survives a refresh (per browser tab). An unsaved form
  // can't be restored, so a refresh mid-edit lands on that client's page.
  const [view, setView] = useState(() => {
    const { view: v, clientId } = readSavedNav();
    if (v === VIEW_FORM) return clientId ? VIEW_DETAIL : VIEW_CLIENTS;
    return v || VIEW_CLIENTS;
  });
  const [selectedClient, setSelectedClient] = useState(null);
  const [initialTab, setInitialTab] = useState(null); // set when navigating from Inbox

  // ── FILTERS / SEARCH / SORT ──
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(DEFAULT_SORT);     // one column sorts at a time
  const [exportOpen, setExportOpen] = useState(false);
  const closeExport = useCallback(() => setExportOpen(false), []);

  // ── FORM STATE ──
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');

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
    const clientId = view === VIEW_FORM ? editingId : selectedClient?.id;
    try {
      sessionStorage.setItem(NAV_STORAGE_KEY, JSON.stringify({ view, clientId: clientId || null }));
    } catch { /* storage unavailable — just don't persist */ }
  }, [view, selectedClient, editingId]);

  // ── BROWSER BACK ──
  // Each page change becomes a browser-history step, so the browser's (and the
  // phone's) back button returns to the page before instead of leaving the app.
  // The form is a passing step: leaving it forward replaces it.
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
  const openFormRef = useRef(null);
  useEffect(() => {
    const onPop = (e) => {
      const nav = e.state?.nav;
      if (!nav) return;
      const client = nav.clientId != null ? clientsRef.current.find(c => c.id === nav.clientId) : null;
      if (nav.view === VIEW_FORM) { openFormRef.current(client); return; }
      if (nav.view === VIEW_DETAIL) {
        if (!client) { setSelectedClient(null); setView(VIEW_CLIENTS); return; }
        setInitialTab(e.state.tab || null);
        setSelectedClient(client);
        setView(VIEW_DETAIL);
        return;
      }
      setSelectedClient(null);
      setEditingId(null);
      setView(nav.view);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const openForm = (client = null) => {
    if (client) {
      setForm({
        name: client.name, phone: client.phone, city: client.city, email: client.email || '',
        gush: client.gush?.toString() || '',
        helka: helkaToStrings(client.helka),
        migrash: client.migrash?.toString() || '', notes: client.notes || '',
        client_type: client.client_type || [],
        type_attributes: client.type_attributes || {},
        planning_data: client.planning_data || {},
      });
      setEditingId(client.id);
    } else {
      setForm(EMPTY_FORM);
      setEditingId(null);
    }
    setFormError('');
    setView(VIEW_FORM);
  };
  openFormRef.current = openForm;

  const toggleType = (type) => setForm(prev => {
    const newTypes = prev.client_type.includes(type)
      ? prev.client_type.filter(t => t !== type)
      : [...prev.client_type, type];
    const newAttrs = { ...prev.type_attributes };
    if (!prev.client_type.includes(type)) {
      newAttrs[type] = {};
    } else {
      delete newAttrs[type];
    }
    return { ...prev, client_type: newTypes, type_attributes: newAttrs };
  });

  // Automatic notifications are for managers only; everyone gets the
  // messages managers forward to them.
  const { notifications: allNotifications, snoozeNotification } = useNotifications(openClients, reminders);
  const notifications = isManager ? allNotifications : [];
  const { messages, unreadCount, imageUrls, markRead, refresh: refreshMessages } = useMessages({ onOpen: () => setView(VIEW_INBOX) });

  // A row's status changed by hand. If a manager sent someone this row as a
  // task, the manager gets an update; a done status also closes the task
  // (every worker's copy) and the row's reminder. All in report_row_status
  // (supabase/migrations/20261123_task_status_updates.sql).
  const handleRowStatusChange = useCallback(async (client, sectionKey, rowLabel, { from, to, done }) => {
    if (isViewer || !rowLabel) return;
    const message = `${done ? '✓ הושלם · ' : ''}${rowLabel}: ${from ? `מ"${from}" ` : ''}ל"${to}"`;
    const { error } = await supabase.rpc('report_row_status', {
      p_client_id: String(client.id),
      p_section_key: sectionKey,
      p_row_label: rowLabel,
      p_message: message,
      p_done: done,
    });
    // PGRST202: the database hasn't been updated with the function yet.
    if (error) {
      if (error.code !== 'PGRST202') console.error('Status report error:', error.message);
      return;
    }
    if (done) { refreshMessages(); fetchReminders(); }
  }, [isViewer, refreshMessages, fetchReminders]);
  const notificationCount = notifications.length + unreadCount;

  // The box updates on every key; the table follows a beat later, so typing never waits on it.
  const deferredSearch = useDeferredValue(search);
  const filtered = useMemo(() => filterAndSortClients(openClients, {
    search: deferredSearch,
  }, sort), [openClients, deferredSearch, sort]);

  // Narrow window: the table drops columns until it fits (see App.css).
  const tableBoxRef = useFitColumns(6, [view, filtered]);

  const urgentCount = useMemo(() => openClients.filter(c => c.priority === PRIORITY_RED).length, [openClients]);

  const STATS = [
    { label: 'סה״כ לקוחות', value: openClients.length, icon: 'users', tone: '' },
    { label: 'בעדיפות דחופה', value: urgentCount, icon: 'flag', tone: 'danger' },
  ];

  // RENDER LAYER
  return (
    // Every client: "+ הוסף שורה" offers rows added to the same section before.
    <ClientsContext.Provider value={clients}>
    <div className="app-layout">
      <Sidebar
        view={view}
        setView={setView}
        notificationCount={notificationCount}
        archiveCount={archivedClients.length}
      />

      <main className="main-content">

        {/* ── CLIENTS LIST VIEW ── */}
        {view === VIEW_CLIENTS && (
          <>
            {fetchError && (
              <div className="form-error" style={{ marginBottom: '1rem' }}>{fetchError}</div>
            )}
            <div className="page-header">
              <div>
                <div className="page-eyebrow"><strong>ראשי</strong> / לקוחות</div>
                <h1 className="page-title">לקוחות</h1>
                <p className="page-subtitle">כל תיקי הלקוחות של המשרד, במקום אחד.</p>
              </div>
              <div className="page-actions">
                {openClients.length > 0 && (
                  <button className="btn btn-ghost" onClick={() => setExportOpen(true)}>
                    <Icon name="download" size={16} />
                    ייצוא
                  </button>
                )}
                {!isViewer && (
                  <button className="btn btn-primary" onClick={() => openForm()}>
                    <Icon name="plus" size={16} strokeWidth={2.4} />
                    לקוח חדש
                  </button>
                )}
              </div>
              {exportOpen && (
                // In the list's current order (sort applies; the search box doesn't).
                <ExportClientsDialog
                  clients={filterAndSortClients(openClients, {}, sort)}
                  onClose={closeExport}
                />
              )}
            </div>

            <div className="clients-stats-row">
              {STATS.map(s => (
                <div key={s.label} className="client-stat">
                  <div className={`stat-icon ${s.tone}`}><Icon name={s.icon} size={21} /></div>
                  <div className="stat-body">
                    <span className="stat-label">{s.label}</span>
                    <span className="stat-number">{s.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="table-card">
              <div className="list-toolbar">
                <div className="list-toolbar-title">
                  רשימת לקוחות
                  <span className="list-toolbar-count">{filtered.length} תוצאות</span>
                </div>
                {/* A label, so a click anywhere in the box (icon, padding) focuses the input. */}
                <label className="search-bar">
                  <Icon name="search" size={16} />
                  <input
                    type="text"
                    placeholder="חיפוש לפי שם, עיר, גוש או מס' בקשה..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </label>
              </div>

              {/* ── LOADING SKELETON ── */}
              {loading ? (
                <div className="loading-state" style={{ padding: 18 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton-card">
                      <div className="skeleton skeleton-heading" />
                      <div className="skeleton skeleton-text" />
                      <div className="skeleton skeleton-text" />
                    </div>
                  ))}
                </div>

                /* ── EMPTY STATE ── */
              ) : openClients.length === 0 ? (
                <div className="empty-state">
                  <Icon name="users" size={48} strokeWidth={1.5} />
                  <h3>אין לקוחות עדיין</h3>
                  <p>הוסיפו את הלקוח הראשון כדי להתחיל</p>
                  {!isViewer && (
                    <button className="btn btn-primary" onClick={() => openForm()}>
                      <Icon name="plus" size={16} strokeWidth={2.4} />
                      הוספת לקוח
                    </button>
                  )}
                </div>

                /* ── CLIENTS TABLE ── */
              ) : (
                <div className="clients-table-scroll" ref={tableBoxRef}>
                <table className="clients-table">
                  <thead>
                    <tr>
                      <th><SortHeader column="name" label="לקוח" sort={sort} onChange={setSort} /></th>
                      <th><SortHeader column="priority" label="עדיפות" sort={sort} onChange={setSort} firstDir="desc" /></th>
                      <th className="col-type">סוג תיק</th>
                      <th className="col-phase">שלב ברישוי</th>
                      <th><SortHeader column="city" label="עיר" sort={sort} onChange={setSort} /></th>
                      <th>גוש / חלקה</th>
                      <th className="col-request">מס' בקשה</th>
                      <th className="col-updated">
                        <SortHeader column="updated" label="עדכון אחרון" sort={sort} onChange={setSort} firstDir="desc" />
                      </th>
                      <th className="col-created">
                        <SortHeader column="created" label="תאריך יצירה" sort={sort} onChange={setSort} firstDir="desc" />
                      </th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* No matches: keep the table (and its column widths) in place. */}
                    {filtered.length === 0 && (
                      <tr className="clients-table-empty">
                        <td colSpan={10}>לא נמצאו לקוחות התואמים ל״{deferredSearch.trim()}״</td>
                      </tr>
                    )}
                    {filtered.map(client => {
                      const types = client.client_type || [];
                      const helkaText = client.helka && client.helka.length ? client.helka.join(', ') : '';
                      return (
                        <tr
                          key={client.id}
                          onClick={() => { setInitialTab(null); setSelectedClient(client); setView(VIEW_DETAIL); }}
                          className="clients-table-row"
                        >
                          <td className="cell-name">
                            <div className="client-cell">
                              <div className="client-avatar">{getInitials(client.name)}</div>
                              <div>
                                <div className="client-name">{client.name}</div>
                                {types.includes(TYPE_LICENSING) && (
                                  <div className="client-sub client-sub--phase">
                                    <span className="client-sub-key">רישוי · </span>{getCurrentLicensingPhaseLabel(client)}
                                  </div>
                                )}
                                {client.last_change_summary && (
                                  <div className="client-sub-faint">{client.last_change_summary}</div>
                                )}
                                {types.includes(TYPE_PLANNING) && (
                                  <div className="client-sub">
                                    <span className="client-sub-key">תכנון · </span>{getCurrentPlanningStageLabel(client)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="cell-priority">
                            <PriorityDot
                              value={client.priority}
                              editable={canEditPriority}
                              onChange={(v) => handleUpdateClient(client.id, { priority: v })}
                            />
                          </td>
                          <td className="col-type">
                            {types.length > 0
                              ? <div className="type-tags-cell">{types.map(t => <span key={t} className="type-tag">{t}</span>)}</div>
                              : <span className="muted">—</span>}
                          </td>
                          <td className="cell-phase col-phase" data-label="שלב ברישוי">
                            {types.includes(TYPE_LICENSING)
                              ? <span className="phase-tag">{getCurrentLicensingPhaseLabel(client)}</span>
                              : <span className="muted">—</span>}
                          </td>
                          <td className="cell-secondary cell-city" data-label="עיר">{client.city || '—'}</td>
                          <td className="cell-plot" data-label="גוש / חלקה">
                            {client.gush || helkaText ? `${client.gush || '—'} / ${helkaText || '—'}` : '—'}
                          </td>
                          <td className="cell-request col-request" data-label="מס' בקשה">{client.licensing_data?.application?.request_number || '—'}</td>
                          <td className="cell-updated col-updated" data-label="עדכון אחרון">
                            {client.last_updated_at
                              ? <bdi dir="ltr">{formatDate(client.last_updated_at)}</bdi>
                              : <span className="muted">—</span>}
                          </td>
                          <td className="cell-secondary cell-created col-created">
                            <bdi dir="ltr">{formatDate(client.created_at)}</bdi>
                          </td>
                          <td className="cell-actions" onClick={e => e.stopPropagation()}>
                            <div className="row-actions">
                              {client[FILE_LINK_2_PATH] && (
                                <button
                                  className="icon-btn folder-btn--set"
                                  onClick={async () => {
                                    if (!window.electronAPI?.isElectron) return;
                                    const err = await openClientFolder(client[FILE_LINK_2_PATH], (u) => handleUpdateClient(client.id, u));
                                    if (err) alertDialog(err);
                                  }}
                                  title={`פתח תיקייה: ${client[FILE_LINK_2_PATH]}`}
                                >
                                  <Icon name="folder" size={16} />
                                </button>
                              )}
                              {!isViewer && (
                                <>
                                  <button className="icon-btn" onClick={() => openForm(client)} title="עריכה">
                                    <Icon name="edit" size={16} />
                                  </button>
                                  <button className="icon-btn danger" onClick={() => handleDelete(client.id)} title="מחיקה">
                                    <Icon name="trash" size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── OTHER VIEWS ── */}
        {view === VIEW_DETAIL && selectedClient && (
          <ClientDetail
            key={selectedClient.id}
            client={selectedClient}
            onBack={() => goBack(() => { setView(selectedClient[FIELD_ARCHIVED_AT] ? VIEW_ARCHIVE : VIEW_CLIENTS); setSelectedClient(null); })}
            onEdit={() => openForm(selectedClient)}
            onArchive={() => handleArchive(selectedClient)}
            onReactivate={() => handleReactivate(selectedClient)}
            onUpdateClient={handleUpdateClient}
            reminders={reminders.filter(r => r.client_id === selectedClient.id)}
            onReminderChange={handleReminderChange}
            onClearReminders={handleClearReminders}
            onRowStatusChange={handleRowStatusChange}
            initialTab={initialTab}
          />
        )}
        {view === VIEW_FORM && (
          <ClientForm
            form={form}
            setForm={setForm}
            editingId={editingId}
            editingClient={clients.find(c => c.id === editingId) || null}
            formError={formError}
            setFormError={setFormError}
            onCancel={() => goBack(() => { setView(VIEW_CLIENTS); setEditingId(null); })}
            toggleType={toggleType}
            clientTypes={CLIENT_TYPES}
            fetchClients={fetchClients}
            clients={clients}
            onOpenClient={(client) => {
              setEditingId(null);
              setInitialTab(null);
              setSelectedClient(client);
              setView(VIEW_DETAIL);
            }}
          />
        )}
        {view === VIEW_INBOX && (
          <Inbox
            isManager={isManager}
            messages={messages}
            imageUrls={imageUrls}
            onMarkRead={markRead}
            clients={clients}
            notifications={notifications}
            snoozeNotification={snoozeNotification}
            onUpdateReminder={handleUpdateReminder}
            onGoToClient={(client, sectionKey) => {
              const hint = resolveNavHint(sectionKey);
              // If it's a licensing tab with a specific phase, pre-set it in localStorage
              // so LicensingTab picks it up on mount.
              if (hint?.phase) {
                localStorage.setItem(`licensing_phase_${client.id}`, hint.phase);
              }
              setInitialTab(hint?.tab || null);
              setSelectedClient(client);
              setView(VIEW_DETAIL);
            }}
          />
        )}
        {view === VIEW_ARCHIVE && (
          <ArchiveView
            clients={archivedClients}
            canEdit={isManager}
            onReactivate={handleReactivate}
            onOpenClient={(client) => {
              setInitialTab(null);
              setSelectedClient(client);
              setView(VIEW_DETAIL);
            }}
          />
        )}
        {view === VIEW_SETTINGS && <SettingsView />}
        {view === VIEW_ACTIVITY && isManager && (
          <ActivityView
            clients={clients}
            onOpenClient={(entry) => {
              const client = clients.find(c => String(c.id) === entry.client_id);
              if (!client) return;
              setInitialTab(TAB_ACTIVITY);
              setSelectedClient(client);
              setView(VIEW_DETAIL);
            }}
          />
        )}
      </main>
    </div>
    </ClientsContext.Provider>
  );
}
