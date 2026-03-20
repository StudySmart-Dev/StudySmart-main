import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import * as api from '../api/apiClient.js';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthContext');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('studysmart_user');
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore storage errors
    } finally {
      setBooting(false);
    }
  }, []);

  const value = useMemo(() => {
    async function signup(payload) {
      const created = await api.create('users', payload);
      const nextUser = created; // json-server echoes the created object
      setUser(nextUser);
      localStorage.setItem('studysmart_user', JSON.stringify(nextUser));
      return nextUser;
    }

    async function signin({ email, password }) {
      const found = await api.findBy('users', { email });
      const match = Array.isArray(found) ? found.find((u) => u.password === password) : null;
      if (!match) throw new Error('Invalid email or password');
      setUser(match);
      localStorage.setItem('studysmart_user', JSON.stringify(match));
      return match;
    }

    function logout() {
      setUser(null);
      try {
        localStorage.removeItem('studysmart_user');
      } catch {
        // ignore
      }
    }

    return { user, booting, signup, signin, logout };
  }, [user, booting]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

