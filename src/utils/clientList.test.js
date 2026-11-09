import { filterAndSortClients, matchesSearch, DEFAULT_SORT } from './clientList';
import { PRIORITY_GREEN, PRIORITY_YELLOW, PRIORITY_ORANGE, PRIORITY_RED, PRIORITY_ON_HOLD } from '../constants';

// Local-time timestamps.
const at = (day, time = '12:00') => new Date(`${day}T${time}`).toISOString();

const CLIENTS = [
  { id: 1, name: 'בני', city: 'חיפה', priority: PRIORITY_RED, created_at: at('2026-10-01') },
  { id: 2, name: 'אבי', city: 'עכו', priority: PRIORITY_GREEN, created_at: at('2026-10-05') },
  { id: 3, name: 'גיל', city: '', created_at: at('2026-10-03') },
  { id: 4, name: 'דנה', city: ' חיפה ', priority: PRIORITY_RED, created_at: at('2026-10-09') },
  { id: 5, name: 'הדר', city: 'אילת', priority: PRIORITY_ORANGE, created_at: at('2026-10-10', '23:30') },
];

const ids = (list) => list.map(c => c.id);
const run = (filters = {}, sort = DEFAULT_SORT) => ids(filterAndSortClients([...CLIENTS], filters, sort));

describe('filterAndSortClients', () => {
  it('defaults to newest first', () => {
    expect(run()).toEqual([5, 4, 2, 3, 1]);
  });

  it('sorts by creation date oldest first', () => {
    expect(run({}, { key: 'created', dir: 'asc' })).toEqual([1, 3, 2, 4, 5]);
  });

  it('sorts names alphabetically both ways', () => {
    expect(run({}, { key: 'name', dir: 'asc' })).toEqual([2, 1, 3, 4, 5]);
    expect(run({}, { key: 'name', dir: 'desc' })).toEqual([5, 4, 3, 1, 2]);
  });

  it('sorts by city both ways, clients without a city last', () => {
    expect(run({}, { key: 'city', dir: 'asc' })).toEqual([5, 1, 4, 2, 3]);
    expect(run({}, { key: 'city', dir: 'desc' })).toEqual([2, 1, 4, 5, 3]);
  });

  it('sorts by priority both ways, clients without a priority last', () => {
    expect(run({}, { key: 'priority', dir: 'desc' })).toEqual([1, 4, 5, 2, 3]);
    expect(run({}, { key: 'priority', dir: 'asc' })).toEqual([2, 5, 1, 4, 3]);
  });

  it('sorts מושהה last both ways, and the old גבוהה as בינונית', () => {
    const list = [
      { id: 1, name: 'א', priority: PRIORITY_ON_HOLD, created_at: at('2026-10-01') },
      { id: 2, name: 'ב', priority: PRIORITY_RED, created_at: at('2026-10-02') },
      { id: 3, name: 'ג', priority: PRIORITY_ORANGE, created_at: at('2026-10-03') },
      { id: 4, name: 'ד', priority: PRIORITY_YELLOW, created_at: at('2026-10-04') },
      { id: 5, name: 'ה', priority: PRIORITY_GREEN, created_at: at('2026-10-05') },
    ];
    const sorted = (dir) => ids(filterAndSortClients([...list], {}, { key: 'priority', dir }));
    expect(sorted('desc')).toEqual([2, 3, 4, 5, 1]);
    expect(sorted('asc')).toEqual([5, 3, 4, 2, 1]);
  });

  it('finds clients by search', () => {
    expect(run({ search: 'חיפה' })).toEqual([4, 1]);
  });
});

describe('sort by last update', () => {
  it('uses the last edit, or the creation date for clients never edited', () => {
    const list = [
      { id: 1, name: 'א', created_at: at('2026-10-01'), last_updated_at: at('2026-10-20') },
      { id: 2, name: 'ב', created_at: at('2026-10-10') },
      { id: 3, name: 'ג', created_at: at('2026-10-02'), last_updated_at: at('2026-10-05') },
    ];
    const sorted = (dir) => ids(filterAndSortClients([...list], {}, { key: 'updated', dir }));
    expect(sorted('desc')).toEqual([1, 2, 3]);
    expect(sorted('asc')).toEqual([3, 2, 1]);
  });
});

describe('matchesSearch', () => {
  const client = {
    name: 'אבו חכים', city: 'כפר קרע', gush: 12034, helka: [5, 17], migrash: '6א',
    licensing_data: { application: { request_number: '20250312' } },
  };

  it('ignores case, extra spaces and quote marks', () => {
    expect(matchesSearch(client, '  אבו   חכים ')).toBe(true);
    expect(matchesSearch({ name: 'ת״א בע"מ' }, 'תא')).toBe(true);
    expect(matchesSearch({ name: 'Abo Saleh' }, 'abo s')).toBe(true);
  });

  it('needs every word, from any field', () => {
    expect(matchesSearch(client, 'חכים כפר קרע')).toBe(true);
    expect(matchesSearch(client, 'חכים עכו')).toBe(false);
  });

  it('finds gush, חלקה and request number', () => {
    expect(matchesSearch(client, '12034')).toBe(true);
    expect(matchesSearch(client, '17')).toBe(true);
    expect(matchesSearch(client, '20250312')).toBe(true);
  });

  it('matches everything when empty, and survives missing fields', () => {
    expect(matchesSearch(client, '   ')).toBe(true);
    expect(matchesSearch({ name: null }, 'x')).toBe(false);
  });
});
