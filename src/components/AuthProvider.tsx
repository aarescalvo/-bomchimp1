import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { apiFetch } from '../lib/api';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<(UserProfile & { mustChangePassword?: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);

  // Comprobar si hay una sesión activa al cargar
  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await apiFetch('/api/auth/me');
        setProfile({
          uid: user.id,
          displayName: user.displayName,
          email: '',
          role: user.role,
          status: 'active',
          permissions: user.permissions,
          mustChangePassword: user.mustChangePassword
        });
      } catch (err) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const user = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setProfile({
      uid: user.id,
      displayName: user.displayName,
      email: '',
      role: user.role,
      status: 'active',
      permissions: user.permissions,
      mustChangePassword: user.mustChangePassword
    });
  };

  const logout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user: profile, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
