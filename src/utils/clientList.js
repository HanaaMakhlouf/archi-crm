import { LABEL_INACTIVE, PRIORITY_OPTIONS } from '../constants';

// Clients list: newest first unless a column says otherwise.
export const DEFAULT_SORT = { key: 'created', dir: 'desc' };

const cityOf = (c) => (c.city || '').trim();
// 0 = נמוכה … 3 = דחופה; -1 = no priority set.
const priorityRank = (c) => PRIORITY_OPTIONS.findIndex(o => o.value === c.priority);

// Lowercase, without direction marks (pasted from folder names), quotes and
// geresh/gershayim (ת"א / ת״א), and with runs of spaces collapsed.
const normalize = (s) => String(s ?? '')
  .toLowerCase()
  .replace(/[‎‏‪-‮"'`׳״]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

// Everything the search box looks in, joined once per client.
const searchText = (c) => normalize([
  c.name, c.city, c.gush, ...(c.helka || []), c.migrash,
  c.licensing_data?.application?.request_number,
].filter(v => v != null && v !== '').join(' '));

// Every word typed must appear somewhere (name, city, gush, חלקה, מגרש, request number),
// so "אבו חכים כפר קרע" finds the client in כפר קרע.
export function matchesSearch(client, search) {
  const words = normalize(search).split(' ').filter(Boolean);
  if (!words.length) return true;
  const text = searchText(client);
  return words.every(w => text.includes(w));
}

// Filters and sorts the clients table.
// filters: { search, label, type } ('' = off)
// sort:    { key: 'name' | 'city' | 'priority' | 'created', dir: 'asc' | 'desc' }
// Inactive clients always go last; clients without a city (or priority) go
// last when sorting by it, in either direction.
export function filterAndSortClients(clients, filters, sort = DEFAULT_SORT) {
  const { search = '', label, type } = filters;

  const result = clients.filter(c =>
    matchesSearch(c, search)
    && (!label || c.label === label)
    && (!type || (c.client_type && c.client_type.includes(type))));

  const dir = sort.dir === 'asc' ? 1 : -1;
  return result.sort((a, b) => {
    const aInactive = a.label === LABEL_INACTIVE;
    const bInactive = b.label === LABEL_INACTIVE;
    if (aInactive !== bInactive) return aInactive ? 1 : -1;

    if (sort.key === 'name') return dir * a.name.localeCompare(b.name, 'he');
    if (sort.key === 'city') {
      const aCity = cityOf(a);
      const bCity = cityOf(b);
      if (!aCity !== !bCity) return aCity ? -1 : 1;
      return dir * aCity.localeCompare(bCity, 'he');
    }
    if (sort.key === 'priority') {
      const aRank = priorityRank(a);
      const bRank = priorityRank(b);
      if ((aRank < 0) !== (bRank < 0)) return aRank < 0 ? 1 : -1;
      return dir * (aRank - bRank);
    }
    return dir * (new Date(a.created_at) - new Date(b.created_at));
  });
}
