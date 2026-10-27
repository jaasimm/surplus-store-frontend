import { useEffect, useRef, useState } from 'react';
import { X, Smartphone, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ButtonSpinner, ErrorNote } from './Feedback';
import { cx } from '../utils/format';

const COUNTRY_CODES = ['+91', '+1', '+44', '+61', '+971', '+65'];

/**
 * Mobile-number OTP login.
 * Step 1 → enter number (country code defaults to +91) and request an OTP.
 * Step 2 → enter the 6-digit code (5 min expiry, resend after 30 s).
 * The account is created automatically for new numbers.
 */
export default function AuthModal() {
  const { authOpen, authReason, closeAuth, sendOtp, verifyOtp, onAuthSuccess } = useAuth();
  const { refresh } = useCart();

  const [step, setStep] = useState('phone'); // phone | otp
  const [cc, setCc] = useState('+91');
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const otpRef = useRef(null);

  /* reset when the modal opens */
  useEffect(() => {
    if (authOpen) {
      setStep('phone');
      setOtp('');
      setError('');
      setCooldown(0);
    }
  }, [authOpen]);

  /* resend countdown */
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === 'otp') otpRef.current?.focus();
  }, [step]);

  if (!authOpen) return null;

  const fullMobile = `${cc}${mobile.replace(/^0/, '')}`;

  const handleSend = async (e) => {
    e?.preventDefault();
    setError('');
    if (!/^\d{8,12}$/.test(mobile)) return setError('Enter a valid mobile number');
    setLoading(true);
    try {
      const data = await sendOtp(fullMobile);
      setDevOtp(data?.devOtp || '');
      setCooldown(data?.resendSeconds || 30);
      setStep('otp');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(otp)) return setError('Enter the 6-digit OTP');
    setLoading(true);
    try {
      const data = await verifyOtp({ mobile: fullMobile, otp, name: name.trim() || undefined });
      await refresh(); // server has merged the guest cart into the account
      closeAuth();
      onAuthSuccess?.(data?.data?.user);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={closeAuth} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Login with mobile number"
        className="safe-bottom relative w-full max-w-md rounded-t-3xl bg-white shadow-pop animate-fadeUp sm:rounded-3xl"
      >
        <button onClick={closeAuth} aria-label="Close" className="absolute right-4 top-4 p-1 text-ink-400 hover:text-ink-700">
          <X className="h-5 w-5" />
        </button>

        <div className="px-6 pb-8 pt-8 sm:px-8">
          <div className="mb-5 flex items-center gap-3">
            {step === 'otp' && (
              <button type="button" onClick={() => setStep('phone')} className="p-1 text-ink-500 hover:text-ink-900" aria-label="Back">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-ink-900 text-sand-50">
              {step === 'phone' ? <Smartphone className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink-900">
                {step === 'phone' ? 'Login or Sign up' : 'Verify your number'}
              </h2>
              <p className="text-xs text-ink-500">
                {step === 'phone' ? 'We will send you a 6-digit code' : `OTP sent to ${fullMobile}`}
              </p>
            </div>
          </div>

          {authReason && <p className="mb-4 rounded-xl bg-ink-50 px-3 py-2 text-xs text-ink-600">{authReason}</p>}
          <ErrorNote className="mb-3">{error}</ErrorNote>

          {step === 'phone' ? (
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="label" htmlFor="mobile">Mobile number</label>
                <div className="flex gap-2">
                  <select
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    aria-label="Country code"
                    className="field w-24 px-2"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <input
                    id="mobile"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="98765 43210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    className="field flex-1"
                    autoFocus
                  />
                </div>
              </div>

              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 60))}
                placeholder="Your name (optional, first login)"
                className="field"
                autoComplete="name"
              />

              <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                {loading ? <ButtonSpinner label="Sending OTP…" /> : 'Send OTP'}
              </button>
              <p className="text-center text-[11px] leading-relaxed text-ink-400">
                By continuing you agree to our Terms of Service and Privacy Policy. Standard SMS charges may apply.
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="label" htmlFor="otp">Enter 6-digit OTP</label>
                <input
                  id="otp"
                  ref={otpRef}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  className={cx('field text-center text-2xl font-bold tracking-[0.6em]')}
                />
              </div>

              {devOtp && (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs text-amber-800">
                  Dev mode — your OTP is <b className="tracking-widest">{devOtp}</b>
                </p>
              )}

              <button type="submit" className="btn-primary w-full py-3" disabled={loading || otp.length !== 6}>
                {loading ? <ButtonSpinner label="Verifying…" /> : 'Verify & Continue'}
              </button>

              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-400">Code expires in 5 minutes</span>
                {cooldown > 0 ? (
                  <span className="text-ink-400">Resend in {cooldown}s</span>
                ) : (
                  <button type="button" onClick={handleSend} className="font-semibold text-ink-900 underline underline-offset-4">
                    Resend OTP
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
