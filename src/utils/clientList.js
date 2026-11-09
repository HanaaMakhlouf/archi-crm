import { PRIORITY_GREEN, PRIORITY_YELLOW, PRIORITY_RED, priorityOf } from '../constants';

// Clients list: newest first unless a column says otherwise.
export const DEFAULT_SORT = { key: 'created', dir: 'desc' };

const cityOf = (c) => (c.city || '').trim();
// 0 = נמוכה, 1 = בינונית, 2 = דחופה; -1 = מושהה or no priority (always last).
const PRIORITY_LEVELS = [PRIORITY_GREEN, PRIORITY_YELLOW, PRIORITY_RED];
const priorityRank = (c) => PRIORITY_LEVELS.indexOf(priorityOf(c.priority));
// עדכון אחרון: a client never edited since it was added counts from its creation.
const lastTouched = (c) => new Date(c.last_updated_at || c.created_at);

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
// filters: { search, type } ('' = off)
// sort:    { key: 'name' | 'city' | 'priority' | 'updated' | 'created', dir: 'asc' | 'desc' }
// Clients without a city (or priority, or מושהה) go last when sorting by it, in either direction.
export function filterAndSortClients(clients, filters, sort = DEFAULT_SORT) {
  const { search = '', type } = filters;

  const result = clients.filter(c =>
    matchesSearch(c, search)
    && (!type || (c.client_type && c.client_type.includes(type))));

  const dir = sort.dir === 'asc' ? 1 : -1;
  return result.sort((a, b) => {
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
    if (sort.key === 'updated') return dir * (lastTouched(a) - lastTouched(b));
    return dir * (new Date(a.created_at) - new Date(b.created_at));
  });
}
