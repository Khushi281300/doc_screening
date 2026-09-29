import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginOfficer, getOfficerProfile, storage, errMsg } from '../api/client';

const AuthContext = createContext(null);

export { roleInfo } from '../labels';

export function AuthProvider({ children }) {
  const [officer, setOfficer] = useState(() => storage.getOfficer());
  const [token, setToken] = useState(() => storage.getToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const logout = useCallback(() => {
    storage.clear();
    setToken(null);
    setOfficer(null);
    setError(null);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!storage.getToken()) { setLoading(false); return; }
      try {
        const profile = await getOfficerProfile();
        if (alive) { setOfficer(profile); storage.set(storage.getToken(), profile); }
      } catch {
        if (alive) { storage.clear(); setToken(null); setOfficer(null); }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    const onExpired = (e) => { setToken(null); setOfficer(null); setError(e.detail?.message); };
    window.addEventListener('chronicle-auth-expired', onExpired);
    return () => { alive = false; window.removeEventListener('chronicle-auth-expired', onExpired); };
  }, []);

  const login = async (badgeId, password) => {
    setError(null);
    try {
      const data = await loginOfficer(badgeId.trim().toUpperCase(), password);
      storage.set(data.access_token, data.officer);
      setToken(data.access_token);
      setOfficer(data.officer);
      return data.officer;
    } catch (err) {
      const msg = errMsg(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const role = officer?.role;
  const value = {
    officer, token, loading, error, setError, login, logout,
    role,
    isAuthenticated: Boolean(token && officer),
    isPolice: role === 'INVESTIGATING_OFFICER' || role === 'STATION_HOUSE_OFFICER',
    isSHO: role === 'STATION_HOUSE_OFFICER',
    isIO: role === 'INVESTIGATING_OFFICER',
    isFSL: role === 'FSL_EXAMINER',
    isCourt: role === 'MAGISTRATE',
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
