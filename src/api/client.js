import axios from 'axios';

/**
 * Shared axios instance.
 * - `withCredentials` so the httpOnly JWT cookies travel with every request.
 * - Injects the CSRF double-submit header on mutating requests.
 * - Attaches the guest cart id so guest carts survive across devices/sessions.
 * - Transparently refreshes the access token once on 401.
 */

const COOKIE_NAME = 'ss_csrf';

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

/** Stable anonymous id for the guest cart (localStorage survives reloads). */
export function getGuestId() {
  let id = localStorage.getItem('ss_guest_id');
  if (!id) {
    id = (crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    localStorage.setItem('ss_guest_id', id);
  }
  return id;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 20000,
});

let refreshing = null;
let csrfBootstrap = null;

/**
 * Session hint, seeded by GET /auth/me.
 * When false we KNOW there is no refresh cookie, so we skip the pointless
 * `POST /auth/refresh` that would only produce a second 401 in the network log.
 */
let refreshPossible = true;
export const setRefreshPossible = (value) => {
  refreshPossible = Boolean(value);
};

/** Make sure the CSRF cookie exists before the very first mutating request. */
async function ensureCsrf() {
  if (readCookie(COOKIE_NAME)) return;
  csrfBootstrap = csrfBootstrap || api.get('/auth/csrf').catch(() => null);
  await csrfBootstrap;
  csrfBootstrap = null;
}

api.interceptors.request.use(async (config) => {
  const method = (config.method || 'get').toLowerCase();
  if (!['get', 'head', 'options'].includes(method)) await ensureCsrf();

  const csrf = readCookie(COOKIE_NAME);
  if (csrf) config.headers['X-CSRF-Token'] = csrf;
  config.headers['X-Guest-ID'] = getGuestId();
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthRoute = original?.url?.includes('/auth/');

    // Only attempt a silent refresh when a refresh cookie can actually exist.
    if (error.response?.status === 401 && !original._retried && !isAuthRoute && refreshPossible) {
      original._retried = true;
      refreshing = refreshing || api.post('/auth/refresh').catch(() => null);
      const result = await refreshing;
      refreshing = null;
      if (result?.data?.success) return api(original);
      // The refresh cookie is gone too — we are definitely a guest now.
      setRefreshPossible(false);
    }
    return Promise.reject(error);
  }
);

/**
 * Guarantee a valid access token before a critical call (place order, verify
 * payment). Returns true when a session exists afterwards — callers should
 * prompt for login when it returns false instead of hitting a raw 401.
 */
export async function ensureFreshSession() {
  try {
    const { data } = await api.get('/auth/me');
    const session = data?.data || {};
    setRefreshPossible(Boolean(session.user || session.canRefresh));
    if (session.user) return true;
    if (!session.canRefresh) return false;

    const refreshed = await api.post('/auth/refresh');
    if (refreshed?.data?.success) {
      setRefreshPossible(true);
      return true;
    }
  } catch {
    /* fall through → treat as logged out */
  }
  setRefreshPossible(false);
  return false;
}

/** Extract a friendly message from any API error. */
export const errMsg = (err) =>
  err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.';

export default api;
