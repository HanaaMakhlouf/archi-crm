import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { confirmDialog, alertDialog } from '../components/AppDialog';
import { describeClientChange } from '../utils/changeSummary';
import { TABLE_CLIENTS, FIELD_ARCHIVED_AT } from '../constants';

// The office's clients: loading them, and saving, deleting, closing and
// reopening a client file. Viewers can't change anything; only managers close
// and reopen files.
export function useClients({ isManager }) {
  const { officeId, isViewer } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase.from(TABLE_CLIENTS).select('*').eq('office_id', officeId).order('created_at', { ascending: false });
    if (error) {
      console.error(error.message);
      setFetchError('שגיאה בטעינת הלקוחות. נסה לרענן את הדף.');
    } else {
      setClients(data);
    }
    setLoading(false);
  }, [officeId]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleDelete = async (id) => {
    if (isViewer) return;
    const client = clients.find(c => c.id === id);
    const name = client?.name || 'לקוח זה';
    if (!(await confirmDialog({
      title: 'מחיקת לקוח',
      message: `למחוק את "${name}"? פעולה זו אינה הפיכה.`,
      confirmLabel: 'מחיקה',
      danger: true,
    }))) return;
    const { error } = await supabase.from(TABLE_CLIENTS).delete().eq('id', id);
    if (error) {
      console.error(error.message);
      alertDialog('שגיאה במחיקת הלקוח. נסה שוב.');
    } else {
      fetchClients();
    }
  };

  // Saves `updates`; a change worth showing in the list also records when
  // and what changed (עדכון אחרון). Returns the error, if any.
  const handleUpdateClient = async (id, updates) => {
    if (isViewer) return;
    const previousClient = clients.find(c => c.id === id);
    const summary = describeClientChange(updates, previousClient);
    const payload = summary
      ? { ...updates, last_updated_at: new Date().toISOString(), last_change_summary: summary }
      : updates;
    const { error } = await supabase.from(TABLE_CLIENTS).update(payload).eq('id', id);
    if (error) {
      console.error('Update client error:', error.message);
    } else {
      fetchClients();
    }
    return error;
  };

  // Closed files (archived_at set) live under ארכיון: out of the list, the
  // stats and the reminders until reactivated.
  const openClients = useMemo(() => clients.filter(c => !c[FIELD_ARCHIVED_AT]), [clients]);
  const archivedClients = useMemo(() => clients.filter(c => c[FIELD_ARCHIVED_AT]), [clients]);

  const setArchived = async (client, archivedAt) => {
    if (!isManager) return;
    const error = await handleUpdateClient(client.id, { [FIELD_ARCHIVED_AT]: archivedAt });
    if (error) alertDialog('שגיאה בשמירת מצב התיק. ייתכן שעדכון מסד הנתונים לארכיון עדיין לא הורץ.');
  };
  const handleArchive = async (client) => {
    if (!(await confirmDialog({
      title: 'סגירת תיק',
      message: `לסגור את התיק של "${client.name}"?\nהתיק יעבור לארכיון עם כל הנתונים, ואפשר להפעיל אותו מחדש בכל עת.`,
      confirmLabel: 'סגירת התיק',
    }))) return;
    setArchived(client, new Date().toISOString());
  };
  const handleReactivate = (client) => setArchived(client, null);

  return {
    clients, openClients, archivedClients, loading, fetchError,
    fetchClients, handleUpdateClient, handleDelete, handleArchive, handleReactivate,
  };
}
