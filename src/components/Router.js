import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Login from './Login';
import SetPassword from './SetPassword';
import App from '../App';
import ErrorBoundary from './ErrorBoundary';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { authMsg } from '../utils/authMessages';

const LINK_TYPES = ['invite', 'recovery'];

function getHashLinkType() {
  return LINK_TYPES.find(t => window.location.hash.includes(`type=${t}`)) || null;
}

// Invite and reset-password emails link straight to our own domain:
//   {{ .SiteURL }}/?token_hash=...&type=invite   (or type=recovery)
// (instead of Supabase's domain, which hurts deliverability). The app
// exchanges the token for a session itself, then shows SetPassword.
function getEmailLink() {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type');
  const tokenHash = params.get('token_hash');
  return LINK_TYPES.includes(type) && tokenHash ? { type, tokenHash } : null;
}

export default function Router() {
  const { user, loading } = useAuth();
  // 'invite' | 'recovery' | null — which SetPassword screen to show once signed in.
  const [passwordFlow, setPasswordFlow] = useState(() => getHashLinkType() || getEmailLink()?.type || null);
  const [verifying, setVerifying] = useState(() => !!getEmailLink());

  useEffect(() => {
    const link = getEmailLink();
    if (!link) return;
    supabase.auth.verifyOtp({ token_hash: link.tokenHash, type: link.type }).then(({ error }) => {
      // Drop the token from the address bar either way — it's single-use.
      window.history.replaceState(null, '', window.location.pathname);
      if (error) {
        authMsg.error = link.type === 'invite'
          ? 'הקישור אינו תקף או שפג תוקפו. בקשו ממנהל המשרד לשלוח הזמנה חדשה.'
          : 'הקישור אינו תקף או שפג תוקפו. ניתן לבקש קוד חדש דרך "שכחתי סיסמה".';
        setPasswordFlow(null);
      }
      setVerifying(false);
    });
  }, []);

  // Supabase's own reset link (#access_token=...&type=recovery) signs in and fires this.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordFlow('recovery');
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <div className="auth-loading">
        <h1>נדרשת הגדרת Supabase</h1>
        <p>העתק את ‎.env.example‎ אל ‎.env‎ והזן את כתובת הפרויקט ומפתח anon/publishable.</p>
        <p>לאחר מכן הפעל מחדש את שרת הפיתוח.</p>
      </div>
    );
  }

  if (loading || verifying) {
    return (
      <div className="auth-loading">
        <div className="spinner"></div>
        <p>טוען...</p>
      </div>
    );
  }

  if (passwordFlow && user) {
    return <SetPassword mode={passwordFlow} onDone={() => setPasswordFlow(null)} />;
  }

  if (!user) return <Login onRecoveryStart={(on) => setPasswordFlow(on ? 'recovery' : null)} />;

  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
