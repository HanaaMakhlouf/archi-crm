import { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';
import './styles/Mobile.css';
import { supabase } from './supabaseClient';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import ClientDetail from './components/ClientDetail';
import ClientForm from './components/ClientForm';
import Inbox from './components/Inbox';
import ColumnFilterButton from './components/ColumnFilterButton';
import SettingsView from './components/SettingsView';
import PriorityDot from './components/PriorityDot';
import Icon, { getInitials } from './components/Icon';
import { getCurrentLicensingPhaseLabel } from './components/LicensingTab';
import { getCurrentPlanningStageLabel } from './components/PlanningTab';
import { describeClientChange, formatRelativeTime } from './utils/changeSummary';
import { useNotifications } from './notifications/useNotifications';
import {
  LABEL_NEW, LABEL_PERMANENT, LABEL_INACTIVE, LABEL_OPTIONS,
  TYPE_PLANNING, TYPE_LICENSING, TYPE_DETAILED, CLIENT_TYPES,
  VIEW_CLIENTS, VIEW_DETAIL, VIEW_FORM, VIEW_INBOX, VIEW_SETTINGS,
  TABLE_CLIENTS, TABLE_ROW_REMINDERS,
  LICENSING_PHASE_INFO, LICENSING_PHASE_APPLICATION,
  LICENSING_PHASE_CONDITIONS, LICENSING_PHASE_CONFIRMATION,
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
  return null;
}

const EMPTY_FORM = {
  label: LABEL_NEW, name: '', phone: '', city: '', email: '',
  gush: '', helka: [''], migrash: '', notes: '', client_type: [], type_attributes: {},
  planning_data: {},
};

export default function App() {
  const { officeId, isViewer, isAdmin, userRole } = useAuth();
  const canEditPriority = isAdmin || userRole === ROLE_MANAGER;

  // ── DATA ──
  const [clients, setClients] = useState([]);
  const [reminders, setReminders] = useState([]);

  // ── NAVIGATION / VIEW ──
  const [view, setView] = useState(VIEW_CLIENTS);
  const [selectedClient, setSelectedClient] = useState(null);
  const [initialTab, setInitialTab] = useState(null); // set when navigating from Inbox

  // ── LOADING / ERROR ──
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // ── FILTERS / SEARCH / SORT ──
  const [search, setSearch] = useState('');
  const [filterLabel, setFilterLabel] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'alpha'

  // ── FORM STATE ──
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase.from(TABLE_CLIENTS).select('*').eq('office_id', officeId).order('created_at', { ascending: false });
    if (error) {
      console.error(error.message);
      setFetchError('שגיאה בטעינת הלקוחות. נסה לרענן את הדף.');
    } else {
      setClients(data);
    }
    setLoading(false);
  }, [officeId]);

  const fetchReminders = useCallback(async () => {
    const { data, error } = await supabase.from(TABLE_ROW_REMINDERS).select('*');
    if (!error) setReminders(data || []);
  }, []);

  useEffect(() => { fetchClients(); fetchReminders(); }, [fetchClients, fetchReminders]);

  // Keep selectedClient in sync after any client list update
  useEffect(() => {
    setSelectedClient(prev => {
      if (!prev) return prev;
      const fresh = clients.find(c => c.id === prev.id);
      return fresh || prev;
    });
  }, [clients]);

  const openForm = (client = null) => {
    if (client) {
      setForm({
        label: client.label || LABEL_NEW,
        name: client.name, phone: client.phone, city: client.city, email: client.email || '',
        gush: client.gush?.toString() || '',
        helka: Array.isArray(client.helka) && client.helka.length ? client.helka.map(String) : [''],
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

  const handleDelete = async (id) => {
    if (isViewer) return;
    const client = clients.find(c => c.id === id);
    const name = client?.name || 'לקוח זה';
    if (!window.confirm(`למחוק את "${name}"? פעולה זו אינה הפיכה.`)) return;
    const { error } = await supabase.from(TABLE_CLIENTS).delete().eq('id', id);
    if (error) {
      console.error(error.message);
      alert('שגיאה במחיקת הלקוח. נסה שוב.');
    } else {
      fetchClients();
    }
  };

  const handleUpdateClient = async (id, updates) => {
    if (isViewer) return;
    const previousClient = clients.find(c => c.id === id);
    const summary = describeClientChange(updates, previousClient);
    const payload = summary
      ? { ...updates, last_updated_at: new Date().toISOString(), last_change_summary: summary }
      : updates;
    const { error } = await supabase.from(TABLE_CLIENTS).update(payload).eq('id', id);
    if (error) {
      console.error('Update client error:', error.message);
    } else {
      fetchClients();
    }
  };

  // Set or clear a reminder for a specific row.
  // days === null → delete the reminder; days > 0 → upsert it.
  // Optimistic update first so Inbox reflects the change immediately.
  const handleReminderChange = useCallback(async (clientId, sectionKey, rowLabel, days) => {
    if (isViewer) return;
    if (days === null) {
      // Remove optimistically — notification disappears from Inbox at once.
      setReminders(prev => prev.filter(r =>
        !(r.client_id === clientId && r.section_key === sectionKey && r.row_label === rowLabel)
      ));
      await supabase.from(TABLE_ROW_REMINDERS)
        .delete()
        .eq('client_id', clientId)
        .eq('section_key', sectionKey)
        .eq('row_label', rowLabel);
    } else {
      const setAt = new Date().toISOString();
      // Update optimistically — countdown badge and future notification reflect new value.
      setReminders(prev => {
        const filtered = prev.filter(r =>
          !(r.client_id === clientId && r.section_key === sectionKey && r.row_label === rowLabel)
        );
        return [...filtered, { id: `opt_${Date.now()}`, client_id: clientId, section_key: sectionKey, row_label: rowLabel, days, set_at: setAt }];
      });
      await supabase.from(TABLE_ROW_REMINDERS)
        .upsert(
          { client_id: clientId, section_key: sectionKey, row_label: rowLabel, days, set_at: setAt, office_id: officeId },
          { onConflict: 'client_id,section_key,row_label' }
        );
    }
    // Sync with real DB id (replaces optimistic placeholder).
    fetchReminders();
  }, [fetchReminders, officeId, isViewer]);

  // Delete all reminders for a section (GrayOut reset).
  // sectionKey ending with '*' → prefix match (clears all sub-sections).
  const handleClearReminders = useCallback(async (clientId, sectionKey) => {
    if (isViewer) return;
    // Optimistic: remove from state immediately so Inbox clears at once.
    if (sectionKey.endsWith('*')) {
      const prefix = sectionKey.slice(0, -1);
      setReminders(prev => prev.filter(r => !(r.client_id === clientId && r.section_key.startsWith(prefix))));
    } else {
      setReminders(prev => prev.filter(r => !(r.client_id === clientId && r.section_key === sectionKey)));
    }
    let q = supabase.from(TABLE_ROW_REMINDERS).delete().eq('client_id', clientId);
    if (sectionKey.endsWith('*')) {
      q = q.like('section_key', sectionKey.slice(0, -1) + '%');
    } else {
      q = q.eq('section_key', sectionKey);
    }
    await q;
    fetchReminders();
  }, [fetchReminders, isViewer]);

  // Update an existing reminder by its DB id (used from InboxView delay/dismiss).
  const handleUpdateReminder = useCallback(async (reminderId, newDays) => {
    if (isViewer) return;
    if (newDays === null) {
      // Optimistic: remove immediately so Inbox clears at once.
      setReminders(prev => prev.filter(r => r.id !== reminderId));
      await supabase.from(TABLE_ROW_REMINDERS).delete().eq('id', reminderId);
    } else {
      const setAt = new Date().toISOString();
      // Optimistic: reset set_at so it's no longer "due" until new delay expires.
      setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, days: newDays, set_at: setAt } : r));
      await supabase.from(TABLE_ROW_REMINDERS)
        .update({ days: newDays, set_at: setAt })
        .eq('id', reminderId);
    }
    fetchReminders();
  }, [fetchReminders, isViewer]);

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

  const { notifications, notificationCount, snoozeNotification } = useNotifications(clients, reminders);

  const getLabelClass = (label) => {
    if (label === LABEL_NEW) return 'label-new';
    if (label === LABEL_PERMANENT) return 'label-permanent';
    if (label === LABEL_INACTIVE) return 'label-inactive';
    return '';
  };

  const filtered = useMemo(() => {
    const result = clients.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.city && c.city.toLowerCase().includes(search.toLowerCase()));
      const matchLabel = filterLabel ? c.label === filterLabel : true;
      const matchType = filterType ? (c.client_type && c.client_type.includes(filterType)) : true;
      return matchSearch && matchLabel && matchType;
    });

    return result.sort((a, b) => {
      // Non-active always at bottom
      const aInactive = a.label === LABEL_INACTIVE;
      const bInactive = b.label === LABEL_INACTIVE;
      if (aInactive !== bInactive) return aInactive ? 1 : -1;

      if (sortBy === 'alpha') return a.name.localeCompare(b.name, 'he');
      // default: newest first
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [clients, search, filterLabel, filterType, sortBy]);

  const permanentCount = useMemo(() => clients.filter(c => c.label === LABEL_PERMANENT).length, [clients]);
  const newCount = useMemo(() => clients.filter(c => c.label === LABEL_NEW).length, [clients]);
  const urgentCount = useMemo(() => clients.filter(c => c.priority === PRIORITY_RED).length, [clients]);

  const STATS = [
    { label: 'סה״כ לקוחות', value: clients.length, icon: 'users', tone: '' },
    { label: 'לקוחות פעילים', value: permanentCount, icon: 'userCheck', tone: 'success' },
    { label: 'לקוחות חדשים', value: newCount, icon: 'sparkle', tone: 'accent' },
    { label: 'בעדיפות דחופה', value: urgentCount, icon: 'flag', tone: 'danger' },
  ];

  // RENDER LAYER
  return (
    <div className="app-layout">
      <Sidebar
        view={view}
        setView={setView}
        notificationCount={notificationCount}
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
              {!isViewer && (
                <div className="page-actions">
                  <button className="btn btn-primary" onClick={() => openForm()}>
                    <Icon name="plus" size={16} strokeWidth={2.4} />
                    לקוח חדש
                  </button>
                </div>
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
                <div className="search-bar">
                  <Icon name="search" size={16} />
                  <input
                    type="text"
                    placeholder="חיפוש לפי שם או עיר..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
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
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <Icon name="users" size={48} strokeWidth={1.5} />
                  <h3>{clients.length === 0 ? 'אין לקוחות עדיין' : 'לא נמצאו לקוחות'}</h3>
                  <p>{clients.length === 0 ? 'הוסיפו את הלקוח הראשון כדי להתחיל' : 'נסו לשנות את החיפוש או הסינון'}</p>
                  {!isViewer && clients.length === 0 && (
                    <button className="btn btn-primary" onClick={() => openForm()}>
                      <Icon name="plus" size={16} strokeWidth={2.4} />
                      הוספת לקוח
                    </button>
                  )}
                </div>

                /* ── CLIENTS TABLE ── */
              ) : (
                <table className="clients-table">
                  <thead>
                    <tr>
                      <th>
                        <div className="th-filter-row">
                          <span>לקוח</span>
                          <ColumnFilterButton active={!!filterLabel || sortBy !== 'date'}>
                            <div className="form-group">
                              <label>סטטוס לקוח</label>
                              <select value={filterLabel} onChange={e => setFilterLabel(e.target.value)}>
                                <option value="">כל הלקוחות</option>
                                {LABEL_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                              </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label>מיון</label>
                              <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option value="date">תאריך יצירה</option>
                                <option value="alpha">א-ב</option>
                              </select>
                            </div>
                          </ColumnFilterButton>
                        </div>
                      </th>
                      <th>עדיפות</th>
                      <th>
                        <div className="th-filter-row">
                          <span>סוג תיק</span>
                          <ColumnFilterButton active={!!filterType}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label>סוג לקוח</label>
                              <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                                <option value="">כל הסוגים</option>
                                {CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                          </ColumnFilterButton>
                        </div>
                      </th>
                      <th>עיר</th>
                      <th>גוש / חלקה</th>
                      <th>טלפון</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(client => {
                      const types = client.client_type || [];
                      const helkaText = client.helka && client.helka.length ? client.helka.join(', ') : '';
                      return (
                        <tr
                          key={client.id}
                          onClick={() => { setSelectedClient(client); setView(VIEW_DETAIL); }}
                          className="clients-table-row"
                        >
                          <td className="cell-name">
                            <div className="client-cell">
                              <div className="client-avatar">{getInitials(client.name)}</div>
                              <div>
                                <div className="client-name">
                                  {client.name}
                                  {client.label !== LABEL_PERMANENT && (
                                    <span className={`label-badge ${getLabelClass(client.label)}`}>
                                      {client.label}
                                    </span>
                                  )}
                                </div>
                                {types.includes(TYPE_LICENSING) && (
                                  <div className="client-sub">
                                    <span className="client-sub-key">רישוי · </span>{getCurrentLicensingPhaseLabel(client)}
                                  </div>
                                )}
                                {types.includes(TYPE_PLANNING) && (
                                  <div className="client-sub">
                                    <span className="client-sub-key">תכנון · </span>{getCurrentPlanningStageLabel(client)}
                                  </div>
                                )}
                                <div className="client-sub-faint">
                                  {client.last_change_summary
                                    ? `עודכן ${formatRelativeTime(client.last_updated_at)} · ${client.last_change_summary}`
                                    : `נוסף ${formatRelativeTime(client.created_at)}`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <PriorityDot
                              value={client.priority}
                              editable={canEditPriority}
                              onChange={(v) => handleUpdateClient(client.id, { priority: v })}
                            />
                          </td>
                          <td>
                            {types.length > 0
                              ? types.map(t => <span key={t} className="type-tag">{t}</span>)
                              : <span className="muted">—</span>}
                          </td>
                          <td className="cell-secondary">{client.city || '—'}</td>
                          <td className="cell-plot">
                            {client.gush || helkaText ? `${client.gush || '—'} / ${helkaText || '—'}` : '—'}
                          </td>
                          <td className="cell-phone">{client.phone || '—'}</td>
                          <td className="cell-actions" onClick={e => e.stopPropagation()}>
                            <div className="row-actions">
                              {client[FILE_LINK_2_PATH] && (
                                <button
                                  className="icon-btn folder-btn--set"
                                  onClick={() => window.electronAPI?.openFolder(client[FILE_LINK_2_PATH])}
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
              )}
            </div>
          </>
        )}

        {/* ── OTHER VIEWS ── */}
        {view === VIEW_DETAIL && selectedClient && (
          <ClientDetail
            key={selectedClient.id}
            client={selectedClient}
            onBack={() => { setView(VIEW_CLIENTS); setSelectedClient(null); }}
            onEdit={() => openForm(selectedClient)}
            getLabelClass={getLabelClass}
            onUpdateClient={handleUpdateClient}
            reminders={reminders.filter(r => r.client_id === selectedClient.id)}
            onReminderChange={handleReminderChange}
            onClearReminders={handleClearReminders}
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
            onCancel={() => { setView(VIEW_CLIENTS); setEditingId(null); }}
            toggleType={toggleType}
            clientTypes={CLIENT_TYPES}
            labelOptions={LABEL_OPTIONS}
            fetchClients={fetchClients}
          />
        )}
        {view === VIEW_INBOX && (
          <Inbox
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
        {view === VIEW_SETTINGS && <SettingsView />}
      </main>
    </div>
  );
}
