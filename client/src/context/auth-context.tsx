'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { fetchUserStatus, logoutUser, UserProfile } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    setLoading(true);
    const profile = await fetchUserStatus();
    setUser(profile);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
