import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Login from './Login';
import SetPassword from './SetPassword';
import App from '../App';
import ErrorBoundary from './ErrorBoundary';

function isInviteHash() {
  return window.location.hash.includes('type=invite');
}

export default function Router() {
  const { user, loading } = useAuth();
  const [inviteFlow, setInviteFlow] = useState(isInviteHash);

  if (loading) {
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
