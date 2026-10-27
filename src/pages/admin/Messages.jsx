import { useEffect, useState } from 'react';
import { Mail, Check } from 'lucide-react';
import { PageLoader, ErrorNote } from '../../components/Feedback';
import api, { errMsg } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { formatDateTime, cx } from '../../utils/format';

/** Contact form submissions. */
export default function Messages() {
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/admin/contacts');
      setMessages(data.data || []);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resolve = async (m) => {
    try {
      await api.patch(`/admin/contacts/${m._id}`);
      setMessages((list) => list.map((x) => (x._id === m._id ? { ...x, resolved: true } : x)));
      toast.success('Marked as resolved');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  if (loading) return <PageLoader label="Loading messages…" />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-500">{messages.filter((m) => !m.resolved).length} unresolved message(s)</p>
      <ErrorNote>{error}</ErrorNote>

      {messages.length === 0 ? (
        <div className="card py-16 text-center text-ink-400">No messages yet.</div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <article key={m._id} className={cx('card p-5', m.resolved && 'opacity-60')}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-xs text-ink-500">
                    {m.email && `${m.email} · `}{m.mobile && `${m.mobile} · `}{formatDateTime(m.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-bold text-ink-700">{m.subject}</span>
                  {m.resolved ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">Resolved</span>
                  ) : (
                    <button onClick={() => resolve(m)} className="btn-outline px-3 py-1.5 text-xs">
                      <Check className="h-3.5 w-3.5" /> Resolve
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line rounded-xl bg-ink-50 p-3 text-sm text-ink-700">{m.message}</p>
              {m.email && (
                <a href={`mailto:${m.email}`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold underline underline-offset-2">
                  <Mail className="h-3.5 w-3.5" /> Reply by email
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
