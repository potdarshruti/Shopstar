import { createContext, useContext, useEffect, useState } from 'react';
import api from './api.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export const homeFor = (role) => ({ admin: '/admin', owner: '/owner', user: '/stores' }[role] || '/login');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('token')) return setReady(true);
    api.get('/auth/me').then((r) => setUser(r.data)).catch(() => localStorage.removeItem('token')).finally(() => setReady(true));
  }, []);

  const accept = ({ token, user }) => { localStorage.setItem('token', token); setUser(user); return user; };
  const login = async (email, password) => accept((await api.post('/auth/login', { email, password })).data);
  const signup = async (form) => accept((await api.post('/auth/signup', form)).data);
  const logout = () => { localStorage.removeItem('token'); setUser(null); };

  return <AuthCtx.Provider value={{ user, ready, login, signup, logout }}>{children}</AuthCtx.Provider>;
}
