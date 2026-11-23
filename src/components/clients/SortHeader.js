import { DEFAULT_SORT } from '../../utils/clientList';

// Clickable column title. The first click sorts by `firstDir` (A→ת for text,
// newest first for dates); each further click reverses it. One column at a time.
export default function SortHeader({ column, label, sort, onChange, firstDir = 'asc' }) {
  const active = sort !== DEFAULT_SORT && sort.key === column; // the untouched default shows no arrow
  const toggle = () => onChange({
    key: column,
    dir: active ? (sort.dir === 'asc' ? 'desc' : 'asc') : firstDir,
  });
  return (
    <button type="button" className={`th-sort-btn${active ? ' active' : ''}`} onClick={toggle}>
      {label}
      <span className="th-sort-arrow">{active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
    </button>
  );
}
