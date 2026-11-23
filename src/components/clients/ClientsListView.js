import { useState, useMemo, useCallback, useDeferredValue } from 'react';
import Icon from '../Icon';
import ExportClientsDialog from '../ExportClientsDialog';
import ClientsTable from './ClientsTable';
import { filterAndSortClients } from '../../utils/clientList';
import { PRIORITY_RED } from '../../constants';

// The לקוחות page: header (ייצוא, לקוח חדש), the stats, search and the table.
// `search` and `sort` live in App so they're kept while another page is open.
export default function ClientsListView({
  clients, loading, fetchError, isViewer, canEditPriority,
  search, onSearchChange, sort, onSortChange,
  onNewClient, onOpen, onEdit, onDelete, onUpdate,
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const closeExport = useCallback(() => setExportOpen(false), []);

  // The box updates on every key; the table follows a beat later, so typing never waits on it.
  const deferredSearch = useDeferredValue(search);
  const filtered = useMemo(() => filterAndSortClients(clients, {
    search: deferredSearch,
  }, sort), [clients, deferredSearch, sort]);

  const urgentCount = useMemo(() => clients.filter(c => c.priority === PRIORITY_RED).length, [clients]);

  const STATS = [
    { label: 'סה״כ לקוחות', value: clients.length, icon: 'users', tone: '' },
    { label: 'בעדיפות דחופה', value: urgentCount, icon: 'flag', tone: 'danger' },
  ];

  return (
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
          {clients.length > 0 && (
            <button className="btn btn-ghost" onClick={() => setExportOpen(true)}>
              <Icon name="download" size={16} />
              ייצוא
            </button>
          )}
          {!isViewer && (
            <button className="btn btn-primary" onClick={onNewClient}>
              <Icon name="plus" size={16} strokeWidth={2.4} />
              לקוח חדש
            </button>
          )}
        </div>
        {exportOpen && (
          // In the list's current order (sort applies; the search box doesn't).
          <ExportClientsDialog
            clients={filterAndSortClients(clients, {}, sort)}
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
              onChange={e => onSearchChange(e.target.value)}
            />
          </label>
        </div>

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
        ) : clients.length === 0 ? (
          <div className="empty-state">
            <Icon name="users" size={48} strokeWidth={1.5} />
            <h3>אין לקוחות עדיין</h3>
            <p>הוסיפו את הלקוח הראשון כדי להתחיל</p>
            {!isViewer && (
              <button className="btn btn-primary" onClick={onNewClient}>
                <Icon name="plus" size={16} strokeWidth={2.4} />
                הוספת לקוח
              </button>
            )}
          </div>
        ) : (
          <ClientsTable
            clients={filtered}
            searchText={deferredSearch}
            sort={sort}
            onSortChange={onSortChange}
            canEditPriority={canEditPriority}
            isViewer={isViewer}
            onOpen={onOpen}
            onEdit={onEdit}
            onDelete={onDelete}
            onUpdate={onUpdate}
          />
        )}
      </div>
    </>
  );
}
