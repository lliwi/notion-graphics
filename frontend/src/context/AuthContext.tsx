'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  role: string | null;
  login: (token: string) => void;
  logout: () => void;
}

function decodeRole(token: string): string | null {
  try {
    return JSON.parse(atob(token.split('.')[1]))?.role ?? null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  isAuthenticated: false,
  role: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('auth_token');
    if (stored) setToken(stored);
    setReady(true);
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem('auth_token', newToken);
    // Also set as cookie so the Notion OAuth API route can read it server-side
    document.cookie = `auth_token=${newToken}; path=/; SameSite=Lax`;
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    document.cookie = 'auth_token=; path=/; max-age=0';
    setToken(null);
  };

  if (!ready) return null;

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, role: token ? decodeRole(token) : null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
