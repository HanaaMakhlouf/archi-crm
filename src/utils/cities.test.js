import { cityKey, suggestCities } from './cities';
import { ISRAEL_CITIES } from '../constants/cities';

test('spelling differences (hyphen, spaces) count as the same city', () => {
  expect(cityKey('אום אל-פחם')).toBe(cityKey('אום אל פחם'));
  expect(suggestCities('אום אל פחם')).toContain('אום אל-פחם');
});

test('an empty field lists every city in Israel, alphabetically', () => {
  const all = suggestCities('');
  expect(all).toHaveLength(ISRAEL_CITIES.length);
  expect(all).toContain('חיפה');
  expect([...all].sort((a, b) => a.localeCompare(b, 'he'))).toEqual(all);
});

test('names starting with the text come before ones that only contain it', () => {
  const r = suggestCities('אום');
  expect(r[0].startsWith('אום')).toBe(true);
  expect(r).toContain('שבלי - אום אל-גנם');
  expect(r.indexOf('שבלי - אום אל-גנם')).toBeGreaterThan(r.indexOf('אום אל-פחם'));
  expect(suggestCities('חיפ')[0]).toBe('חיפה');
});
