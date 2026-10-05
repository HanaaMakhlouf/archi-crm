import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { authMsg } from '../utils/authMessages';
import Icon from './Icon';
import { BRAND_NAME, BRAND_TAGLINE } from '../constants';
import heroImg from '../assets/login-hero.jpg';
import '../styles/Login.css';

// Survives component remount (which happens when signOut clears the user)
let pendingError = '';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
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
    <div className="login-page">

      {/* ── Form side ── */}
      <section className="login-panel">
        <div className="login-brand">
          <div className="brand-logo"><Icon name="building" size={20} /></div>
          <div className="login-brand-text">
            <span className="login-brand-name">{BRAND_NAME}</span>
            <span className="login-brand-tagline">{BRAND_TAGLINE}</span>
          </div>
        </div>

        <div className="login-form-wrap">
          <div className="login-heading">
            <h1>ברוכים הבאים</h1>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            {success && <div className="login-success">{success}</div>}

            <div className="form-group">
              <label htmlFor="email">כתובת אימייל</label>
              <input
                id="email"
                type="email"
                placeholder="name@office.co.il"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">סיסמה</label>
              <div className="login-password">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="הקלידו סיסמה"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setShowPw(v => !v)}
                  title={showPw ? 'הסתר סיסמה' : 'הצג סיסמה'}
                >
                  <Icon name={showPw ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="office">שם המשרד <span className="login-hint">(בכניסה ראשונה בלבד)</span></label>
              <input
                id="office"
                type="text"
                placeholder="הקלידו את שם המשרד"
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
              {loading ? 'מתחבר...' : 'כניסה למערכת'}
            </button>
          </form>

          <p className="login-note">אין לכם חשבון? <strong>פנו למנהל המשרד</strong></p>
        </div>

        <div className="login-footer">© {new Date().getFullYear()} {BRAND_NAME}</div>
      </section>

      {/* ── Photo side ── */}
      <aside className="login-visual" style={{ backgroundImage: `url(${heroImg})` }} aria-hidden="true">
        <div className="login-visual-caption">
          <span className="login-visual-date">
            {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <blockquote>
            ״אדריכלות היא המשחק המיומן, המדויק והמרהיב של צורות המתחברות באור.״
          </blockquote>
          <cite>לה קורבוזיה</cite>
        </div>
      </aside>
    </div>
  );
}
