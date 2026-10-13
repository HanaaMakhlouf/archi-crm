import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { callAdminUsers } from '../utils/adminUsers';
import { nameFromEmail } from '../utils/format';
import Icon from './Icon';
import {
  TABLE_NOTIFICATION_MESSAGES, BUCKET_NOTIFICATION_IMAGES,
  MESSAGE_IMAGE_MAX_MB, MESSAGE_IMAGE_TYPES, ROLE_LABELS,
} from '../constants';

// Manager forwards one notification to employees, with a message and an
// optional picture (chosen from disk or pasted with Ctrl+V).
export default function SendMessageDialog({ notification, onClose, onSent }) {
  const { user, officeId, isAdmin } = useAuth();
  const [users, setUsers] = useState(null); // null while loading
  const [usersError, setUsersError] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Admins get every office's users from admin-users — keep this office's.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [{ users: list }, { data: office }] = await Promise.all([
          callAdminUsers('list'),
          isAdmin
            ? supabase.from('offices').select('name').eq('id', officeId).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);
        if (!active) return;
        setUsers((list || []).filter(u =>
          !u.pending && u.id !== user.id && (!office || u.officeName === office.name)));
      } catch (err) {
        if (active) setUsersError(err.message);
      }
    })();
    return () => { active = false; };
  }, [user.id, officeId, isAdmin]);

  useEffect(() => {
    if (!image) { setPreview(null); return; }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !sending) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, sending]);

  const pickImage = (file) => {
    if (!file) return;
    if (!MESSAGE_IMAGE_TYPES.includes(file.type)) {
      setError('ניתן לצרף רק תמונה (PNG, JPG, GIF, WEBP).');
      return;
    }
    if (file.size > MESSAGE_IMAGE_MAX_MB * 1024 * 1024) {
      setError(`התמונה גדולה מדי (עד ${MESSAGE_IMAGE_MAX_MB}MB).`);
      return;
    }
    setError(null);
    setImage(file);
  };

  const handlePaste = (e) => {
    const file = [...(e.clipboardData?.files || [])].find(f => f.type.startsWith('image/'));
    if (file) { e.preventDefault(); pickImage(file); }
  };

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const allSelected = !!users?.length && selected.size === users.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(users.map(u => u.id)));

  const canSend = selected.size > 0 && (text.trim() || image) && !sending;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!canSend) return;
    setSending(true);
    setError(null);

    let imagePath = null;
    if (image) {
      const ext = (image.name.split('.').pop() || image.type.split('/')[1] || 'png').toLowerCase();
      imagePath = `${officeId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NOTIFICATION_IMAGES)
        .upload(imagePath, image, { contentType: image.type });
      if (uploadError) {
        console.error('Image upload error:', uploadError.message);
        setError('שגיאה בהעלאת התמונה. נסה שוב.');
        setSending(false);
        return;
      }
    }

    const rows = [...selected].map(recipientId => ({
      office_id: String(officeId),
      recipient_id: recipientId,
      client_id: notification.client_id != null ? String(notification.client_id) : null,
      client_name: notification.client?.name || null,
      section_key: notification.reminderMeta?.sectionKey || null,
      notification_text: notification.message,
      message: text.trim() || null,
      image_path: imagePath,
    }));
    const { error: insertError } = await supabase.from(TABLE_NOTIFICATION_MESSAGES).insert(rows);
    setSending(false);
    if (insertError) {
      console.error('Send message error:', insertError.message);
      setError('שגיאה בשליחת ההודעה. נסה שוב.');
      return;
    }
    onSent?.(rows.length);
  };

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !sending) onClose(); }}>
      <form className="modal send-dialog" onSubmit={handleSend} onPaste={handlePaste}>
        <h3>שליחת התראה לעובדים</h3>

        <div className="send-dialog-notif">
          <strong>{notification.client?.name}</strong>
          <span>{notification.message}</span>
        </div>

        <div className="form-group">
          <label>למי לשלוח</label>
          {usersError && <div className="form-error">{usersError}</div>}
          {!usersError && !users && <span className="muted">טוען עובדים...</span>}
          {users?.length === 0 && <span className="muted">אין עובדים נוספים במשרד.</span>}
          {users?.length > 0 && (
            <div className="send-dialog-users">
              <label className="send-dialog-user send-dialog-all">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                כל העובדים
              </label>
              {users.map(u => (
                <label key={u.id} className="send-dialog-user" title={u.email}>
                  <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)} />
                  {nameFromEmail(u.email)}
                  <span className="muted">{ROLE_LABELS[u.role] || ''}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="send-message-text">הודעה</label>
          <textarea
            id="send-message-text"
            rows={3}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="מה צריך לעשות? למשל: נא לעדכן את הסטטוס עד מחר"
          />
        </div>

        <div className="form-group">
          <label>תמונה <span className="hint-inline">(אפשר גם להדביק צילום מסך עם Ctrl+V)</span></label>
          {preview ? (
            <div className="send-dialog-preview">
              <img src={preview} alt="תצוגה מקדימה" />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setImage(null)}>
                <Icon name="trash" size={14} /> הסרה
              </button>
            </div>
          ) : (
            <input type="file" accept={MESSAGE_IMAGE_TYPES.join(',')} onChange={e => pickImage(e.target.files?.[0])} />
          )}
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={sending}>ביטול</button>
          <button type="submit" className="btn btn-primary" disabled={!canSend}>
            {sending ? 'שולח...' : `שליחה${selected.size ? ` (${selected.size})` : ''}`}
          </button>
        </div>
      </form>
    </div>
  );
}
