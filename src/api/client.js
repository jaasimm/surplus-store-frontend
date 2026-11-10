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

let inMemoryCsrf = null;

/** Make sure the CSRF token exists before mutating requests. */
async function ensureCsrf() {
  if (inMemoryCsrf || readCookie(COOKIE_NAME)) return inMemoryCsrf || readCookie(COOKIE_NAME);
  if (!csrfBootstrap) {
    csrfBootstrap = api
      .get('/auth/csrf')
      .then((res) => {
        inMemoryCsrf = res?.data?.data?.csrfToken || null;
        return inMemoryCsrf;
      })
      .catch(() => null);
  }
  const token = await csrfBootstrap;
  csrfBootstrap = null;
  return token || inMemoryCsrf || readCookie(COOKIE_NAME);
}

api.interceptors.request.use(async (config) => {
  const method = (config.method || 'get').toLowerCase();
  let csrf = inMemoryCsrf || readCookie(COOKIE_NAME);
  if (!['get', 'head', 'options'].includes(method) && !csrf) {
    csrf = await ensureCsrf();
  }

  // Never reuse a cached GET response: a stale /auth/me served from the
  // browser cache is what makes the login state look "stuck" after a
  // login/logout in the same browser.
  if (['get', 'head'].includes(method)) {
    config.headers['Cache-Control'] = 'no-cache, no-store';
    config.headers['Pragma'] = 'no-cache';
    if (String(config.url || '').includes('/auth/')) {
      config.params = { ...config.params, _ts: Date.now() }; // bust any proxy cache too
    }
  }

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
      // Keep the rejection so we can tell "the server said no" apart from
      // "the network died" — only the former means the session is gone.
      refreshing =
        refreshing ||
        api.post('/auth/refresh').then(
          (res) => ({ ok: true, res }),
          (err) => ({ ok: false, err })
        );
      const outcome = await refreshing;
      refreshing = null;
      if (outcome.ok && outcome.res?.data?.success) return api(original);
      // A real answer from the server (401/403/5xx) tells us the refresh
      // cookie is unusable. A network blip — very common when a mobile tab
      // resumes from the background — must NOT lock us out of retrying later.
      if (!outcome.ok && outcome.err?.response) setRefreshPossible(false);
    }
    return Promise.reject(error);
  }
);

/**
 * Guarantee a valid access token before a critical call (place order, verify
 * payment). Returns true when a session should still exist — callers prompt
 * for login only when it returns FALSE.
 *
 * "False" is reserved for a DEFINITIVE answer from the server (no cookies at
 * all, or the refresh cookie was rejected). When we simply cannot reach the
 * server — flaky mobile network, tab resuming from the background — we return
 * true so the caller retries the real request instead of throwing a login
 * modal at someone who is still signed in.
 */
export async function ensureFreshSession() {
  try {
    const { data } = await api.get('/auth/me');
    const session = data?.data || {};
    setRefreshPossible(Boolean(session.user || session.canRefresh));
    if (session.user) return true;
    if (!session.canRefresh) return false; // definitive: no session cookies

    try {
      const refreshed = await api.post('/auth/refresh');
      if (refreshed?.data?.success) {
        setRefreshPossible(true);
        return true;
      }
    } catch (err) {
      if (!err?.response) return true; // network blip → assume still signed in
      setRefreshPossible(false); // server rejected the refresh cookie
      return false;
    }
    setRefreshPossible(false);
    return false;
  } catch {
    /* could not reach the server → never claim "logged out" */
    return true;
  }
}

/** Extract a friendly message from any API error. */
export const errMsg = (err) =>
  err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.';

export default api;
