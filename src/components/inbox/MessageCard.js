import { useState } from 'react';
import Icon from '../Icon';
import { formatDateTime, formatFileSize, nameFromEmail } from '../../utils/format';
import { attachmentUrl, downloadFile, downloadImage, openFile, printImage } from '../../utils/fileActions';

// One message a manager forwarded (or a worker's status update on it): the
// text, a picture that can be enlarged / saved / printed, attached files, and
// סמן כנקרא / עבור ללקוח. `client` is null when it's no longer in the list.
export default function MessageCard({ message: m, client, imageUrl, onEnlarge, onMarkRead, onOpenClient }) {
  const [busy, setBusy] = useState(false);   // a file is being downloaded / printed
  const [error, setError] = useState(null);

  // A worker changed the status of a row the manager sent them.
  const isUpdate = m.kind === 'status_update';

  // Save or print the picture.
  const handleImageFile = async (action) => {
    setBusy(true);
    setError(null);
    try {
      if (action === 'download') {
        const day = new Date(m.created_at).toLocaleDateString('he-IL');
        await downloadImage(imageUrl, `${m.client_name || 'תמונה'} ${day}`);
      } else {
        await printImage(imageUrl, [
          m.client_name,
          m.notification_text,
          m.message,
          `נשלח ע״י ${nameFromEmail(m.sender_email)} · ${formatDateTime(m.created_at)}`,
        ].filter(Boolean));
      }
    } catch (err) {
      console.error('Message image error:', err.message);
      setError(action === 'download' ? 'שגיאה בהורדת התמונה.' : 'שגיאה בהדפסת התמונה.');
    }
    setBusy(false);
  };

  // Save an attached file, or open it in its program (where it can be printed).
  const handleAttachment = async (attachment, action) => {
    setBusy(true);
    setError(null);
    try {
      const url = await attachmentUrl(attachment.path);
      if (action === 'download') await downloadFile(url, attachment.name);
      else await openFile(url, attachment.name);
    } catch (err) {
      console.error('Attachment error:', err.message);
      setError(action === 'download' ? `שגיאה בהורדת ${attachment.name}.` : `לא ניתן לפתוח את ${attachment.name}.`);
    }
    setBusy(false);
  };

  const openClient = () => {
    if (!m.read_at) onMarkRead?.(m.id);
    onOpenClient(client, m.section_key);
  };

  return (
    <div className={`notification-card message-card${isUpdate ? ' status-update-card' : ''}${m.read_at ? ' is-read' : ''}`}>
      <div className="notification-content">
        <div className="message-meta">
          {!m.read_at && <span className="message-new">חדש</span>}
          {isUpdate && <span className="message-kind">עדכון סטטוס</span>}
          <strong title={m.sender_email || ''}>{nameFromEmail(m.sender_email)}</strong>
          <bdi dir="ltr">{formatDateTime(m.created_at)}</bdi>
        </div>
        {m.client_name && <h4>{m.client_name}</h4>}
        {m.notification_text && <p className="message-quote">{m.notification_text}</p>}
        {m.message && <p className="message-text">{m.message}</p>}
        {imageUrl && (
          <>
            <button type="button" className="message-image" onClick={() => onEnlarge(imageUrl)} title="הגדלה">
              <img src={imageUrl} alt="תמונה מצורפת" />
            </button>
            <div className="message-image-actions">
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => handleImageFile('download')}>
                <Icon name="download" size={14} /> הורדה
              </button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => handleImageFile('print')}>
                <Icon name="printer" size={14} /> הדפסה
              </button>
            </div>
          </>
        )}
        {m.attachments?.length > 0 && (
          <ul className="attachment-list">
            {m.attachments.map(a => (
              <li key={a.path} className="attachment-item">
                <Icon name="note" size={16} />
                <span className="attachment-name" title={a.name}>{a.name}</span>
                <span className="muted">{formatFileSize(a.size)}</span>
                <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => handleAttachment(a, 'download')}>
                  <Icon name="download" size={14} /> הורדה
                </button>
                <button type="button" className="btn btn-ghost btn-sm" disabled={busy}
                  onClick={() => handleAttachment(a, 'open')} title="פתיחה בתוכנה המתאימה, משם אפשר להדפיס">
                  <Icon name="printer" size={14} /> פתיחה / הדפסה
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && <div className="form-error">{error}</div>}
      </div>
      <div className="notification-actions">
        {!m.read_at && (
          <button className="btn btn-ghost btn-sm" onClick={() => onMarkRead?.(m.id)}>סמן כנקרא</button>
        )}
        {client && (
          <button className="btn btn-primary btn-sm" onClick={openClient}>
            עבור ללקוח
          </button>
        )}
      </div>
    </div>
  );
}
