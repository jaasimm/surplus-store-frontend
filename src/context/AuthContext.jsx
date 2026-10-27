import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { errMsg, setRefreshPossible } from '../api/client';
import { getGuestId } from '../api/client';

const AuthContext = createContext(null);

/**
 * Authentication state.
 * Login happens only through the OTP modal (mobile + 6-digit code).
 * JWTs live in httpOnly cookies — no token is ever stored in JS.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState('');
  const [onAuthSuccess, setOnAuthSuccess] = useState(null); // callback run after login

  /* Restore the session on first load using the refresh cookie. */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Always 200 — tells us the user AND whether a refresh cookie exists.
        const { data } = await api.get('/auth/me');
        const session = data?.data || {};
        setRefreshPossible(Boolean(session.user || session.canRefresh));

        if (session.user) {
          if (alive) setUser(session.user);
        } else if (session.canRefresh) {
          // Access token aged out but the refresh cookie can renew it silently.
          const { data: refreshed } = await api.post('/auth/refresh').catch(() => ({ data: null }));
          if (alive && refreshed?.data?.user) setUser(refreshed.data.user);
        }
      } catch {
        /* offline / server down → behave as a guest */
      } finally {
        if (alive) setBooting(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /**
   * Open the login popup. Used by the checkout flow — `reason` is shown in
   * the modal and `callback` runs after a successful login.
   */
  const requireLogin = useCallback((reason = 'Login to continue', callback = null) => {
    setAuthReason(reason);
    setOnAuthSuccess(() => callback);
    setAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setAuthOpen(false);
    setAuthReason('');
    setOnAuthSuccess(null);
  }, []);

  const sendOtp = useCallback(async (mobile) => {
    const { data } = await api.post('/auth/send-otp', { mobile, guestId: getGuestId() });
    return data?.data;
  }, []);

  const verifyOtp = useCallback(async ({ mobile, otp, name }) => {
    const { data } = await api.post('/auth/verify-otp', { mobile, otp, name, guestId: getGuestId() });
    setUser(data?.data?.user || null);
    setRefreshPossible(true); // fresh access + refresh cookies just landed
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      setRefreshPossible(false); // cookies cleared → don't try to refresh
    }
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const { data } = await api.put('/users/profile', payload);
    setUser((u) => (u ? { ...u, ...data?.data?.user } : u));
    return data?.data?.user;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data?.data?.user || null);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      booting,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      authOpen,
      authReason,
      onAuthSuccess,
      setAuthOpen,
      requireLogin,
      closeAuth,
      sendOtp,
      verifyOtp,
      logout,
      updateProfile,
      refreshUser,
    }),
    [user, booting, authOpen, authReason, onAuthSuccess, requireLogin, closeAuth, sendOtp, verifyOtp, logout, updateProfile, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export { errMsg };
