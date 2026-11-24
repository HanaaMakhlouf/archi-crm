import { useState, useEffect } from 'react';
import SendMessageDialog from './SendMessageDialog';
import Icon from './Icon';
import MessageCard from './inbox/MessageCard';
import NotificationCard from './inbox/NotificationCard';
import { useAuth } from '../contexts/AuthContext';
import { NOTIF_TYPE_ROW_REMINDER } from '../constants';

// The התראות page. Automatic notifications are for managers only
// (`notifications` is empty for everyone else); each can be forwarded to
// employees with a message and a picture. Everyone sees the messages that
// were forwarded to them.
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

  // A row reminder moves its own due date; other notifications are snoozed.
  const delay = (notif, days) => {
    if (notif.type === NOTIF_TYPE_ROW_REMINDER) return onUpdateReminder?.(notif.reminderMeta.reminderId, days);
    return snoozeNotification(notif.id, days);
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
            {messages.map(m => (
              <MessageCard
                key={m.id}
                message={m}
                client={clients.find(c => String(c.id) === m.client_id) || null}
                imageUrl={m.image_path && imageUrls[m.image_path]}
                onEnlarge={setLightbox}
                onMarkRead={onMarkRead}
                onOpenClient={onGoToClient}
              />
            ))}
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
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  isViewer={isViewer}
                  onDone={() => onUpdateReminder?.(notification.reminderMeta.reminderId, null)}
                  onDelay={(days) => delay(notification, days)}
                  onSend={() => setSendFor(notification)}
                  onGoToClient={() => onGoToClient?.(notification.client, notification.reminderMeta?.sectionKey)}
                />
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
