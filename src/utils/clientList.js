import { LABEL_INACTIVE } from '../constants';
import { startOfDay } from './format';

// Clients list: newest first unless a column says otherwise.
export const DEFAULT_SORT = { key: 'created', dir: 'desc' };

const cityOf = (c) => (c.city || '').trim();

// Filters and sorts the clients table.
// filters: { search, label, type, city, createdFrom, createdTo } ('' = off;
//          dates are 'YYYY-MM-DD' and inclusive)
// sort:    { key: 'name' | 'city' | 'created', dir: 'asc' | 'desc' }
// Inactive clients always go last; clients without a city go last when
// sorting by city, in either direction.
export function filterAndSortClients(clients, filters, sort = DEFAULT_SORT) {
  const { search = '', label, type, city, createdFrom, createdTo } = filters;
  const q = search.toLowerCase();
  const from = createdFrom ? startOfDay(createdFrom) : null;
  const toExclusive = createdTo ? startOfDay(createdTo, 1) : null;

  const result = clients.filter(c => {
    const created = new Date(c.created_at);
    return (c.name.toLowerCase().includes(q) || (c.city && c.city.toLowerCase().includes(q)))
      && (!label || c.label === label)
      && (!type || (c.client_type && c.client_type.includes(type)))
      && (!city || cityOf(c) === city)
      && (!from || created >= from)
      && (!toExclusive || created < toExclusive);
  });

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
    return dir * (new Date(a.created_at) - new Date(b.created_at));
  });
}

// Distinct cities for the city filter, alphabetically.
export const cityOptionsOf = (clients) =>
  [...new Set(clients.map(cityOf).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'he'));
