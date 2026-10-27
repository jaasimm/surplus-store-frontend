import { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { ButtonSpinner, ErrorNote } from '../../components/Feedback';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cx, formatDate } from '../../utils/format';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) return setError('Please enter your name');
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address');
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), email: email.trim() });
      toast.success('Profile updated');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h2 className="font-display text-lg font-bold">Profile details</h2>
        <ErrorNote className="mt-3">{error}</ErrorNote>

        <form onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Mobile number</label>
            <div className="field flex items-center gap-2 bg-ink-50 text-ink-500">
              <Smartphone className="h-4 w-4" />
              <span className="tabular-nums">{user?.mobile}</span>
              <span className="ml-auto text-[11px]">verified ✓</span>
            </div>
            <p className="mt-1 text-[11px] text-ink-400">Your mobile number is your login and cannot be changed.</p>
          </div>

          <div>
            <label className="label" htmlFor="p-name">Full name</label>
            <input id="p-name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Sharma" />
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="p-email">Email (for order updates)</label>
            <input id="p-email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>

          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className={cx('btn-primary')}>
              {saving ? <ButtonSpinner label="Saving…" /> : 'Save changes'}
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-semibold">Member since</h3>
          <p className="mt-1 text-sm text-ink-500">{formatDate(user?.createdAt)}</p>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold">Saved addresses</h3>
          <p className="mt-1 text-sm text-ink-500">{user?.addresses?.length || 0} saved</p>
        </div>
      </section>
    </div>
  );
}
