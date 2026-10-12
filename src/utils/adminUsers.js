import { supabase } from '../supabaseClient';

// All privileged operations run server-side in the admin-users Edge Function
// (holds the service-role key) — the client never touches it directly.
export async function callAdminUsers(action, payload = {}) {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action, ...payload },
  });
  if (error) {
    // supabase-js doesn't parse the function's JSON body on non-2xx
    // responses by default — it only gives a generic message. The actual
    // {error: "..."} body is on error.context (the raw Response).
    let detail = error.message;
    try {
      const body = await error.context?.json();
      if (body?.error) detail = body.error;
    } catch { /* response wasn't JSON or already consumed */ }
    throw new Error(detail || 'שגיאת שרת');
  }
  if (data?.error) throw new Error(data.error);
  return data;
}
