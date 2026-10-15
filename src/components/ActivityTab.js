import { useCallback } from 'react';
import { useActivityLog } from '../utils/useActivityLog';
import { ActivityFeed } from './ActivityList';

// Client profile → פעילות tab: this client's full history.
export default function ActivityTab({ client }) {
  const clientId = String(client.id);
  const applyFilters = useCallback(q => q.eq('client_id', clientId), [clientId]);
  const log = useActivityLog(applyFilters);

  return (
    <div className="activity-tab">
      <div className="detail-section">
        <h3 className="detail-section-title">היסטוריית פעילות</h3>
        <ActivityFeed log={log} emptyText="עדיין אין פעילות רשומה ללקוח זה." />
      </div>
    </div>
  );
}
