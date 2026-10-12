import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { TABLE_CLIENT_ACTIVITY, ACTIVITY_PAGE_SIZE } from '../constants';

// Loads client_activity newest-first, one page at a time.
// `applyFilters(query) => query` narrows the query; it must be memoized —
// the log reloads from the top whenever it changes.
export function useActivityLog(applyFilters) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const requestRef = useRef(0);

  const load = useCallback(async (offset) => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setError(null);
    const { data, error: err } = await applyFilters(supabase.from(TABLE_CLIENT_ACTIVITY).select('*'))
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + ACTIVITY_PAGE_SIZE - 1);
    if (requestId !== requestRef.current) return; // filters changed meanwhile
    if (err) {
      console.error('Activity log error:', err.message);
      setError('שגיאה בטעינת יומן הפעילות.');
    } else {
      // Rows added since the first page shift the offsets — skip repeats.
      setEntries(prev => {
        if (!offset) return data;
        const seen = new Set(prev.map(e => e.id));
        return [...prev, ...data.filter(e => !seen.has(e.id))];
      });
      setHasMore(data.length === ACTIVITY_PAGE_SIZE);
    }
    setLoading(false);
  }, [applyFilters]);

  useEffect(() => { load(0); }, [load]);

  return {
    entries, loading, error, hasMore,
    loadMore: () => load(entries.length),
    reload: () => load(0),
  };
}
