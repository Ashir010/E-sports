import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';

const DataContext = createContext(null);

const EMPTY = { profiles: [], tournaments: [], teams: [], members: [], registrations: [], matches: [], results: [], activity: [] };

export function DataProvider({ children }) {
  const [db, setDb] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Could not reach the database. Check your internet connection and Supabase settings.')), 15000));
      const snapshot = await Promise.race([api.loadSnapshot(), timeout]);
      setDb(snapshot);
    } catch (e) {
      setError(e.message || 'Could not load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Run a write through the API, then reload the snapshot. Errors propagate to the caller. */
  const run = useCallback(
    async (fn) => {
      const result = await fn(api);
      await refresh();
      return result;
    },
    [refresh]
  );

  const value = useMemo(() => ({ db, loading, error, refresh, run }), [db, loading, error, refresh, run]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
