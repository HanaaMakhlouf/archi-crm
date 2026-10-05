import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Login from './Login';
import SetPassword from './SetPassword';
import App from '../App';
import ErrorBoundary from './ErrorBoundary';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { authMsg } from '../utils/authMessages';

function isInviteHash() {
  return window.location.hash.includes('type=invite');
}

// Invite emails link straight to our own domain:
//   {{ .SiteURL }}/?token_hash=...&type=invite
// (instead of Supabase's domain, which hurts deliverability). The app
// exchanges the token for a session itself, then shows SetPassword.
function getInviteTokenHash() {
  const params = new URLSearchParams(window.location.search);
  return params.get('type') === 'invite' ? params.get('token_hash') : null;
}

export default function Router() {
  const { user, loading } = useAuth();
  const [inviteFlow, setInviteFlow] = useState(() => isInviteHash() || !!getInviteTokenHash());
  const [verifying, setVerifying] = useState(() => !!getInviteTokenHash());

  useEffect(() => {
    const tokenHash = getInviteTokenHash();
    if (!tokenHash) return;
    supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'invite' }).then(({ error }) => {
      // Drop the token from the address bar either way — it's single-use.
      window.history.replaceState(null, '', window.location.pathname);
      if (error) {
        authMsg.error = 'הקישור אינו תקף או שפג תוקפו. בקשו ממנהל המשרד לשלוח הזמנה חדשה.';
        setInviteFlow(false);
      }
      setVerifying(false);
    });
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

  if (inviteFlow && user) {
    return <SetPassword onDone={() => setInviteFlow(false)} />;
  }

  if (!user) return <Login />;

  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
