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
import { useNotifications } from './notifications/useNotifications';
import {
  LABEL_NEW, LABEL_PERMANENT, LABEL_INACTIVE, LABEL_OPTIONS,
  TYPE_PLANNING, TYPE_LICENSING, TYPE_DETAILED, CLIENT_TYPES,
  VIEW_CLIENTS, VIEW_DETAIL, VIEW_FORM, VIEW_INBOX, VIEW_SETTINGS,
  TABLE_CLIENTS, TABLE_ROW_REMINDERS,
  LICENSING_PHASE_INFO, LICENSING_PHASE_APPLICATION,
  LICENSING_PHASE_CONDITIONS, LICENSING_PHASE_CONFIRMATION,
  FILE_LINK_2_PATH,
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
  gush: '', helka: '', migrash: '', notes: '', client_type: [], type_attributes: {},
  planning_data: {},
};

export default function App() {
  const { officeId } = useAuth();

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
        gush: client.gush?.toString() || '', helka: client.helka?.toString() || '',
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
    const { error } = await supabase.from(TABLE_CLIENTS).update(updates).eq('id', id);
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
  }, [fetchReminders, officeId]);

  // Delete all reminders for a section (GrayOut reset).
  // sectionKey ending with '*' → prefix match (clears all sub-sections).
  const handleClearReminders = useCallback(async (clientId, sectionKey) => {
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
  }, [fetchReminders]);

  // Update an existing reminder by its DB id (used from InboxView delay/dismiss).
  const handleUpdateReminder = useCallback(async (reminderId, newDays) => {
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
  }, [fetchReminders]);

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

  // RENDER LAYER
  return (
    <div className="app-layout">
      <Sidebar
        view={view}
        setView={setView}
        openForm={openForm}
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
                <h1 className="page-title">לקוחות</h1>
                <p className="page-subtitle">{filtered.length} לקוחות נמצאו</p>
              </div>
              <button className="btn btn-primary" onClick={() => openForm()}>+ הוסף לקוח</button>
            </div>

            <div className="search-bar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="חפש לפי שם או עיר..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="clients-stats-row">
              <div className="client-stat">
                <span className="stat-number">{clients.length}</span>
                <span className="stat-label">סה״כ</span>
              </div>
              <div className="client-stat">
                <span className="stat-number">{permanentCount}</span>
                <span className="stat-label">קבועים</span>
              </div>
              <div className="client-stat">
                <span className="stat-number">{newCount}</span>
                <span className="stat-label">חדשים</span>
              </div>
            </div>

            {/* ── LOADING SKELETON ── */}
            {loading ? (
              <div className="loading-state">
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
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                <h3>אין לקוחות עדיין</h3>
                <p>הוסף את הלקוח הראשון שלך כדי להתחיל</p>
                <button className="btn btn-primary" onClick={() => openForm()}>הוסף לקוח</button>
              </div>

              /* ── CLIENTS TABLE ── */
            ) : (
              <table className="clients-table">
                <thead>
                  <tr>
                    <th>
                      <div className="th-filter-row">
                        <span>שם</span>
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
                    <th>עיר</th>
                    <th>גוש / חלקה</th>
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
                    <th>טלפון</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(client => (
                    <tr
                      key={client.id}
                      onClick={() => { setSelectedClient(client); setView(VIEW_DETAIL); }}
                      className="clients-table-row"
                    >
                      <td className="cell-name">
                        {client.name}
                        {client.label !== LABEL_PERMANENT && (
                          <span className={`label-badge ${getLabelClass(client.label)}`}>
                            {client.label}
                          </span>
                        )}
                      </td>
                      <td className="cell-secondary">{client.city || '—'}</td>
                      <td className="cell-plot">
                        {client.gush || client.helka ? `${client.gush || '—'} / ${client.helka || '—'}` : '—'}
                      </td>
                      <td>
                        {(client.client_type || []).length > 0
                          ? (client.client_type).map(t => (
                            <span key={t} className="type-tag">{t}</span>
                          ))
                          : <span className="cell-secondary">—</span>
                        }
                      </td>
                      <td className="cell-phone">{client.phone || '—'}</td>
                      <td className="cell-actions" onClick={e => e.stopPropagation()}>
                        <div className="row-actions">
                          {client[FILE_LINK_2_PATH] && (
                            <button
                              className="btn btn-ghost btn-sm folder-btn folder-btn--set"
                              onClick={e => { e.stopPropagation(); window.electronAPI?.openFolder(client[FILE_LINK_2_PATH]); }}
                              title={`פתח תיקייה: ${client[FILE_LINK_2_PATH]}`}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                            </button>
                          )}
                          <button className="btn btn-ghost btn-sm" onClick={() => openForm(client)}>✏️</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(client.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* ── OTHER VIEWS (unchanged) ── */}
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
