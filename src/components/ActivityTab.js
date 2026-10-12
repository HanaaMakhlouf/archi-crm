import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useActivityLog } from '../utils/useActivityLog';
import { ActivityFeed } from './ActivityList';
import { TABLE_CLIENT_ACTIVITY, MANUAL_ACTIVITY_OPTIONS, ACTIVITY_CALL } from '../constants';

// Client profile → פעילות tab: this client's full history, plus a form to
// log work that doesn't change any field (calls, meetings, site visits...).
export default function ActivityTab({ client }) {
  const { officeId, isViewer } = useAuth();
  const clientId = String(client.id);
  const applyFilters = useCallback(q => q.eq('client_id', clientId), [clientId]);
  const log = useActivityLog(applyFilters);

  const [type, setType] = useState(ACTIVITY_CALL);
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
      action: type,
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
            <select value={type} onChange={e => setType(e.target.value)} aria-label="סוג פעילות">
              {MANUAL_ACTIVITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
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
