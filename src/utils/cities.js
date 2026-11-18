import { ISRAEL_CITIES } from '../constants/cities';

// Suggestions for the עיר field: Israel's localities (constants/cities.js).

// "אום אל-פחם", "אום אל פחם" and "אום-אל פחם" are the same city.
export const cityKey = (s) => String(s || '').replace(/[-–־'"׳״`.,()\s]+/g, '').toLowerCase();

const SORTED = [...ISRAEL_CITIES].sort((a, b) => a.localeCompare(b, 'he'));
const KEYS = SORTED.map(cityKey);

// The cities matching `query` — names starting with it first, then names
// containing it, each alphabetically. An empty query lists them all.
export function suggestCities(query) {
  const q = cityKey(query);
  if (!q) return SORTED;
  const starts = [];
  const contains = [];
  KEYS.forEach((k, i) => {
    const at = k.indexOf(q);
    if (at === 0) starts.push(SORTED[i]);
    else if (at > 0) contains.push(SORTED[i]);
  });
  return [...starts, ...contains];
}
