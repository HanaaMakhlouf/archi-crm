import { useState } from 'react';
import { supabase } from '../supabaseClient';

// Password recovery from the login screen. The reset email carries a
// one-time code ({{ .Token }} in the Supabase "Reset Password" template),
// so it works in the desktop app too, where an email link can't open the app.
// A verified code signs the user in; Router then shows SetPassword.
export default function ForgotPassword({ initialEmail = '', onBack, onVerifying }) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendCode = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (err) { setError(err.message); return; }
    setCodeSent(true);
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    onVerifying(true);
    const { error: err } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' });
    if (err) {
      onVerifying(false);
      setLoading(false);
      setError('הקוד שגוי או שפג תוקפו. נסו שוב או שלחו קוד חדש.');
    }
    // On success the session change swaps this screen for SetPassword.
  };

  return (
    <>
      <div className="login-heading">
        <h1>שחזור סיסמה</h1>
      </div>

      {!codeSent ? (
        <form onSubmit={sendCode} className="login-form">
          <p className="login-lead">הזינו את כתובת האימייל שלכם ונשלח אליה קוד לאיפוס הסיסמה.</p>
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

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-primary btn-large" disabled={loading || !email.trim()}>
            {loading ? 'שולח...' : 'שליחת קוד'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="login-form">
          <div className="login-success">שלחנו קוד אל <bdi>{email.trim()}</bdi>. הקוד תקף לכ־15 דקות.</div>
          <div className="form-group">
            <label htmlFor="code">קוד מהאימייל</label>
            <input
              id="code"
              className="login-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              autoFocus
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-primary btn-large" disabled={loading || code.length < 6}>
            {loading ? 'בודק...' : 'המשך לבחירת סיסמה'}
          </button>
          <button type="button" className="login-link" onClick={sendCode} disabled={loading}>
            לא קיבלתם? שליחת קוד חדש
          </button>
        </form>
      )}

      <button type="button" className="login-link login-back" onClick={onBack} disabled={loading}>
        חזרה לכניסה
      </button>
    </>
  );
}
