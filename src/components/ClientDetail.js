import { useState, useEffect } from 'react';
import PlanningTab from './PlanningTab';
import LicensingTab from './LicensingTab';
import DetailedTab from './DetailedTab';
import QuickFileLinks from './QuickFileLinks';
import FolderChip from './FolderChip';
import ActivityTab from './ActivityTab';
import { useAuth } from '../contexts/AuthContext';
import Icon from './Icon';
import {
  LABEL_NEW, LABEL_INACTIVE,
  TYPE_PLANNING, TYPE_LICENSING, TYPE_DETAILED, CLIENT_TYPES,
  TAB_GENERAL, TAB_ACTIVITY, ROLE_MANAGER, FIELD_ARCHIVED_AT,
} from '../constants';
import { formatDate } from '../utils/format';

export default function ClientDetail({
  client,
  onBack,
  onEdit,
  getLabelClass,
  onUpdateClient,
  reminders = [],
  onReminderChange,
  onClearReminders,
  initialTab,
  onArchive,
  onReactivate,
}) {
  const tabStorageKey = `client_tab_${client.id}`;
  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab) return initialTab;
    let saved = null;
    try { saved = sessionStorage.getItem(tabStorageKey); } catch { /* storage unavailable */ }
    // Only restore a work-type tab the client still has.
    const alwaysThere = saved === TAB_GENERAL || saved === TAB_ACTIVITY;
    return saved && (alwaysThere || (client.client_type || []).includes(saved)) ? saved : TAB_GENERAL;
  });

  useEffect(() => {
    try { sessionStorage.setItem(tabStorageKey, activeTab); } catch { /* storage unavailable */ }
  }, [tabStorageKey, activeTab]);
  const { userRole, isAdmin, isViewer } = useAuth();
  const isManager = isAdmin || userRole === ROLE_MANAGER;
  const archivedAt = client[FIELD_ARCHIVED_AT];
  const readOnly = isViewer || !!archivedAt; // a closed file is kept as-is until reactivated

  return (
    <>
      <section className="detail-hero">
        <div className="detail-hero-main">
          <div className="detail-hero-text">
            <div className="page-eyebrow">
              <button type="button" className="detail-crumb" onClick={onBack}>לקוחות</button> / פרופיל לקוח
            </div>
            <h1 className="detail-hero-name">
              {client.name}
              {(client.label === LABEL_NEW || client.label === LABEL_INACTIVE) && (
                <span className={`label-badge ${getLabelClass(client.label)}`}>{client.label}</span>
              )}
            </h1>
            <div className="detail-meta">
              {client.city && <span className="detail-meta-item"><Icon name="mapPin" size={15} />{client.city}</span>}
              {client.phone && <span className="detail-meta-item" dir="ltr"><Icon name="phone" size={15} />{client.phone}</span>}
              {(client.client_type || []).map(t => <span key={t} className="type-tag">{t}</span>)}
            </div>
          </div>
        </div>

        <div className="detail-hero-bar">
          <div className="detail-hero-group">
            <button className="btn btn-sm btn-ghost" onClick={onBack}>
              <Icon name="arrowRight" size={15} />
              חזרה
            </button>
            <FolderChip
              client={client}
              onUpdateClient={(updates) => onUpdateClient(client.id, updates)}
              canEdit={!readOnly}
            />
          </div>
          <div className="detail-hero-group">
            {!readOnly && (
              <button className="btn btn-sm btn-primary" onClick={onEdit}>
                <Icon name="edit" size={15} />
                עריכת פרטים
              </button>
            )}
            {!readOnly && isManager && (
              <button className="btn btn-sm btn-ghost detail-close-btn" onClick={onArchive} title="הוצאת התיק מרשימת הלקוחות לארכיון">
                <Icon name="archive" size={15} />
                סגירת תיק
              </button>
            )}
          </div>
        </div>
      </section>

      {archivedAt && (
        <div className="archived-banner">
          <Icon name="archive" size={20} />
          <div className="archived-banner-text">
            <strong>התיק סגור ונמצא בארכיון</strong>
            <span>
              נסגר בתאריך <bdi dir="ltr">{formatDate(archivedAt)}</bdi>. כל הנתונים נשמרו;
              {isManager ? ' לעריכה יש להפעיל את התיק מחדש.' : ' רק מנהל יכול להפעיל את התיק מחדש.'}
            </span>
          </div>
          {isManager && (
            <button className="btn btn-primary btn-sm" onClick={onReactivate}>
              <Icon name="restore" size={14} />
              הפעלה מחדש
            </button>
          )}
        </div>
      )}

      {/* ── TABS ── */}
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === TAB_GENERAL ? 'active' : ''}`}
          onClick={() => setActiveTab(TAB_GENERAL)}
        >
          כללי
        </button>
        {CLIENT_TYPES.map(type => {
          const isActive = activeTab === type;
          const enabled = client.client_type && client.client_type.includes(type);
          return (
            <button
              key={type}
              className={`tab-button ${isActive ? 'active' : ''} ${enabled ? '' : 'disabled'}`}
              onClick={() => setActiveTab(type)}
              disabled={!enabled}
            >
              {type}
            </button>
          );
        })}
        <button
          className={`tab-button ${activeTab === TAB_ACTIVITY ? 'active' : ''}`}
          onClick={() => setActiveTab(TAB_ACTIVITY)}
        >
          פעילות
        </button>
      </div>

      {/* Outside the viewer fieldset — viewers can still page through history. */}
      {activeTab === TAB_ACTIVITY && <ActivityTab client={client} />}

      {/* ── TAB CONTENT ── */}
      {/* fieldset disabled: native way to block every input/select/button below for viewers,
          without threading a readOnly prop through every tab/phase component.
          display:contents keeps it out of the detail-grid layout. */}
      <fieldset disabled={readOnly} style={{ display: 'contents', border: 0, margin: 0, padding: 0 }}>
      {activeTab === TAB_GENERAL && (
        <div className="detail-grid">

        <div className="detail-section">
          <h3 className="detail-section-title">פרטים כלליים</h3>
          <div className="detail-row"><span className="detail-label">שם לקוח</span><span>{client.name}</span></div>
          <div className="detail-row"><span className="detail-label">טלפון</span><span>{client.phone}</span></div>
          <div className="detail-row"><span className="detail-label">אימייל</span><span>{client.email || <span className="muted">לא הוגדר</span>}</span></div>
          <div className="detail-row"><span className="detail-label">סטטוס</span><span>{client.label}</span></div>
        </div>

        <div className="detail-section">
          <h3 className="detail-section-title">פרטי נכס</h3>
          <div className="detail-row"><span className="detail-label">עיר</span><span>{client.city}</span></div>
          <div className="detail-row"><span className="detail-label">גוש</span><span>{client.gush}</span></div>
          <div className="detail-row">
            <span className="detail-label">חלקה</span>
            <span>{(client.helka || []).length ? client.helka.join(', ') : <span className="muted">לא הוגדר</span>}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">מגרש</span>
            <span>{client.migrash ?? <span className="muted">לא הוגדר</span>}</span>
          </div>
        </div>

        <div className="detail-section">
          <h3 className="detail-section-title">סוג עבודה</h3>
          <div className="type-tags" style={{ marginBottom: 0 }}>
            {client.client_type && client.client_type.length > 0
              ? client.client_type.map(t => (
                  <span key={t} className="type-tag type-tag-lg">{t}</span>
                ))
              : <span className="muted">לא הוגדר</span>}
          </div>
        </div>

        <div className="detail-section">
          <h3 className="detail-section-title">הערות</h3>
          <div className="detail-row">
            <span>{client.notes || <span className="muted">אין הערות</span>}</span>
          </div>
        </div>

        <QuickFileLinks
          client={client}
          onUpdateClient={(updates) => onUpdateClient(client.id, updates)}
        />

        </div>
      )}

      {activeTab === TYPE_PLANNING && (
        <PlanningTab
          client={client}
          onUpdate={(updates) => onUpdateClient(client.id, updates)}
          reminders={reminders}
          onReminderChange={(sk, rl, days) => onReminderChange(client.id, sk, rl, days)}
          onClearReminders={(sk) => onClearReminders(client.id, sk)}
        />
      )}
      {activeTab === TYPE_LICENSING && (
        <LicensingTab
          client={client}
          onUpdate={(updates) => onUpdateClient(client.id, updates)}
          reminders={reminders}
          onReminderChange={(sk, rl, days) => onReminderChange(client.id, sk, rl, days)}
          onClearReminders={(sk) => onClearReminders(client.id, sk)}
        />
      )}
      {activeTab === TYPE_DETAILED && (
        <DetailedTab
          client={client}
          onUpdate={(updates) => onUpdateClient(client.id, updates)}
          reminders={reminders}
          onReminderChange={(sk, rl, days) => onReminderChange(client.id, sk, rl, days)}
          onClearReminders={(sk) => onClearReminders(client.id, sk)}
        />
      )}
      </fieldset>

    </>
  );
}
