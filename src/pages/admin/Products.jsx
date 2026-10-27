import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageLoader, ErrorNote } from '../../components/Feedback';
import LazyImage from '../../components/LazyImage';
import api, { errMsg } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { inr, cx } from '../../utils/format';

/** Admin catalogue manager: search, paginate, create, edit and delete products. */
export default function Products() {
  const toast = useToast();
  const [data, setData] = useState({ items: [], pagination: { page: 1, pages: 0, total: 0, limit: 20 } });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/products', { params: { search: search || undefined, page, limit: 20 } });
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

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/products/${p._id}`);
      toast.success('Product deleted');
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const toggleActive = async (p) => {
    try {
      await api.put(`/admin/products/${p._id}`, { isActive: !p.isActive });
      setData((d) => ({ ...d, items: d.items.map((x) => (x._id === p._id ? { ...x, isActive: !p.isActive } : x)) }));
      toast.success(p.isActive ? 'Product hidden from store' : 'Product published');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products…"
            className="field py-2.5 pl-9"
          />
        </div>
        <Link to="/admin/products/new" className="btn-primary">
          <Plus className="h-4 w-4" /> Add product
        </Link>
      </div>

      <ErrorNote>{error}</ErrorNote>

      <div className="card overflow-hidden">
        {loading ? (
          <PageLoader label="Loading products…" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase text-ink-400">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data.items.map((p) => {
                  const stock = (p.sizes || []).reduce((s, x) => s + x.stock, 0);
                  return (
                    <tr key={p._id} className="hover:bg-ink-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 shrink-0">
                            <LazyImage src={p.images?.[0]?.url} alt={p.title} ratio="aspect-[4/5]" className="rounded-lg" label={p.title} />
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-1 font-medium">{p.title}</p>
                            <p className="text-xs text-ink-400 capitalize">{p.gender}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-600">{p.category?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <b>{inr(p.price)}</b>
                        {p.mrp > p.price && <span className="ml-1 text-xs text-ink-400 line-through">{inr(p.mrp)}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cx('font-semibold', stock === 0 ? 'text-red-600' : stock <= 10 ? 'text-amber-600' : 'text-ink-700')}>
                          {stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(p)}
                          className={cx('rounded-full px-2.5 py-1 text-[11px] font-bold', p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-ink-100 text-ink-500')}
                        >
                          {p.isActive ? 'Live' : 'Hidden'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link to={`/admin/products/${p._id}`} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100" aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button onClick={() => remove(p)} className="rounded-lg p-2 text-ink-500 hover:bg-red-50 hover:text-red-600" aria-label="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {data.items.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-16 text-center text-ink-400">No products found.</td></tr>
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
