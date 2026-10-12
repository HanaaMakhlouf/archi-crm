import { useState, useEffect, useCallback, useMemo } from 'react';
import { useActivityLog } from '../utils/useActivityLog';
import { callAdminUsers } from '../utils/adminUsers';
import { useAuth } from '../contexts/AuthContext';
import { ActivityFeed } from './ActivityList';
import { AUTO_ACTIVITY_TYPES, MANUAL_ACTIVITY_OPTIONS } from '../constants';

const TYPE_CHANGES = 'changes'; // filter value: every automatic (field change) row

// "2026-10-12" (local day) → ISO timestamp of that day's start, shifted by `addDays`.
const dayStartIso = (dateStr, addDays = 0) => {
  const d = new Date(`${dateStr}T00:00`);
  d.setDate(d.getDate() + addDays);
  return d.toISOString();
};

// Managers' office-wide activity log: everything done on every client,
// filterable by client, employee, type and date range.
export default function ActivityView({ clients, onOpenClient }) {
  const { officeId } = useAuth();
  const [clientId, setClientId] = useState('');
  const [actorId, setActorId] = useState('');
  const [type, setType] = useState('');
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
    if (type === TYPE_CHANGES) q = q.in('action', AUTO_ACTIVITY_TYPES);
    else if (type) q = q.eq('action', type);
    if (from) q = q.gte('created_at', dayStartIso(from));
    if (to) q = q.lt('created_at', dayStartIso(to, 1)); // "to" day is inclusive
    return q;
  }, [officeId, clientId, actorId, type, from, to]);

  const log = useActivityLog(applyFilters);

  const clientOptions = useMemo(
    () => [...clients].sort((a, b) => a.name.localeCompare(b.name, 'he')),
    [clients],
  );
  const clientIds = useMemo(() => new Set(clients.map(c => String(c.id))), [clients]);
  const hasFilters = clientId || actorId || type || from || to;

  const clearFilters = () => {
    setClientId(''); setActorId(''); setType(''); setFrom(''); setTo('');
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
          <label>סוג</label>
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="">הכל</option>
            <option value={TYPE_CHANGES}>שינויים בתיק</option>
            {MANUAL_ACTIVITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
