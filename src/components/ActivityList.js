import Icon from './Icon';
import { describeChangeLines } from '../utils/changeSummary';
import { formatDateTime, nameFromEmail } from '../utils/format';
import { ACTIVITY_META, ACTIVITY_UPDATED } from '../constants';

// Timeline of client_activity rows. `showClient` adds the client's name to
// each row (office-wide log); `onOpenClient(entry)` makes it clickable when
// `canOpenClient(entry)` says the client still exists.
export default function ActivityList({ entries, showClient = false, onOpenClient, canOpenClient }) {
  return (
    <ul className="activity-list">
      {entries.map(entry => {
        const meta = ACTIVITY_META[entry.action] || { label: entry.action, icon: 'activity' };
        const lines = entry.action === ACTIVITY_UPDATED ? describeChangeLines(entry.new_data, entry.old_data) : [];
        const clickable = showClient && onOpenClient && (!canOpenClient || canOpenClient(entry));
        return (
          <li key={entry.id} className={`activity-item activity-${entry.action}`}>
            <div className="activity-icon"><Icon name={meta.icon} size={15} /></div>
            <div className="activity-body">
              <div className="activity-head">
                <span className="activity-actor" title={entry.actor_email || ''}>{nameFromEmail(entry.actor_email)}</span>
                <span className="activity-type">{meta.label}</span>
                {showClient && (clickable
                  ? <button type="button" className="activity-client" onClick={() => onOpenClient(entry)}>{entry.client_name}</button>
                  : <span className="activity-client is-static">{entry.client_name}</span>)}
                <time className="activity-time" dateTime={entry.created_at}>
                  <bdi dir="ltr">{formatDateTime(entry.created_at)}</bdi>
                </time>
              </div>
              {lines.length > 0 && (
                <ul className="activity-changes">
                  {lines.map((line, i) => <li key={i}>{line}</li>)}
                </ul>
              )}
              {entry.note && <p className="activity-note">{entry.note}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// Loading / error / empty / "load more" around an ActivityList.
export function ActivityFeed({ log, emptyText, ...listProps }) {
  const { entries, loading, error, hasMore, loadMore } = log;
  return (
    <>
      {error && <div className="form-error">{error}</div>}
      {entries.length > 0 && <ActivityList entries={entries} {...listProps} />}
      {!loading && !error && entries.length === 0 && (
        <div className="empty-state activity-empty">
          <Icon name="activity" size={40} strokeWidth={1.5} />
          <p>{emptyText}</p>
        </div>
      )}
      {loading && <p className="muted activity-loading">טוען...</p>}
      {!loading && hasMore && (
        <div className="activity-more">
          <button type="button" className="btn btn-ghost btn-sm" onClick={loadMore}>טען עוד</button>
        </div>
      )}
    </>
  );
}
