import SortHeader from './SortHeader';
import ClientRow from './ClientRow';
import { useFitColumns } from '../../utils/useFitColumns';

// The clients table. `clients` is already searched and sorted; `searchText`
// is only for the "no matches" line. Row actions get the client.
export default function ClientsTable({
  clients, searchText, sort, onSortChange,
  canEditPriority, isViewer, onOpen, onEdit, onDelete, onUpdate,
}) {
  // Narrow window: the table drops columns until it fits (see App.css).
  const tableBoxRef = useFitColumns(6, [clients]);

  const sortHeader = (column, label, firstDir) => (
    <SortHeader column={column} label={label} sort={sort} onChange={onSortChange} firstDir={firstDir} />
  );

  return (
    <div className="clients-table-scroll" ref={tableBoxRef}>
      <table className="clients-table">
        <thead>
          <tr>
            <th>{sortHeader('name', 'לקוח')}</th>
            <th>{sortHeader('priority', 'עדיפות', 'desc')}</th>
            <th className="col-type">סוג תיק</th>
            <th className="col-phase">שלב ברישוי</th>
            <th>{sortHeader('city', 'עיר')}</th>
            <th>גוש / חלקה</th>
            <th className="col-request">מס' בקשה</th>
            <th className="col-updated">{sortHeader('updated', 'עדכון אחרון', 'desc')}</th>
            <th className="col-created">{sortHeader('created', 'תאריך יצירה', 'desc')}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {/* No matches: keep the table (and its column widths) in place. */}
          {clients.length === 0 && (
            <tr className="clients-table-empty">
              <td colSpan={10}>לא נמצאו לקוחות התואמים ל״{searchText.trim()}״</td>
            </tr>
          )}
          {clients.map(client => (
            <ClientRow
              key={client.id}
              client={client}
              canEditPriority={canEditPriority}
              isViewer={isViewer}
              onOpen={() => onOpen(client)}
              onEdit={() => onEdit(client)}
              onDelete={() => onDelete(client)}
              onUpdate={(updates) => onUpdate(client, updates)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
