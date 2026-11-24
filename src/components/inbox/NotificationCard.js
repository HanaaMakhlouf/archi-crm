import Icon from '../Icon';
import SnoozeMenu from './SnoozeMenu';
import { formatDate } from '../../utils/format';
import { NOTIF_TYPE_ROW_REMINDER } from '../../constants';

// One automatic notification (managers): בוצע (row reminders only), דחייה,
// שליחה לעובד and עבור ללקוח. Viewers can't mark done or delay.
export default function NotificationCard({ notification, isViewer, onDone, onDelay, onSend, onGoToClient }) {
  return (
    <div className="notification-card">
      <div className="notification-content">
        <h4>{notification.client?.name}</h4>
        <p>{notification.message}</p>
        <small>נוצר ב: {formatDate(notification.created_at)}</small>
      </div>

      <div className="notification-actions">
        {/* Task done: delete the reminder (the row's status isn't changed). */}
        {notification.type === NOTIF_TYPE_ROW_REMINDER && !isViewer && (
          <button
            type="button"
            className="btn btn-ghost btn-sm notification-done-btn"
            onClick={onDone}
            title="המשימה בוצעה — מחיקת ההתראה"
          >
            <Icon name="check" size={14} />
            בוצע
          </button>
        )}
        <SnoozeMenu disabled={isViewer} onDelay={onDelay} />
        <button type="button" className="btn btn-ghost btn-sm" onClick={onSend}>
          <Icon name="mail" size={14} />
          שליחה לעובד
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={onGoToClient}>
          עבור ללקוח
        </button>
      </div>
    </div>
  );
}
