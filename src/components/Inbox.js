import { NOTIF_TYPE_ROW_REMINDER, ONE_DAY_MS, NOTIFICATION_DELAY_UNIT } from '../constants';
import DatePickerButton from './DatePickerButton';
import { useAuth } from '../contexts/AuthContext';

const ONE_MINUTE_MS = 60 * 1000;
const unitMs = NOTIFICATION_DELAY_UNIT === 'minutes' ? ONE_MINUTE_MS : ONE_DAY_MS;

const SNOOZE_PRESETS = [
  { label: 'יום', days: 1 },
  { label: '3 ימים', days: 3 },
  { label: 'שבוע', days: 7 },
];

export default function Inbox({ notifications, snoozeNotification, onUpdateReminder, onGoToClient }) {
  const { isViewer } = useAuth();
  const handleDateSnooze = async (notif, dateStr) => {
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / unitMs);
    if (days <= 0) return;
    if (notif.type === NOTIF_TYPE_ROW_REMINDER) {
      await onUpdateReminder?.(notif.reminderMeta.reminderId, days);
    } else {
      await snoozeNotification(notif.id, days);
    }
  };

  const handlePresetDelay = (notif, days) => {
    if (notif.type === NOTIF_TYPE_ROW_REMINDER) {
      onUpdateReminder?.(notif.reminderMeta.reminderId, days);
    } else {
      snoozeNotification(notif.id, days);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">תיבה נכנסת</h1>
          <p className="page-subtitle">{notifications.length} התראות</p>
        </div>
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <h3>אין התראות חדשות</h3>
            <p>התראות יופיעו כאן כאשר יגיע הזמן לבדוק לקוחות חדשים</p>
          </div>
        ) : (
          notifications.map((notification) => {
            return (
              <div key={notification.id} className="notification-card">
                <div className="notification-content">
                  <h4>{notification.client?.name}</h4>
                  <p>{notification.message}</p>
                  <small>נוצר ב: {new Date(notification.created_at).toLocaleDateString('he-IL')}</small>
                </div>

                <div className="notification-actions">
                  <fieldset disabled={isViewer} className="snooze-presets" style={{ border: 0, margin: 0, padding: 0 }}>
                    <span className="snooze-label">דחה:</span>
                    {SNOOZE_PRESETS.map(({ label, days }) => (
                      <button
                        key={days}
                        className="btn btn-ghost btn-sm"
                        onClick={() => handlePresetDelay(notification, days)}
                      >
                        {label}
                      </button>
                    ))}
                    <DatePickerButton onSelect={(dateStr) => handleDateSnooze(notification, dateStr)} />
                  </fieldset>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onGoToClient?.(notification.client, notification.reminderMeta?.sectionKey)}
                    >
                      עבור ללקוח
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
