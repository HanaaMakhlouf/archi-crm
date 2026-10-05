import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import {
  VIEW_CLIENTS, VIEW_INBOX, VIEW_SETTINGS, ROLE_MANAGER, ROLE_LABELS, BRAND_NAME, BRAND_TAGLINE,
} from '../constants';
import { useTheme } from '../utils/useTheme';
import Icon from './Icon';

export default function Sidebar({ view, setView, openForm, notificationCount }) {
  const { user, logout, isAdmin, isViewer, userRole, officeId, setOfficeId } = useAuth();
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
          <div className="brand-logo"><Icon name="building" size={20} /></div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">{BRAND_NAME}</span>
            <span className="sidebar-brand-tagline">{BRAND_TAGLINE}</span>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="sidebar-body">
          <span className="sidebar-section-label">תפריט ראשי</span>

          <nav className="sidebar-nav">
            <button
              className={`nav-item${view === VIEW_CLIENTS ? ' active' : ''}`}
              onClick={() => navigate(VIEW_CLIENTS)}
            >
              <Icon name="users" />
              לקוחות
            </button>

            <button
              className={`nav-item${view === VIEW_INBOX ? ' active' : ''}`}
              onClick={() => navigate(VIEW_INBOX)}
            >
              <Icon name="bell" />
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
                <Icon name="settings" />
                הגדרות
              </button>
            )}
          </nav>

          {!isViewer && (
            <div className="sidebar-cta">
              <div className="sidebar-cta-title">לקוח חדש?</div>
              <div className="sidebar-cta-text">פתחו תיק לקוח והתחילו לעקוב אחרי התהליך.</div>
              <button className="sidebar-new-btn" onClick={() => { openForm(); setMobileOpen(false); }}>
                <Icon name="plus" size={15} strokeWidth={2.4} />
                הוספת לקוח
              </button>
            </div>
          )}
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
            <div className="user-meta">
              <span className="user-email" title={user?.email}>{user?.email}</span>
              <span className="user-role">{ROLE_LABELS[userRole] || ''}</span>
            </div>
            <div className="sidebar-user-actions">
              <button
                className="btn-icon-sm"
                onClick={toggle}
                title={theme === 'dark' ? 'מצב יום' : 'מצב לילה'}
              >
                <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={15} />
              </button>
              <button
                className="btn-icon-sm danger"
                onClick={handleLogout}
                title="התנתקות"
              >
                <Icon name="logout" size={15} />
              </button>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
}
