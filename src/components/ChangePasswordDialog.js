import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const MIN_LENGTH = 6;

export default function ChangePasswordDialog({ onClose }) {
  const { user } = useAuth();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < MIN_LENGTH) { setError(`הסיסמה חייבת להכיל לפחות ${MIN_LENGTH} תווים`); return; }
    if (password !== confirm) { setError('הסיסמאות אינן תואמות'); return; }
    if (password === current) { setError('הסיסמה החדשה זהה לנוכחית'); return; }

    setSaving(true);
    // Re-checking the current password keeps someone at an unlocked computer
    // from changing it, and gives Supabase the recent sign-in it asks for.
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
    if (authErr) { setSaving(false); setError('הסיסמה הנוכחית שגויה'); return; }

    const { error: err } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setDone(true);
  };

  const type = show ? 'text' : 'password';

  return (
    <div className="discard-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div className="discard-dialog password-dialog">
        <h3 className="password-dialog-title">שינוי סיסמה</h3>

        {done ? (
          <>
            <p className="password-dialog-done">הסיסמה עודכנה. בכניסה הבאה יש להשתמש בסיסמה החדשה.</p>
            <div className="discard-actions">
              <button className="btn btn-primary" onClick={onClose}>סגירה</button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="pw-current">סיסמה נוכחית</label>
              <input id="pw-current" type={type} value={current} onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password" disabled={saving} autoFocus required />
            </div>
            <div className="form-group">
              <label htmlFor="pw-new">סיסמה חדשה <span className="muted">(לפחות {MIN_LENGTH} תווים)</span></label>
              <input id="pw-new" type={type} value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password" disabled={saving} required />
            </div>
            <div className="form-group">
              <label htmlFor="pw-confirm">אימות סיסמה חדשה</label>
              <input id="pw-confirm" type={type} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password" disabled={saving} required />
            </div>
            <label className="password-dialog-show">
              <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
              הצגת הסיסמאות
            </label>

            {error && <div className="password-dialog-error">{error}</div>}

            <div className="discard-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>ביטול</button>
              <button type="submit" className="btn btn-primary" disabled={saving || !current || !password || !confirm}>
                {saving ? 'שומר...' : 'שמירה'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
