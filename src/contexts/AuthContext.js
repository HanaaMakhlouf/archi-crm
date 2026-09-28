import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { ROLE_USER } from '../constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [officeId, setOfficeId] = useState(null);
  const [userRole, setUserRole] = useState(ROLE_USER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let profileRequest = 0;

    const resolveSession = async (session) => {
      const requestId = ++profileRequest;
      const nextUser = session?.user || null;
      setUser(nextUser);

      if (!nextUser) {
        setOfficeId(null);
        setUserRole(ROLE_USER);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('office_id, role')
        .eq('id', nextUser.id)
        .maybeSingle();

      if (!active || requestId !== profileRequest) return;
      setOfficeId(data?.office_id || null);
      setUserRole(data?.role || ROLE_USER);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        if (active) resolveSession(session);
      }, 0);
    });

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (active && !error) return resolveSession(data.session);
        if (active) setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      officeId,
      setOfficeId,
      userRole,
      isAdmin: userRole === 'admin',
      loading,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}