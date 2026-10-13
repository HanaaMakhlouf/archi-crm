import { useState, useEffect } from 'react';
import { NOTIF_TYPE_ROW_REMINDER, ONE_DAY_MS, NOTIFICATION_DELAY_UNIT } from '../constants';
import DatePickerButton from './DatePickerButton';
import SendMessageDialog from './SendMessageDialog';
import Icon from './Icon';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTime, nameFromEmail } from '../utils/format';

const ONE_MINUTE_MS = 60 * 1000;
const unitMs = NOTIFICATION_DELAY_UNIT === 'minutes' ? ONE_MINUTE_MS : ONE_DAY_MS;

const SNOOZE_PRESETS = [
  { label: 'יום', days: 1 },
  { label: '3 ימים', days: 3 },
  { label: 'שבוע', days: 7 },
];

// Automatic notifications are for managers only (`notifications` is empty for
// everyone else); each can be forwarded to employees with a message and a
// picture. Everyone sees the messages that were forwarded to them.
export default function Inbox({
  notifications, snoozeNotification, onUpdateReminder, onGoToClient,
  isManager, messages = [], imageUrls = {}, onMarkRead, clients = [],
}) {
  const { isViewer } = useAuth();
  const [sendFor, setSendFor] = useState(null);   // notification being forwarded
  const [sentNote, setSentNote] = useState(null); // "sent to N" confirmation
  const [lightbox, setLightbox] = useState(null); // enlarged picture URL

  useEffect(() => {
    if (!sentNote) return;
    const t = setTimeout(() => setSentNote(null), 4000);
    return () => clearTimeout(t);
  }, [sentNote]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

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

  const openMessageClient = (message, client) => {
    if (!message.read_at) onMarkRead?.(message.id);
    onGoToClient?.(client, message.section_key);
  };

  const unread = messages.filter(m => !m.read_at).length;
  const pending = notifications.length + unread;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><strong>ראשי</strong> / התראות</div>
          <h1 className="page-title">התראות ועדכונים</h1>
          <p className="page-subtitle">
            {pending > 0 ? `${pending} התראות ממתינות לטיפול` : 'הכול מטופל — אין התראות פתוחות'}
          </p>
        </div>
      </div>

      {sentNote && <div className="login-success inbox-sent-note">{sentNote}</div>}

      {/* ── MESSAGES FROM MANAGERS ── */}
      {messages.length > 0 && (
        <section className="inbox-section">
          {isManager && <h2 className="inbox-section-title">הודעות שקיבלתי</h2>}
          <div className="notification-list">
            {messages.map(m => {
              const client = clients.find(c => String(c.id) === m.client_id);
              const imageUrl = m.image_path && imageUrls[m.image_path];
              return (
                <div key={m.id} className={`notification-card message-card${m.read_at ? ' is-read' : ''}`}>
                  <div className="notification-content">
                    <div className="message-meta">
                      {!m.read_at && <span className="message-new">חדש</span>}
                      <strong title={m.sender_email || ''}>{nameFromEmail(m.sender_email)}</strong>
                      <bdi dir="ltr">{formatDateTime(m.created_at)}</bdi>
                    </div>
                    {m.client_name && <h4>{m.client_name}</h4>}
                    {m.notification_text && <p className="message-quote">{m.notification_text}</p>}
                    {m.message && <p className="message-text">{m.message}</p>}
                    {imageUrl && (
                      <button type="button" className="message-image" onClick={() => setLightbox(imageUrl)} title="הגדלה">
                        <img src={imageUrl} alt="תמונה מצורפת" />
                      </button>
                    )}
                  </div>
                  <div className="notification-actions">
                    {!m.read_at && (
                      <button className="btn btn-ghost btn-sm" onClick={() => onMarkRead?.(m.id)}>סמן כנקרא</button>
                    )}
                    {client && (
                      <button className="btn btn-primary btn-sm" onClick={() => openMessageClient(m, client)}>
                        עבור ללקוח
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── AUTOMATIC NOTIFICATIONS (managers) ── */}
      {isManager && (
        <section className="inbox-section">
          {messages.length > 0 && <h2 className="inbox-section-title">התראות מערכת</h2>}
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <Icon name="bell" size={48} strokeWidth={1.5} />
                <h3>אין התראות חדשות</h3>
                <p>התראות יופיעו כאן כאשר יגיע הזמן לבדוק לקוחות חדשים</p>
              </div>
            ) : (
              notifications.map((notification) => (
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
                      <button className="btn btn-ghost btn-sm" onClick={() => setSendFor(notification)}>
                        <Icon name="mail" size={14} />
                        שליחה לעובד
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => onGoToClient?.(notification.client, notification.reminderMeta?.sectionKey)}
                      >
                        עבור ללקוח
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {!isManager && messages.length === 0 && (
        <div className="empty-state">
          <Icon name="bell" size={48} strokeWidth={1.5} />
          <h3>אין הודעות</h3>
          <p>הודעות מהמנהל יופיעו כאן</p>
        </div>
      )}

      {sendFor && (
        <SendMessageDialog
          notification={sendFor}
          onClose={() => setSendFor(null)}
          onSent={(count) => {
            setSendFor(null);
            setSentNote(count === 1 ? 'ההודעה נשלחה' : `ההודעה נשלחה ל-${count} עובדים`);
          }}
        />
      )}

      {lightbox && (
        <div className="modal-overlay message-lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="תמונה מצורפת" />
        </div>
      )}
    </>
  );
}
