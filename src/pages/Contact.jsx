import { useState } from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import SEO from '../components/SEO';
import { ButtonSpinner, ErrorNote } from '../components/Feedback';
import { useToast } from '../context/ToastContext';
import api, { errMsg } from '../api/client';
import { cx } from '../utils/format';

const EMPTY = { name: '', email: '', mobile: '', subject: 'General', message: '' };
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

/**
 * Forward the message to the store owner's inbox through Web3Forms.
 *
 * This deliberately runs in the browser: Web3Forms' free plan only accepts
 * submissions from the client side (server-to-server calls return 403). The
 * access key is public by design — it is an alias for our inbox, not a secret.
 *
 * The message is also POSTed to our API so it lands in admin → Messages.
 * A failure here is only logged: it must never fail the visitor's submission.
 */
async function sendEmailNotification(payload) {
  const access_key = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
  if (!access_key) return { skipped: 'VITE_WEB3FORMS_ACCESS_KEY not set' };

  const body = {
    access_key,
    // `subject` is reserved by Web3Forms: it becomes the notification's subject.
    subject: `[${payload.subject}] ${payload.name} — surplusstore.in`,
    from_name: payload.name,
    name: payload.name,
    mobile: payload.mobile,
    message: payload.message,
  };
  if (payload.email) {
    body.email = payload.email;
    body.replyto = payload.email; // so "Reply" reaches the visitor
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(WEB3FORMS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || `Web3Forms responded ${res.status}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export default function Contact() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const validate = () => {
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Please enter your name';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (form.message.trim().length < 5) errs.message = 'Tell us a little more (at least 5 characters)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setSending(true);
    try {
      // Save to the database (admin → Messages) and e-mail the owner in
      // parallel. Only the save decides success — the visitor never sees an
      // e-mail hiccup, and the message is always retrievable from the admin.
      const [saved, emailed] = await Promise.allSettled([
        api.post('/contact', form),
        sendEmailNotification(form),
      ]);

      if (saved.status === 'rejected') {
        setError(errMsg(saved.reason));
      } else {
        toast.success(saved.value.data.message);
        setForm(EMPTY);
        setDone(true);
      }

      if (emailed.status === 'rejected') {
        console.warn('[contact] e-mail notification failed:', emailed.reason?.message || emailed.reason);
      } else if (emailed.value?.skipped) {
        console.warn('[contact] e-mail skipped:', emailed.value.skipped);
      }
    } finally {
      setSending(false);
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <>
      <SEO title="Contact Us" description="Questions about an order, a product or a return? Contact the Surplus Store team." path="/contact" />
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Get in touch</h1>
        <p className="mt-2 text-ink-500">We usually reply within 24 hours.</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div className="card p-6 sm:p-8">
            {done ? (
              <div className="py-12 text-center">
                <h2 className="font-display text-2xl font-bold">Message received 🎉</h2>
                <p className="mt-2 text-sm text-ink-500">Thanks for writing to us — our team will get back to you shortly.</p>
                <button onClick={() => setDone(false)} className="btn-outline mt-6">Send another message</button>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <ErrorNote className="sm:col-span-2">{error}</ErrorNote>
                <div>
                  <label className="label" htmlFor="c-name">Your name *</label>
                  <input id="c-name" className={cx('field', errors.name && 'field-error')} value={form.name} onChange={set('name')} placeholder="Priya Sharma" />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>
                <div>
                  <label className="label" htmlFor="c-email">Email</label>
                  <input id="c-email" type="email" className={cx('field', errors.email && 'field-error')} value={form.email} onChange={set('email')} placeholder="you@example.com" />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>
                <div>
                  <label className="label" htmlFor="c-mobile">Mobile</label>
                  <input id="c-mobile" inputMode="numeric" className="field" value={form.mobile} onChange={set('mobile')} placeholder="98765 43210" />
                </div>
                <div>
                  <label className="label" htmlFor="c-subject">Subject</label>
                  <select id="c-subject" className="field" value={form.subject} onChange={set('subject')}>
                    {['General', 'Order issue', 'Return / exchange', 'Product question', 'Bulk order', 'Feedback'].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="c-message">Message *</label>
                  <textarea id="c-message" rows={5} className={cx('field resize-none', errors.message && 'field-error')} value={form.message} onChange={set('message')} placeholder="How can we help?" />
                  {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
                </div>
                <button type="submit" disabled={sending} className="btn-primary sm:col-span-2 py-3">
                  {sending ? <ButtonSpinner label="Sending…" /> : 'Send message'}
                </button>
              </form>
            )}
          </div>

          <aside className="space-y-3">
            {[
              { icon: Phone, label: 'Phone', value: '+91 98765 43210' },
              { icon: Mail, label: 'Email', value: 'care@surplusstore.in' },
              { icon: MapPin, label: 'Studio', value: '402, Textile Market, Surat, Gujarat 395002' },
              { icon: Clock, label: 'Support hours', value: 'Mon–Sat, 10 AM to 7 PM IST' },
            ].map((item) => (
              <div key={item.label} className="card flex items-start gap-3 p-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink-50">
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{item.label}</p>
                  <p className="text-sm font-medium">{item.value}</p>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </>
  );
}
