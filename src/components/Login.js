import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { authMsg } from '../utils/authMessages';
import '../styles/Login.css';

// Survives component remount (which happens when signOut clears the user)
let pendingError = '';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [officeName, setOfficeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => { const e = pendingError; pendingError = ''; return e; });
  const [success] = useState(() => { const s = authMsg.success; authMsg.success = ''; return s; });

  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'light');
    return () => {
      if (prev) document.documentElement.setAttribute('data-theme', prev);
      else document.documentElement.removeAttribute('data-theme');
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) { setError(authError.message); return; }

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('office_id')
        .eq('id', authData.user.id)
        .single();

      // Office is assigned once, on first login only — otherwise a user
      // could move themselves between offices just by typing a new name.
      if (!existingProfile?.office_id) {
        const { data: officeData, error: officeError } = await supabase
          .from('offices')
          .select('id')
          .ilike('name', officeName.trim())
          .single();

        if (officeError || !officeData) {
          pendingError = 'לא קיים משרד בשם זה במערכת';
          await supabase.auth.signOut();
          return;
        }

        await supabase
          .from('profiles')
          .update({ office_id: officeData.id })
          .eq('id', authData.user.id);
      }

      await supabase.auth.refreshSession();
      // onAuthStateChange fires → Router swaps to App automatically

    } catch (err) {
      setError('שגיאה בהתחברות. נסה שוב.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>מערכת לקוחות</h1>
        <p className="login-subtitle">התחברות לחשבון</p>

        <form onSubmit={handleLogin} className="login-form">
          {success && (
            <div style={{ background: '#e6f9ec', color: '#1a7a3a', padding: '12px', borderRadius: 6, fontSize: 14, border: '1px solid #a8ddb5' }}>
              {success}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">דוא״ל</label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">סיסמה</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="office">שם המשרד (רק בכניסה ראשונה)</label>
            <input
              id="office"
              type="text"
              placeholder="הכנס שם משרד"
              value={officeName}
              onChange={(e) => setOfficeName(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={loading || !email || !password || !officeName.trim()}
          >
            {loading ? 'טוען...' : 'התחברות'}
          </button>
        </form>

        <p className="login-note">
          צור קשר עם מנהל המערכת כדי ליצור חשבון חדש
        </p>
      </div>
    </div>
  );
}
