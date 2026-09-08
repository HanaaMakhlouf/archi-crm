import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { VIEW_CLIENTS, VIEW_INBOX, VIEW_SETTINGS, ROLE_MANAGER } from '../constants';
import { useTheme } from '../utils/useTheme';

export default function Sidebar({ view, setView, openForm, notificationCount }) {
  const { user, logout, isAdmin, userRole, officeId, setOfficeId } = useAuth();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [offices, setOffices] = useState([]);

  useEffect(() => {
    if (!isAdmin) return;
    supabase.from('offices').select('id, name').order('name').then(({ data }) => {
      if (data) setOffices(data);
    });
  }, [isAdmin]);

  const handleOfficeSwitch = async (newOfficeId) => {
    if (newOfficeId === officeId) return;
    await supabase.from('profiles').update({ office_id: newOfficeId }).eq('id', user.id);
    setOfficeId(newOfficeId);
    await supabase.auth.refreshSession();
    setView(VIEW_CLIENTS);
  };

  const navigate = (dest) => { setView(dest); setMobileOpen(false); };

  const handleLogout = async () => {
    await logout();
  };

  const initial = user?.email?.[0]?.toUpperCase() || '?';

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(o => !o)} aria-label="תפריט">☰</button>
      <div className={`mobile-nav-overlay${mobileOpen ? ' mobile-open' : ''}`} onClick={() => setMobileOpen(false)} />
      <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>

        {/* Brand */}
        <div className="sidebar-brand">
          <svg width="32" height="32" viewBox="0 0 34 34" fill="none">
            <circle cx="17" cy="17" r="15.5" stroke="#3a6f9e" strokeWidth="1.2"/>
            <path d="M17 3v28M3 17h28" stroke="#3a6f9e" strokeWidth="1" opacity="0.55"/>
            <path d="M9 25 17 9l8 16" stroke="white" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
            <circle cx="17" cy="9" r="1.6" fill="#b3453a"/>
          </svg>
          <span className="sidebar-brand-name">ניהול לקוחות</span>
        </div>

        {/* Scrollable body */}
        <div className="sidebar-body">

          {/* Primary CTA */}
          <button className="sidebar-new-btn" onClick={() => { openForm(); setMobileOpen(false); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            לקוח חדש
          </button>

          <span className="sidebar-section-label">ניווט</span>

          <nav className="sidebar-nav">
            <button
              className={`nav-item${view === VIEW_CLIENTS ? ' active' : ''}`}
              onClick={() => navigate(VIEW_CLIENTS)}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              כל הלקוחות
            </button>

            <button
              className={`nav-item${view === VIEW_INBOX ? ' active' : ''}`}
              onClick={() => navigate(VIEW_INBOX)}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              התראות
              {notificationCount > 0 && (
                <span className="notification-badge">{notificationCount}</span>
              )}
            </button>

            {(isAdmin || userRole === ROLE_MANAGER) && (
              <button
                className={`nav-item${view === VIEW_SETTINGS ? ' active' : ''}`}
                onClick={() => navigate(VIEW_SETTINGS)}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                הגדרות
              </button>
            )}
          </nav>
        </div>

        {/* User section */}
        <div className="sidebar-user">
          {isAdmin && offices.length > 0 && (
            <select
              className="office-switcher"
              value={officeId || ''}
              onChange={e => handleOfficeSwitch(e.target.value)}
            >
              {!officeId && <option value="">בחר משרד</option>}
              {offices.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          )}

          <div className="sidebar-user-row">
            <div className="user-avatar">{initial}</div>
            <span className="user-email" title={user?.email}>{user?.email}</span>
            <div className="sidebar-user-actions">
              <button
                className="btn-icon-sm"
                onClick={toggle}
                title={theme === 'dark' ? 'מצב יום' : 'מצב לילה'}
              >
                {theme === 'dark'
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                }
              </button>
              <button
                className="btn-icon-sm danger"
                onClick={handleLogout}
                title="התנתקות"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
}
