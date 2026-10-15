import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useActivityLog } from '../utils/useActivityLog';
import { ActivityFeed } from './ActivityList';
import { TABLE_CLIENT_ACTIVITY, ACTIVITY_NOTE } from '../constants';

// Client profile → פעילות tab: this client's full history, plus a form to
// add a free-text note about work that doesn't change any field.
export default function ActivityTab({ client }) {
  const { officeId, isViewer } = useAuth();
  const clientId = String(client.id);
  const applyFilters = useCallback(q => q.eq('client_id', clientId), [clientId]);
  const log = useActivityLog(applyFilters);

  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    setSaveError(null);
    const { error } = await supabase.from(TABLE_CLIENT_ACTIVITY).insert({
      client_id: clientId,
      client_name: client.name,
      office_id: String(client.office_id ?? officeId),
      action: ACTIVITY_NOTE,
      note: note.trim(),
    });
    if (error) {
      console.error('Add activity error:', error.message);
      setSaveError('שגיאה בשמירת הפעילות. נסה שוב.');
    } else {
      setNote('');
      log.reload();
    }
    setSaving(false);
  };

  return (
    <div className="activity-tab">
      {!isViewer && (
        <form className="detail-section activity-add" onSubmit={handleAdd}>
          <h3 className="detail-section-title">הוספת פעילות</h3>
          <div className="activity-add-row">
            <textarea
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="מה נעשה? למשל: שיחה עם הלקוח לגבי מועד ההגשה"
            />
            <button type="submit" className="btn btn-primary" disabled={saving || !note.trim()}>
              {saving ? 'שומר...' : 'הוספה'}
            </button>
          </div>
          {saveError && <div className="form-error">{saveError}</div>}
        </form>
      )}

      <div className="detail-section">
        <h3 className="detail-section-title">היסטוריית פעילות</h3>
        <ActivityFeed log={log} emptyText="עדיין אין פעילות רשומה ללקוח זה." />
      </div>
    </div>
  );
}
