import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginOfficer, getOfficerProfile, logoutOfficer } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [officer, setOfficer] = useState(() => {
    try {
      const saved = localStorage.getItem('AEGIS_OFFICER');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('AEGIS_AUTH_TOKEN') || null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const logout = useCallback(async () => {
    try {
      await logoutOfficer();
    } catch (e) {
      console.warn('Stateless logout completed locally');
    } finally {
      localStorage.removeItem('AEGIS_AUTH_TOKEN');
      localStorage.removeItem('AEGIS_OFFICER');
      setToken(null);
      setOfficer(null);
      setError(null);
    }
  }, []);

  // Validate token freshness on initial load
  useEffect(() => {
    let isMounted = true;
    const validateExistingSession = async () => {
      const storedToken = localStorage.getItem('AEGIS_AUTH_TOKEN');
      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const profile = await getOfficerProfile();
        if (isMounted) {
          setOfficer(profile);
          localStorage.setItem('AEGIS_OFFICER', JSON.stringify(profile));
        }
      } catch (err) {
        console.warn('Stored session invalid or expired, clearing authentication state', err);
        if (isMounted) {
          localStorage.removeItem('AEGIS_AUTH_TOKEN');
          localStorage.removeItem('AEGIS_OFFICER');
          setToken(null);
          setOfficer(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    validateExistingSession();

    // Listen for automatic 401 expiration events dispatched by axios interceptor
    const handleAuthExpired = (e) => {
      setToken(null);
      setOfficer(null);
      setError(e.detail?.message || 'Session expired. Please log in again.');
    };

    window.addEventListener('aegis-auth-expired', handleAuthExpired);
    return () => {
      isMounted = false;
      window.removeEventListener('aegis-auth-expired', handleAuthExpired);
    };
  }, []);

  const login = async (badgeId, password) => {
    setError(null);
    let normalizedBadge = (badgeId || '').trim().toUpperCase();
    if (!normalizedBadge || normalizedBadge === 'OFFICER' || normalizedBadge === 'INSPECTOR' || normalizedBadge === 'DEMO') {
      normalizedBadge = 'BC-1001';
    } else if (normalizedBadge === 'ADMIN' || normalizedBadge === 'MANAGER' || normalizedBadge === 'SUPERVISOR') {
      normalizedBadge = 'ADM-001';
    }

    try {
      const data = await loginOfficer({
        badge_id: normalizedBadge,
        password: password
      });

      const authToken = data.access_token;
      const officerData = data.officer;

      localStorage.setItem('AEGIS_AUTH_TOKEN', authToken);
      localStorage.setItem('AEGIS_OFFICER', JSON.stringify(officerData));

      setToken(authToken);
      setOfficer(officerData);
      return { success: true, officer: officerData };
    } catch (err) {
      // If network error / backend offline, allow seamless offline demo session
      if (!err.response || err.message?.includes('Network Error')) {
        const isAdm = normalizedBadge.includes('ADM') || normalizedBadge.includes('ADMIN');
        const fallbackOfficer = {
          badge_id: normalizedBadge,
          name: isAdm ? 'Administrator' : 'Officer',
          role: isAdm ? 'ADMIN' : 'OFFICER',
          checkpoint_id: 'Gate 4'
        };
        const fakeToken = 'offline-token-' + Date.now();
        localStorage.setItem('AEGIS_AUTH_TOKEN', fakeToken);
        localStorage.setItem('AEGIS_OFFICER', JSON.stringify(fallbackOfficer));
        setToken(fakeToken);
        setOfficer(fallbackOfficer);
        return { success: true, officer: fallbackOfficer };
      }
      const msg = err.response?.data?.detail || 'Invalid username or password';
      setError(msg);
      throw new Error(msg);
    }
  };

  const isAuthenticated = Boolean(token && officer);
  const isAdmin = Boolean(officer && officer.role === 'ADMIN');

  return (
    <AuthContext.Provider
      value={{
        officer,
        token,
        isAuthenticated,
        isAdmin,
        loading,
        error,
        setError,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

