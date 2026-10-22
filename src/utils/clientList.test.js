import { filterAndSortClients, DEFAULT_SORT } from './clientList';
import {
  LABEL_INACTIVE, LABEL_PERMANENT, PRIORITY_GREEN, PRIORITY_ORANGE, PRIORITY_RED,
} from '../constants';

// Local-time timestamps.
const at = (day, time = '12:00') => new Date(`${day}T${time}`).toISOString();

const CLIENTS = [
  { id: 1, name: 'בני', city: 'חיפה', label: LABEL_PERMANENT, priority: PRIORITY_RED, created_at: at('2026-10-01') },
  { id: 2, name: 'אבי', city: 'עכו', label: LABEL_PERMANENT, priority: PRIORITY_GREEN, created_at: at('2026-10-05') },
  { id: 3, name: 'גיל', city: '', label: LABEL_PERMANENT, created_at: at('2026-10-03') },
  { id: 4, name: 'דנה', city: ' חיפה ', label: LABEL_INACTIVE, priority: PRIORITY_RED, created_at: at('2026-10-09') },
  { id: 5, name: 'הדר', city: 'אילת', label: LABEL_PERMANENT, priority: PRIORITY_ORANGE, created_at: at('2026-10-10', '23:30') },
];

const ids = (list) => list.map(c => c.id);
const run = (filters = {}, sort = DEFAULT_SORT) => ids(filterAndSortClients([...CLIENTS], filters, sort));

describe('filterAndSortClients', () => {
  it('defaults to newest first, inactive clients last', () => {
    expect(run()).toEqual([5, 2, 3, 1, 4]);
  });

  it('sorts by creation date oldest first', () => {
    expect(run({}, { key: 'created', dir: 'asc' })).toEqual([1, 3, 2, 5, 4]);
  });

  it('sorts names alphabetically both ways', () => {
    expect(run({}, { key: 'name', dir: 'asc' })).toEqual([2, 1, 3, 5, 4]);
    expect(run({}, { key: 'name', dir: 'desc' })).toEqual([5, 3, 1, 2, 4]);
  });

  it('sorts by city both ways, clients without a city last', () => {
    expect(run({}, { key: 'city', dir: 'asc' })).toEqual([5, 1, 2, 3, 4]);
    expect(run({}, { key: 'city', dir: 'desc' })).toEqual([2, 1, 5, 3, 4]);
  });

  it('sorts by priority both ways, clients without a priority last', () => {
    expect(run({}, { key: 'priority', dir: 'desc' })).toEqual([1, 5, 2, 3, 4]);
    expect(run({}, { key: 'priority', dir: 'asc' })).toEqual([2, 5, 1, 3, 4]);
  });

  it('combines filters with search', () => {
    expect(run({ search: 'חיפה', label: LABEL_PERMANENT })).toEqual([1]);
  });
});
