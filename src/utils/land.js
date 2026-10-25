import { NUMERIC_LAND_FIELDS } from '../constants';

// חלקה list as form strings — at least one (empty) field to type into.
export const helkaToStrings = (helka) =>
  (Array.isArray(helka) && helka.length ? helka.map(String) : ['']);

// The client's land fields, shaped for editing.
export const landFromClient = (client) => ({
  city: client.city || '',
  gush: client.gush ?? '',
  helka: helkaToStrings(client.helka),
  migrash: client.migrash ?? '',
});

// Edited land fields → the columns saved on the client row. Lenient: invalid
// חלקה entries are dropped (the client form validates strictly instead).
export const landToPayload = (land) => {
  const payload = { ...land };
  NUMERIC_LAND_FIELDS.forEach(k => {
    payload[k] = payload[k] === '' ? payload[k] : Number(payload[k]);
  });
  payload.migrash = String(payload.migrash ?? '').trim() || null;
  const helkaNums = (payload.helka || [])
    .map(h => String(h ?? '').trim())
    .filter(Boolean)
    .map(Number)
    .filter(n => Number.isInteger(n) && n > 0);
  payload.helka = helkaNums.length ? helkaNums : null;
  return payload;
};
