import { useState } from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import SEO from '../components/SEO';
import { ButtonSpinner, ErrorNote } from '../components/Feedback';
import { useToast } from '../context/ToastContext';
import api, { errMsg } from '../api/client';
import { cx } from '../utils/format';

const EMPTY = { name: '', email: '', mobile: '', subject: 'General', message: '' };

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
      const { data } = await api.post('/contact', form);
      toast.success(data.message);
      setForm(EMPTY);
      setDone(true);
    } catch (err) {
      setError(errMsg(err));
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
