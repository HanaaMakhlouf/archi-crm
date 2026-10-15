import { useState, useEffect, useCallback, useMemo } from 'react';
import { useActivityLog } from '../utils/useActivityLog';
import { callAdminUsers } from '../utils/adminUsers';
import { useAuth } from '../contexts/AuthContext';
import { startOfDay } from '../utils/format';
import { ActivityFeed } from './ActivityList';

const dayStartIso = (dateStr, addDays = 0) => startOfDay(dateStr, addDays).toISOString();

// Managers' office-wide activity log: everything done on every client,
// filterable by client, employee and date range.
export default function ActivityView({ clients, onOpenClient }) {
  const { officeId } = useAuth();
  const [clientId, setClientId] = useState('');
  const [actorId, setActorId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    callAdminUsers('list')
      .then(({ users: list }) => setUsers((list || []).filter(u => !u.pending)))
      .catch(err => console.error('Activity users error:', err.message)); // filter just stays empty
  }, []);

  const applyFilters = useCallback(q => {
    q = q.eq('office_id', String(officeId));
    if (clientId) q = q.eq('client_id', clientId);
    if (actorId) q = q.eq('actor_id', actorId);
    if (from) q = q.gte('created_at', dayStartIso(from));
    if (to) q = q.lt('created_at', dayStartIso(to, 1)); // "to" day is inclusive
    return q;
  }, [officeId, clientId, actorId, from, to]);

  const log = useActivityLog(applyFilters);

  const clientOptions = useMemo(
    () => [...clients].sort((a, b) => a.name.localeCompare(b.name, 'he')),
    [clients],
  );
  const clientIds = useMemo(() => new Set(clients.map(c => String(c.id))), [clients]);
  const hasFilters = clientId || actorId || from || to;

  const clearFilters = () => {
    setClientId(''); setActorId(''); setFrom(''); setTo('');
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><strong>ראשי</strong> / יומן פעילות</div>
          <h1 className="page-title">יומן פעילות</h1>
          <p className="page-subtitle">כל מה שנעשה בתיקי הלקוחות: מי, מה ומתי.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost" onClick={log.reload}>רענון</button>
        </div>
      </div>

      <div className="detail-section activity-filters">
        <div className="form-group">
          <label>לקוח</label>
          <select value={clientId} onChange={e => setClientId(e.target.value)}>
            <option value="">כל הלקוחות</option>
            {clientOptions.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>עובד</label>
          <select value={actorId} onChange={e => setActorId(e.target.value)}>
            <option value="">כל העובדים</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>מתאריך</label>
          <input type="date" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="form-group">
          <label>עד תאריך</label>
          <input type="date" value={to} min={from || undefined} onChange={e => setTo(e.target.value)} />
        </div>
        {hasFilters && (
          <div className="form-group activity-filters-clear">
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>ניקוי סינון</button>
          </div>
        )}
      </div>

      <div className="detail-section">
        <ActivityFeed
          log={log}
          emptyText={hasFilters ? 'אין פעילות שתואמת לסינון.' : 'עדיין לא נרשמה פעילות.'}
          showClient
          onOpenClient={onOpenClient}
          canOpenClient={entry => clientIds.has(entry.client_id)}
        />
      </div>
    </>
  );
}
