import PriorityDot from '../PriorityDot';
import Icon, { getInitials } from '../Icon';
import { alertDialog } from '../AppDialog';
import { getCurrentLicensingPhaseLabel } from '../licensing/licensingData';
import { getCurrentPlanningStageLabel } from '../PlanningTab';
import { formatDate } from '../../utils/format';
import { openClientFolder } from '../../utils/openClientFolder';
import { TYPE_PLANNING, TYPE_LICENSING, FILE_LINK_2_PATH } from '../../constants';

// One client in the clients table (a card on phones — see Mobile.css; the
// data-label attributes are the card's field titles).
export default function ClientRow({ client, canEditPriority, isViewer, onOpen, onEdit, onDelete, onUpdate }) {
  const types = client.client_type || [];
  const helkaText = client.helka && client.helka.length ? client.helka.join(', ') : '';
  return (
    <tr onClick={onOpen} className="clients-table-row">
      <td className="cell-name">
        <div className="client-cell">
          <div className="client-avatar">{getInitials(client.name)}</div>
          <div>
            <div className="client-name">{client.name}</div>
            {types.includes(TYPE_LICENSING) && (
              <div className="client-sub client-sub--phase">
                <span className="client-sub-key">רישוי · </span>{getCurrentLicensingPhaseLabel(client)}
              </div>
            )}
            {client.last_change_summary && (
              <div className="client-sub-faint">{client.last_change_summary}</div>
            )}
            {types.includes(TYPE_PLANNING) && (
              <div className="client-sub">
                <span className="client-sub-key">תכנון · </span>{getCurrentPlanningStageLabel(client)}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="cell-priority">
        <PriorityDot
          value={client.priority}
          editable={canEditPriority}
          onChange={(v) => onUpdate({ priority: v })}
        />
      </td>
      <td className="col-type">
        {types.length > 0
          ? <div className="type-tags-cell">{types.map(t => <span key={t} className="type-tag">{t}</span>)}</div>
          : <span className="muted">—</span>}
      </td>
      <td className="cell-phase col-phase" data-label="שלב ברישוי">
        {types.includes(TYPE_LICENSING)
          ? <span className="phase-tag">{getCurrentLicensingPhaseLabel(client)}</span>
          : <span className="muted">—</span>}
      </td>
      <td className="cell-secondary cell-city" data-label="עיר">{client.city || '—'}</td>
      <td className="cell-plot" data-label="גוש / חלקה">
        {client.gush || helkaText ? `${client.gush || '—'} / ${helkaText || '—'}` : '—'}
      </td>
      <td className="cell-request col-request" data-label="מס' בקשה">{client.licensing_data?.application?.request_number || '—'}</td>
      <td className="cell-updated col-updated" data-label="עדכון אחרון">
        {client.last_updated_at
          ? <bdi dir="ltr">{formatDate(client.last_updated_at)}</bdi>
          : <span className="muted">—</span>}
      </td>
      <td className="cell-secondary cell-created col-created">
        <bdi dir="ltr">{formatDate(client.created_at)}</bdi>
      </td>
      <td className="cell-actions" onClick={e => e.stopPropagation()}>
        <div className="row-actions">
          {client[FILE_LINK_2_PATH] && (
            <button
              className="icon-btn folder-btn--set"
              onClick={async () => {
                if (!window.electronAPI?.isElectron) return;
                const err = await openClientFolder(client[FILE_LINK_2_PATH], onUpdate);
                if (err) alertDialog(err);
              }}
              title={`פתח תיקייה: ${client[FILE_LINK_2_PATH]}`}
            >
              <Icon name="folder" size={16} />
            </button>
          )}
          {!isViewer && (
            <>
              <button className="icon-btn" onClick={onEdit} title="עריכה">
                <Icon name="edit" size={16} />
              </button>
              <button className="icon-btn danger" onClick={onDelete} title="מחיקה">
                <Icon name="trash" size={16} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
