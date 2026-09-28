// Supabase Auth is email-based under the hood, but Login/SettingsView only
// collect a username. Mirrors USERNAME_EMAIL_DOMAIN in
// supabase/functions/admin-users/index.ts — keep both in sync.
const USERNAME_EMAIL_DOMAIN = 'login.invalid';

// Accounts created before this change (or the original admin account, made
// directly in the Supabase dashboard) have a real email — let them keep
// logging in by typing it in full. A bare username gets the synthetic domain.
export function usernameToLoginEmail(input) {
  const trimmed = input.trim();
  return trimmed.includes('@') ? trimmed : `${trimmed.toLowerCase()}@${USERNAME_EMAIL_DOMAIN}`;
}
