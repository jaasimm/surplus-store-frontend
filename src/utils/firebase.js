/**
 * Firebase Phone Auth helper.
 *
 * All Firebase initialisation is deferred behind `isFirebaseConfigured()` so
 * the app starts fine even when the env key is absent (e.g. CI builds).
 *
 * Usage:
 *   1. `isFirebaseConfigured()` → guard before calling Firebase APIs
 *   2. `sendFirebaseOtp('+91XXXXXXXXXX')` → returns a ConfirmationResult
 *   3. `confirmationResult.confirm(otp)` → returns a UserCredential
 *   4. `userCredential.user.getIdToken()` → pass to server /api/auth/verify-otp
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: 'surpluses.firebaseapp.com',
  projectId: 'surpluses',
  storageBucket: 'surpluses.firebasestorage.app',
  messagingSenderId: '814299710970',
  appId: '1:814299710970:web:674e85716fe34d65189043',
};

/** Returns true only when a valid-looking API key is present in the env. */
export function isFirebaseConfigured() {
  const key = import.meta.env.VITE_FIREBASE_API_KEY;
  return Boolean(key && key.startsWith('AIzaSy'));
}

let _app = null;
let _auth = null;
/** True only after `renderRecaptcha()` has successfully rendered the widget. */
let _recaptchaReady = false;

function getFirebaseApp() {
  if (!_app) {
    _app = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
  }
  return _app;
}

export function getFirebaseAuth() {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
  }
  return _auth;
}

/**
 * In-flight guard. React StrictMode double-invokes the AuthModal effect in
 * dev, which would otherwise render the widget twice into the same container.
 */
let _setupInFlight = null;

/**
 * Creates (or re-creates) an invisible reCAPTCHA verifier attached to `containerId`,
 * then immediately renders it so the token is ready by the time the user clicks Send OTP.
 * Returns a Promise that resolves once rendering is complete.
 */
export async function setupRecaptcha(containerId = 'recaptcha-container') {
  // Already rendered and healthy → reuse it. `render()` on the same instance
  // returns its cached promise, so this is effectively a no-op and avoids a
  // pointless rebuild (which grecaptcha would otherwise reject).
  if (_recaptchaReady && window.recaptchaVerifier) {
    try {
      await window.recaptchaVerifier.render();
      return window.recaptchaVerifier;
    } catch { /* stale → fall through and rebuild */ }
  }
  if (_setupInFlight) return _setupInFlight;
  _setupInFlight = renderRecaptcha(containerId).finally(() => {
    _setupInFlight = null;
  });
  return _setupInFlight;
}

async function renderRecaptcha(containerId) {
  const auth = getFirebaseAuth();
  _recaptchaReady = false;

  const outer = document.getElementById(containerId);
  if (!outer) {
    throw new Error(`[auth] reCAPTCHA container #${containerId} not found in the DOM`);
  }

  // Destroy any previous verifier.
  if (window.recaptchaVerifier) {
    try { window.recaptchaVerifier.clear(); } catch { /* ignore */ }
    window.recaptchaVerifier = null;
  }

  // grecaptcha permanently marks the exact node it renders into and throws
  // "reCAPTCHA has already been rendered in this element" on a second render —
  // EMPTYING THE NODE DOES NOT RESET IT (verified: clear() also skips DOM
  // removal for invisible widgets). So render every verifier into a
  // brand-new element that has never been used, making a rebuild safe.
  outer.innerHTML = '';
  const host = document.createElement('div');
  outer.appendChild(host);

  window.recaptchaVerifier = new RecaptchaVerifier(auth, host, {
    size: 'invisible',
    callback: () => { /* solved automatically */ },
    // Surface widget-level failures (e.g. domain not allow-listed for the key)
    // instead of hanging silently on Send OTP.
    'error-callback': (err) => {
      console.warn('[auth] reCAPTCHA widget error:', err);
    },
  });

  // Pre-render so the widget is warm before signInWithPhoneNumber is called
  await window.recaptchaVerifier.render();
  _recaptchaReady = true;
  return window.recaptchaVerifier;
}

/**
 * Sends a Firebase SMS OTP to `phoneNumber` (E.164 format, e.g. +919876543210).
 * Returns a Firebase `ConfirmationResult` object.
 * Call `confirmationResult.confirm(otp)` once the user enters the code.
 *
 * Pass the already-rendered `appVerifier` from `setupRecaptcha()` to avoid
 * re-creating the widget on every send attempt.
 */
export async function sendFirebaseOtp(phoneNumber) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured — add VITE_FIREBASE_API_KEY to client/.env');
  }
  const auth = getFirebaseAuth();
  // Reuse the already-rendered verifier (set up when the modal opened), but only
  // if it actually rendered — otherwise rebuild it so a failed render can't
  // poison the whole sign-in flow.
  const appVerifier =
    (_recaptchaReady && window.recaptchaVerifier) ||
    (await setupRecaptcha('recaptcha-container'));
  return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
}
