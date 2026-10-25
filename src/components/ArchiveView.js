import { useMemo, useState } from 'react';
import Icon, { getInitials } from './Icon';
import { formatDate } from '../utils/format';
import { FIELD_ARCHIVED_AT } from '../constants';

// ארכיון: closed client files, most recently closed first. Opening one shows
// it read-only; הפעלה מחדש returns it to the clients list.
export default function ArchiveView({ clients, canEdit, onOpenClient, onReactivate }) {
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients
      .filter(c => !q || c.name.toLowerCase().includes(q) || (c.city || '').toLowerCase().includes(q))
      .sort((a, b) => new Date(b[FIELD_ARCHIVED_AT]) - new Date(a[FIELD_ARCHIVED_AT]));
  }, [clients, search]);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><strong>ראשי</strong> / ארכיון</div>
          <h1 className="page-title">ארכיון</h1>
          <p className="page-subtitle">תיקים שנסגרו. כל הנתונים נשמרים, ואפשר להפעיל תיק מחדש בכל עת.</p>
        </div>
      </div>

      <div className="table-card">
        <div className="list-toolbar">
          <div className="list-toolbar-title">
            תיקים סגורים
            <span className="list-toolbar-count">{rows.length} תוצאות</span>
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

        {rows.length === 0 ? (
          <div className="empty-state">
            <Icon name="archive" size={48} strokeWidth={1.5} />
            <h3>{clients.length === 0 ? 'הארכיון ריק' : 'לא נמצאו תיקים'}</h3>
            <p>{clients.length === 0 ? 'תיק שייסגר מעמוד הלקוח יופיע כאן.' : 'נסו לשנות את החיפוש'}</p>
          </div>
        ) : (
          <table className="clients-table">
            <thead>
              <tr>
                <th>לקוח</th>
                <th>סוג תיק</th>
                <th>עיר</th>
                <th>נסגר בתאריך</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(client => (
                <tr key={client.id} className="clients-table-row" onClick={() => onOpenClient(client)}>
                  <td className="cell-name">
                    <div className="client-cell">
                      <div className="client-avatar archive-avatar">{getInitials(client.name)}</div>
                      <div className="client-name">{client.name}</div>
                    </div>
                  </td>
                  <td>
                    {(client.client_type || []).length > 0
                      ? client.client_type.map(t => <span key={t} className="type-tag">{t}</span>)
                      : <span className="muted">—</span>}
                  </td>
                  <td className="cell-secondary">{client.city || '—'}</td>
                  <td className="cell-secondary"><bdi dir="ltr">{formatDate(client[FIELD_ARCHIVED_AT])}</bdi></td>
                  <td className="cell-actions" onClick={e => e.stopPropagation()}>
                    {canEdit && (
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => onReactivate(client)}>
                        <Icon name="restore" size={14} />
                        הפעלה מחדש
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
