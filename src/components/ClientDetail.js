import { useState } from 'react';
import PlanningTab from './PlanningTab';
import LicensingTab from './LicensingTab';
import DetailedTab from './DetailedTab';
import QuickFileLinks from './QuickFileLinks';
import { useAuth } from '../contexts/AuthContext';
import Icon, { getInitials } from './Icon';
import {
  LABEL_NEW, LABEL_INACTIVE,
  TYPE_PLANNING, TYPE_LICENSING, TYPE_DETAILED, CLIENT_TYPES,
  TAB_GENERAL, ROLE_MANAGER,
} from '../constants';

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
}) {
  const [activeTab, setActiveTab] = useState(initialTab || TAB_GENERAL);
  const { userRole, isAdmin, isViewer } = useAuth();
  const canSeeFiles = isAdmin || userRole === ROLE_MANAGER;

  return (
    <>
      <div className="page-header">
        <div className="detail-identity">
          <div className="client-avatar client-avatar-lg">{getInitials(client.name)}</div>
          <div style={{ minWidth: 0 }}>
            <div className="page-eyebrow"><strong>לקוחות</strong> / פרופיל לקוח</div>
            <h1 className="page-title">
              {client.name}
              {(client.label === LABEL_NEW || client.label === LABEL_INACTIVE) && (
                <span className={`label-badge ${getLabelClass(client.label)}`}>{client.label}</span>
              )}
            </h1>
            <div className="detail-meta">
              {client.city && <span className="detail-meta-item"><Icon name="mapPin" size={14} />{client.city}</span>}
              {client.phone && <span className="detail-meta-item" dir="ltr"><Icon name="phone" size={14} />{client.phone}</span>}
              {(client.client_type || []).map(t => <span key={t} className="type-tag">{t}</span>)}
            </div>
          </div>
        </div>

        <div className="page-actions">
          <button className="btn btn-ghost" onClick={onBack}>
            <Icon name="arrowRight" size={16} />
            חזרה
          </button>
          {!isViewer && (
            <button className="btn btn-primary" onClick={onEdit}>
              <Icon name="edit" size={16} />
              עריכת פרטים
            </button>
          )}
        </div>
      </div>

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
      </div>

      {/* ── TAB CONTENT ── */}
      {/* fieldset disabled: native way to block every input/select/button below for viewers,
          without threading a readOnly prop through every tab/phase component.
          display:contents keeps it out of the detail-grid layout. */}
      <fieldset disabled={isViewer} style={{ display: 'contents', border: 0, margin: 0, padding: 0 }}>
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

        {canSeeFiles && (
          <QuickFileLinks
            client={client}
            onUpdateClient={(updates) => onUpdateClient(client.id, updates)}
          />
        )}

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
