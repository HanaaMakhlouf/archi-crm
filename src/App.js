import { useState, useCallback } from 'react';
import './App.css';
import './styles/Mobile.css';
import { supabase } from './supabaseClient';
import { useAuth } from './contexts/AuthContext';
import { useClients } from './hooks/useClients';
import { useReminders } from './hooks/useReminders';
import { useNavigation, resolveNavHint } from './hooks/useNavigation';
import Sidebar from './components/Sidebar';
import ClientsListView from './components/clients/ClientsListView';
import ClientDetail from './components/ClientDetail';
import ClientForm from './components/ClientForm';
import Inbox from './components/Inbox';
import SettingsView from './components/SettingsView';
import ActivityView from './components/ActivityView';
import ArchiveView from './components/ArchiveView';
import { DEFAULT_SORT } from './utils/clientList';
import { helkaToStrings } from './utils/land';
import { ClientsContext } from './utils/addedRows';
import { goBack } from './utils/useHistoryStep';
import { useNotifications } from './notifications/useNotifications';
import { useMessages } from './notifications/useMessages';
import {
  CLIENT_TYPES,
  VIEW_CLIENTS, VIEW_DETAIL, VIEW_FORM, VIEW_INBOX, VIEW_SETTINGS, VIEW_ACTIVITY, VIEW_ARCHIVE, TAB_ACTIVITY,
  FIELD_ARCHIVED_AT, ROLE_MANAGER,
} from './constants';

const EMPTY_FORM = {
  name: '', phone: '', city: '', email: '',
  gush: '', helka: [''], migrash: '', notes: '', client_type: [], type_attributes: {},
  planning_data: {},
};

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

  // ── FILTERS / SEARCH / SORT ──
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(DEFAULT_SORT);     // one column sorts at a time

  // ── FORM STATE ──
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');

  // ── NAVIGATION / VIEW ──
  const {
    view, setView, selectedClient, setSelectedClient, initialTab, setInitialTab,
  } = useNavigation({
    clients, loading, editingId,
    onPopToForm: (client) => openForm(client),
    onPopAway: () => setEditingId(null),
  });

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

        {view === VIEW_CLIENTS && (
          <ClientsListView
            clients={openClients}
            loading={loading}
            fetchError={fetchError}
            isViewer={isViewer}
            canEditPriority={canEditPriority}
            search={search}
            onSearchChange={setSearch}
            sort={sort}
            onSortChange={setSort}
            onNewClient={() => openForm()}
            onOpen={(client) => { setInitialTab(null); setSelectedClient(client); setView(VIEW_DETAIL); }}
            onEdit={(client) => openForm(client)}
            onDelete={(client) => handleDelete(client.id)}
            onUpdate={(client, updates) => handleUpdateClient(client.id, updates)}
          />
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
