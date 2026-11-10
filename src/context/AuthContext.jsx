import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api, { errMsg, setRefreshPossible } from '../api/client';
import { getGuestId } from '../api/client';

const AuthContext = createContext(null);

/* ── Local session hint ────────────────────────────────────────────────────
 * Mobile browsers reload or evict a background tab far more eagerly than
 * desktop — switching to the SMS app to read the OTP is often enough. When
 * that happens the page boots from scratch, and a slow or flaky first
 * GET /auth/me would otherwise be read as "logged out" → login modal again.
 *
 * The cached profile is only a HINT: it restores the UI instantly and the
 * server probe confirms it a moment later. Nothing sensitive lives here —
 * the JWTs stay in httpOnly cookies and are never readable from JS.
 */
const USER_CACHE = 'ss_user';
const LOGIN_AT = 'ss_auth_at';
/** How long a freshly issued login is trusted if the very next probe says
 *  "guest" (covers the mobile reload that happens right after the OTP). */
const LOGIN_GRACE_MS = 60_000;
/** Minimum gap between background revalidation probes — mobile fires `focus`
 *  on keyboard / URL-bar / app-switch churn and we must not hammer /auth/me. */
const REVALIDATE_THROTTLE_MS = 4000;

const readStore = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStore = (key, value) => {
  try {
    if (value === null || value === undefined || value === '') localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* private mode / storage disabled → the server probe still works */
  }
};

const readCachedUser = () => {
  try {
    const raw = readStore(USER_CACHE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const cacheUser = (user) => writeStore(USER_CACHE, user ? JSON.stringify(user) : null);

const withinLoginGrace = () => Date.now() - Number(readStore(LOGIN_AT) || 0) < LOGIN_GRACE_MS;

/**
 * Authentication state.
 * Login happens only through the OTP modal (mobile + 6-digit code).
 * JWTs live in httpOnly cookies — no token is ever stored in JS.
 */
export function AuthProvider({ children }) {
  // Start from the cached profile (if any) so a mobile tab reload never shows
  // a logged-out flash or re-opens the login modal before the probe answers.
  const [user, setUser] = useState(readCachedUser);
  const [booting, setBooting] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState('');
  const [onAuthSuccess, setOnAuthSuccess] = useState(null); // callback run after login

  /* ── Session probe ──────────────────────────────────────────────────────
   * Always resolves, never throws, and only ever PROMOTES the session on a
   * background revalidation. Shared by boot and by the tab-focus
   * revalidation below, guarded so two probes never race each other.
   *
   * `epoch` makes a probe's answer disposable: it is captured before the
   * request and compared after every await, so a probe that started while
   * the user was still a guest can never overwrite the state written by a
   * login that finished in the meantime (that race is what re-opens the
   * login modal right after a successful OTP on mobile).
   *
   * `isInitialBoot` controls how aggressively we clear the session:
   * - On boot (true): we resolve the real state — a definitive "no session"
   *   answer means logged out (unless a login just happened).
   * - On revalidation (false, e.g. visibilitychange): we only PROMOTE
   *   (logged-out → logged-in). We never demote, because on mobile a brief
   *   background trip (switching to SMS for the OTP, screen lock) can make a
   *   cookie temporarily unavailable without the session actually being
   *   gone. Demoting here is what caused the infinite login-modal loop.
   * - A failed request (offline, timeout, server down) never changes state.
   */
  const epoch = useRef(0);
  const probing = useRef(false);
  const lastProbeAt = useRef(0);

  const applyUser = useCallback((next) => {
    setUser(next);
    cacheUser(next);
  }, []);

  const probeSession = useCallback(
    async (isInitialBoot = false) => {
      if (probing.current) return;
      const now = Date.now();
      if (!isInitialBoot && now - lastProbeAt.current < REVALIDATE_THROTTLE_MS) return;
      lastProbeAt.current = now;

      probing.current = true;
      const seen = epoch.current;
      const stillCurrent = () => epoch.current === seen;

      try {
        const { data } = await api.get('/auth/me');
        if (!stillCurrent()) return; // a login/logout happened mid-flight
        const session = data?.data || {};
        const serverUser = session.user || null;
        setRefreshPossible(Boolean(serverUser || session.canRefresh));

        if (serverUser) {
          // Always accept a valid user from the server.
          applyUser(serverUser);
          return;
        }

        if (session.canRefresh) {
          // Access token aged out but the refresh cookie can renew it silently.
          let refreshed = null;
          try {
            ({ data: refreshed } = await api.post('/auth/refresh'));
          } catch (err) {
            // A 4xx means the refresh cookie is genuinely gone. Anything else
            // (offline, timeout, 5xx) must NOT poison the session hint —
            // otherwise every later 401 looks like "logged out" on mobile.
            if (err?.response) setRefreshPossible(false);
            return;
          }
          if (!stillCurrent()) return;
          const freshUser = refreshed?.data?.user || null;
          if (freshUser) {
            setRefreshPossible(true);
            applyUser(freshUser);
          } else if (isInitialBoot && !withinLoginGrace()) {
            applyUser(null);
          }
          return;
        }

        // Definitive "no session" answer (no access token, no refresh cookie).
        if (!isInitialBoot) return; // background probe → never log you out
        if (withinLoginGrace()) return; // reload right after OTP login
        applyUser(null);
      } catch {
        /* offline / server down / timeout → keep the state we already have */
      } finally {
        probing.current = false;
      }
    },
    [applyUser]
  );

  /* Restore the session on first load using the cached profile + refresh cookie. */
  useEffect(() => {
    let alive = true;
    probeSession(true /* isInitialBoot */).finally(() => {
      if (alive) setBooting(false);
    });
    return () => {
      alive = false;
    };
  }, [probeSession]);

  /* Re-check when the user comes back to the tab — catches a session that
     expired in another tab or while the tab was in the background. */
  useEffect(() => {
    if (booting) return undefined;
    const revalidate = () => {
      if (document.visibilityState === 'visible') probeSession();
    };
    document.addEventListener('visibilitychange', revalidate);
    window.addEventListener('focus', revalidate);
    return () => {
      document.removeEventListener('visibilitychange', revalidate);
      window.removeEventListener('focus', revalidate);
    };
  }, [booting, probeSession]);

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

  const verifyOtp = useCallback(
    async ({ mobile, otp, name, idToken }) => {
      const { data } = await api.post('/auth/verify-otp', { mobile, otp, name, idToken, guestId: getGuestId() });
      const signedIn = data?.data?.user || null;
      // Invalidate any probe that is still in flight with the pre-login answer,
      // and pause background revalidation for a moment while the cookies settle.
      epoch.current += 1;
      lastProbeAt.current = Date.now();
      applyUser(signedIn);
      if (signedIn) writeStore(LOGIN_AT, String(Date.now()));
      else writeStore(LOGIN_AT, null);
      setRefreshPossible(Boolean(signedIn)); // fresh access + refresh cookies just landed
      return data;
    },
    [applyUser]
  );

  const logout = useCallback(async () => {
    epoch.current += 1; // any in-flight probe must not resurrect the session
    try {
      await api.post('/auth/logout');
    } finally {
      applyUser(null);
      writeStore(LOGIN_AT, null);
      setRefreshPossible(false); // cookies cleared → don't try to refresh
    }
  }, [applyUser]);

  const updateProfile = useCallback(async (payload) => {
    const { data } = await api.put('/users/profile', payload);
    setUser((u) => (u ? { ...u, ...data?.data?.user } : u));
    return data?.data?.user;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      // Only update user if the server returned one. Never set to null here —
      // callers use refreshUser to pull fresh profile fields (addresses, wishlist),
      // not to detect logout; probeSession handles that.
      const fresh = data?.data?.user;
      if (fresh) {
        setUser(fresh);
        cacheUser(fresh);
      }
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
