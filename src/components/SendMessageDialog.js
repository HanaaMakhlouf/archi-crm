import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { callAdminUsers } from '../utils/adminUsers';
import { nameFromEmail, formatFileSize } from '../utils/format';
import { fileExtension, isBlockedFile } from '../utils/fileActions';
import Icon from './Icon';
import ImageAnnotator from './ImageAnnotator';
import {
  TABLE_NOTIFICATION_MESSAGES, BUCKET_NOTIFICATION_IMAGES, BUCKET_NOTIFICATION_FILES,
  MESSAGE_FILE_MAX_MB, MESSAGE_MAX_FILES,
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
  // The picture as chosen, plus pen drawings on it (kept so they stay removable).
  const [original, setOriginal] = useState(null);
  const [edited, setEdited] = useState(null);
  const [strokes, setStrokes] = useState([]);
  const [editing, setEditing] = useState(false);
  const [files, setFiles] = useState([]); // other attachments (PDF, Word, drawings...)
  const image = edited || original;
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
    const onKey = (e) => { if (e.key === 'Escape' && !sending && !editing) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, sending, editing]);

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
    setOriginal(file);
    setEdited(null);
    setStrokes([]);
  };

  const removeImage = () => {
    setOriginal(null);
    setEdited(null);
    setStrokes([]);
  };

  const addFiles = (list) => {
    const problems = [];
    const next = [...files];
    for (const file of list) {
      if (isBlockedFile(file.name)) problems.push(`${file.name}: סוג קובץ לא מורשה`);
      else if (file.size > MESSAGE_FILE_MAX_MB * 1024 * 1024) problems.push(`${file.name}: גדול מ-${MESSAGE_FILE_MAX_MB}MB`);
      else if (next.length >= MESSAGE_MAX_FILES) { problems.push(`אפשר לצרף עד ${MESSAGE_MAX_FILES} קבצים`); break; }
      else if (!next.some(f => f.name === file.name && f.size === file.size)) next.push(file);
    }
    setFiles(next);
    setError(problems.length ? problems.join(' · ') : null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files?.length) addFiles([...e.dataTransfer.files]);
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

  const canSend = selected.size > 0 && (text.trim() || image || files.length) && !sending;

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

    const attachments = [];
    for (const file of files) {
      const ext = fileExtension(file.name);
      const path = `${officeId}/${crypto.randomUUID()}${ext ? `.${ext}` : ''}`;
      const type = file.type || 'application/octet-stream';
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NOTIFICATION_FILES)
        .upload(path, file, { contentType: type });
      if (uploadError) {
        console.error('File upload error:', uploadError.message);
        setError(`שגיאה בהעלאת הקובץ ${file.name}. נסה שוב.`);
        setSending(false);
        return;
      }
      attachments.push({ path, name: file.name, type, size: file.size });
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
      attachments,
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
      <form className="modal send-dialog" onSubmit={handleSend} onPaste={handlePaste}
        onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
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
              <div className="send-dialog-preview-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
                  <Icon name="edit" size={14} /> עריכה
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={removeImage}>
                  <Icon name="trash" size={14} /> הסרה
                </button>
              </div>
            </div>
          ) : (
            <input type="file" accept={MESSAGE_IMAGE_TYPES.join(',')} onChange={e => pickImage(e.target.files?.[0])} />
          )}
        </div>

        <div className="form-group">
          <label>קבצים <span className="hint-inline">(PDF, Word, Excel, שרטוטים... עד {MESSAGE_MAX_FILES} קבצים, אפשר גם לגרור לכאן)</span></label>
          {files.length > 0 && (
            <ul className="attachment-list">
              {files.map(f => (
                <li key={`${f.name}_${f.size}`} className="attachment-item">
                  <Icon name="note" size={16} />
                  <span className="attachment-name" title={f.name}>{f.name}</span>
                  <span className="muted">{formatFileSize(f.size)}</span>
                  <button type="button" className="icon-btn danger" title="הסרה"
                    onClick={() => setFiles(prev => prev.filter(x => x !== f))}>
                    <Icon name="trash" size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {files.length < MESSAGE_MAX_FILES && (
            <input type="file" multiple onChange={e => { addFiles([...(e.target.files || [])]); e.target.value = ''; }} />
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

      {editing && (
        <ImageAnnotator
          image={original}
          initialStrokes={strokes}
          onCancel={() => setEditing(false)}
          onSave={(file, newStrokes) => {
            setEdited(newStrokes.length ? file : null);
            setStrokes(newStrokes);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}
