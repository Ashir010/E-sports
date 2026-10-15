import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, isDemoMode } from '../services/api.js';
import { useData } from './DataContext.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { db, loading: dataLoading, refresh } = useData();
  const [userId, setUserId] = useState(null);
  const [checking, setChecking] = useState(true);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    let unsub = () => {};
    api.getSessionUserId().then((id) => {
      setUserId(id);
      setChecking(false);
    });
    if (api.onAuthChange) {
      unsub = api.onAuthChange((event, id) => {
        setUserId(id);
        if (event === 'PASSWORD_RECOVERY') setRecovery(true);
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') refresh();
      });
    }
    return () => unsub();
  }, [refresh]);

  const profile = useMemo(() => db.profiles.find((p) => p.id === userId) ?? null, [db.profiles, userId]);

  const signIn = useCallback(async (creds) => {
    const id = await api.signIn(creds);
    setUserId(id);
    await refresh();
    return id;
  }, [refresh]);

  const demoLogin = useCallback(async (profileId) => {
    const id = await api.demoLogin(profileId);
    setUserId(id);
    return id;
  }, []);

  const signUp = useCallback(async (data) => {
    const res = await api.signUp(data);
    await refresh();
    if (isDemoMode || !res.needsConfirmation) setUserId(res.userId);
    return res;
  }, [refresh]);

  const signOut = useCallback(async () => {
    await api.signOut();
    setUserId(null);
  }, []);

  const value = useMemo(
    () => ({
      userId,
      profile,
      isAdmin: profile?.role === 'admin',
      // Logged in but the profile row is not loaded yet
      loading: checking || (userId && dataLoading),
      recovery,
      signIn,
      signUp,
      signOut,
      demoLogin,
      resetPassword: api.resetPassword,
      updatePassword: api.updatePassword,
    }),
    [userId, profile, checking, dataLoading, recovery, signIn, signUp, signOut, demoLogin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
