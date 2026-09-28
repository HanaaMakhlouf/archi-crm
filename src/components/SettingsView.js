import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_USER, ROLE_VIEWER } from '../constants';

const ROLE_OPTIONS = [
  { value: ROLE_USER,    label: 'עובד' },
  { value: ROLE_VIEWER,  label: 'צופה' },
  { value: ROLE_MANAGER, label: 'מנהל' },
  { value: ROLE_ADMIN,   label: 'אדמין' },
];

const ROLE_LABELS = { [ROLE_USER]: 'עובד', [ROLE_VIEWER]: 'צופה', [ROLE_MANAGER]: 'מנהל', [ROLE_ADMIN]: 'אדמין' };

function canAct(myRole, targetRole) {
  if (myRole === ROLE_ADMIN) return true;
  // manager: cannot touch admins
  if (targetRole === ROLE_ADMIN) return false;
  return true;
}

function allowedRoles(myRole) {
  if (myRole === ROLE_ADMIN) return ROLE_OPTIONS;
  // manager cannot assign admin
  return ROLE_OPTIONS.filter(r => r.value !== ROLE_ADMIN);
}

// All privileged operations run server-side in the admin-users Edge Function
// (holds the service-role key) — the client never touches it directly.
async function callAdminUsers(action, payload = {}) {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action, ...payload },
  });
  if (error) {
    // supabase-js doesn't parse the function's JSON body on non-2xx
    // responses by default — it only gives a generic message. The actual
    // {error: "..."} body is on error.context (the raw Response).
    let detail = error.message;
    try {
      const body = await error.context?.json();
      if (body?.error) detail = body.error;
    } catch { /* response wasn't JSON or already consumed */ }
    throw new Error(detail || 'שגיאת שרת');
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export default function SettingsView() {
  const { userRole, officeId, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState(ROLE_USER);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { users: list } = await callAdminUsers('list');
      setUsers(list || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      await callAdminUsers('create', {
        username: newUsername.trim(),
        password: newPassword,
        role: newRole,
        officeId,
      });
      setNewUsername('');
      setNewPassword('');
      setNewRole(ROLE_USER);
      setShowAddForm(false);
      await fetchUsers();
    } catch (err) {
      setAddError(err.message);
    }
    setAdding(false);
  };

  const handleRoleChange = async (userId, newRoleVal) => {
    setActionError(null);
    try {
      await callAdminUsers('updateRole', { userId, role: newRoleVal, officeId });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRoleVal } : u));
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('למחוק משתמש זה לצמיתות?')) return;
    setActionError(null);
    try {
      await callAdminUsers('delete', { userId });
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">הגדרות</h1>
          <p className="page-subtitle">ניהול משתמשים</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowAddForm(s => !s); setAddError(null); }}>
          {showAddForm ? 'ביטול' : '+ הוסף עובד'}
        </button>
      </div>

      {showAddForm && (
        <form className="detail-section" style={{ marginBottom: 16 }} onSubmit={handleAddUser}>
          <h3 className="detail-section-title">הוספת עובד חדש</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2, minWidth: 200 }}>
              <label>שם משתמש</label>
              <input
                type="text"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder="worker1"
                required
              />
            </div>
            <div className="form-group" style={{ flex: 2, minWidth: 160 }}>
              <label>סיסמה</label>
              <input
                type="text"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="לפחות 6 תווים"
                minLength={6}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 130 }}>
              <label>תפקיד</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value)}>
                {allowedRoles(userRole).map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={adding} style={{ marginBottom: 16 }}>
              {adding ? '...' : 'הוסף עובד'}
            </button>
          </div>
          {addError && <p style={{ color: 'var(--color-error)', marginTop: 8, fontSize: 13 }}>{addError}</p>}
          <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            העובד יוכל להתחבר מיד עם שם המשתמש והסיסמה שהוגדרו כאן.
          </p>
        </form>
      )}

      {actionError && (
        <p style={{ color: 'var(--color-error)', marginBottom: 12, fontSize: 13 }}>{actionError}</p>
      )}

      {loading ? (
        <p className="muted">טוען...</p>
      ) : error ? (
        <p style={{ color: 'var(--color-error)' }}>{error}</p>
      ) : (
        <div className="detail-section">
          <h3 className="detail-section-title">משתמשים ({users.length})</h3>
          {users.length === 0 ? (
            <p className="muted">אין משתמשים</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'right' }}>
                  <th style={{ padding: '8px 12px', fontWeight: 600, fontSize: 13 }}>שם משתמש</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600, fontSize: 13 }}>תפקיד</th>
                  {isAdmin && <th style={{ padding: '8px 12px', fontWeight: 600, fontSize: 13 }}>משרד</th>}
                  <th style={{ padding: '8px 12px', fontWeight: 600, fontSize: 13 }}>תאריך הצטרפות</th>
                  <th style={{ padding: '8px 12px' }} />
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const editable = canAct(userRole, u.role);
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '10px 12px', fontSize: 14 }}>{u.username}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {editable ? (
                          <select
                            value={u.role}
                            onChange={e => handleRoleChange(u.id, e.target.value)}
                            style={{ fontSize: 13 }}
                          >
                            {allowedRoles(userRole).map(r => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="type-tag">{ROLE_LABELS[u.role] || u.role}</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                          {u.officeName || '—'}
                        </td>
                      )}
                      <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                        {new Date(u.createdAt).toLocaleDateString('he-IL')}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'left' }}>
                        {editable && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--color-error)' }}
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            מחק
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
}
