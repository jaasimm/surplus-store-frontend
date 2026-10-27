import { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageLoader, ErrorNote } from '../../components/Feedback';
import api, { errMsg } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { inr, formatDate, cx } from '../../utils/format';

/** Customer directory with spend, order counts and enable/disable. */
export default function Customers() {
  const toast = useToast();
  const [data, setData] = useState({ items: [], pagination: { page: 1, pages: 0, total: 0, limit: 20 } });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/customers', { params: { search: search || undefined, page, limit: 20 } });
      setData(data.data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  const toggleActive = async (c) => {
    try {
      await api.patch(`/admin/customers/${c._id}`, { isActive: !c.isActive });
      toast.success(c.isActive ? 'Customer disabled' : 'Customer enabled');
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search mobile, name or email…"
          className="field py-2.5 pl-9"
        />
      </div>

      <ErrorNote>{error}</ErrorNote>

      <div className="card overflow-hidden">
        {loading ? (
          <PageLoader label="Loading customers…" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase text-ink-400">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Total spent</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data.items.map((c) => (
                  <tr key={c._id} className="hover:bg-ink-50/60">
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.name || '—'}</p>
                      <p className="text-xs tabular-nums text-ink-500">{c.mobile}{c.email ? ` · ${c.email}` : ''}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3 tabular-nums">{c.orders}</td>
                    <td className="px-4 py-3 font-semibold">{inr(c.spent)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(c)}
                        className={cx('rounded-full px-2.5 py-1 text-[11px] font-bold', c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700')}
                      >
                        {c.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-16 text-center text-ink-400">No customers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data.pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button className="btn-outline px-3 py-2" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm text-ink-500">Page {data.pagination.page} of {data.pagination.pages}</span>
          <button className="btn-outline px-3 py-2" disabled={page >= data.pagination.pages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}
