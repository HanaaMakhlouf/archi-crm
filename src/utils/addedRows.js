import { createContext, useContext, useMemo } from 'react';
import { isBuiltInRow } from '../constants';

// Every client, so a table's "+ הוסף שורה" can offer the rows workers have
// added to the same section before (App.js provides it).
export const ClientsContext = createContext([]);

const ROWS_OF = {
  actions: (ld) => ld.application?.actions,
  conditions: (ld) => ld.conditions?.rows,
  confirmation: (ld) => ld.confirmation?.rows,
  form4: (ld) => ld.form4?.rows,
};

// The rows added by hand to this licensing section across all clients:
// [{ label, options }] — most used first. options: the row's own dropdown, if it had one.
export function addedRowHistory(clients, kind) {
  const seen = new Map();
  clients.forEach(c => {
    (ROWS_OF[kind](c.licensing_data || {}) || []).forEach(r => {
      if (!r?.label || isBuiltInRow(kind, r.label)) return;
      const prev = seen.get(r.label);
      if (prev) { prev.count += 1; if (!prev.options && r.options) prev.options = r.options; return; }
      seen.set(r.label, { label: r.label, options: r.options || null, count: 1 });
    });
  });
  return [...seen.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'he'))
    .map(({ label, options }) => ({ label, options }));
}

export function useAddedRowHistory(kind) {
  const clients = useContext(ClientsContext);
  return useMemo(() => addedRowHistory(clients, kind), [clients, kind]);
}
