import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { authMsg } from '../utils/authMessages';
import '../styles/Login.css';

export default function SetPassword({ onDone }) {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'light');
    return () => {
      if (prev) document.documentElement.setAttribute('data-theme', prev);
      else document.documentElement.removeAttribute('data-theme');
    };
  }, []);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strong = password.length >= 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!strong) { setError('הסיסמה חייבת להכיל לפחות 6 תווים'); return; }
    if (password !== confirm) { setError('הסיסמאות אינן תואמות'); return; }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError(err.message); setLoading(false); return; }

    window.history.replaceState(null, '', window.location.pathname);
    authMsg.success = 'הסיסמה נשמרה! כעת ניתן להתחבר.';
    onDone(); // clear inviteFlow before signOut so re-login doesn't loop back here
    await supabase.auth.signOut();
    // signOut → onAuthStateChange → resolveSession(null) → user=null → Router shows Login
  };

  const eyeStyle = {
    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 0,
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>מערכת לקוחות</h1>
        <p className="login-subtitle">הגדרת סיסמה לחשבונך</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>דוא״ל</label>
            <input type="email" value={user?.email || ''} disabled />
          </div>

          <div className="form-group">
            <label>סיסמה חדשה</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                required
                style={{ paddingLeft: 40, width: '100%', boxSizing: 'border-box' }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} style={eyeStyle}>
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
            <span style={{ fontSize: 12, color: password.length === 0 ? '#999' : strong ? 'green' : 'red' }}>
              לפחות 6 תווים
            </span>
          </div>

          <div className="form-group">
            <label>אימות סיסמה</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                disabled={loading}
                required
                style={{ paddingLeft: 40, width: '100%', boxSizing: 'border-box' }}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} style={eyeStyle}>
                {showConfirm ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={loading || !password || !confirm}
          >
            {loading ? 'שומר...' : 'הגדר סיסמה והתחבר'}
          </button>
        </form>
      </div>
    </div>
  );
}
