import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import { PageLoader, ErrorNote, ButtonSpinner } from '../../components/Feedback';
import api, { errMsg } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { inr, formatDate, cx } from '../../utils/format';

const EMPTY = { code: '', description: '', type: 'percent', value: '', minOrder: 0, maxDiscount: 0, active: true, expiresAt: '', usageLimit: 0, perUserLimit: 1 };

/** Coupon manager: create, edit, toggle and delete discount codes. */
export default function Coupons() {
  const toast = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/admin/coupons');
      setCoupons(data.data || []);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => { setForm(EMPTY); setEditing('new'); };
  const openEdit = (c) => {
    setForm({
      code: c.code,
      description: c.description || '',
      type: c.type,
      value: String(c.value),
      minOrder: c.minOrder,
      maxDiscount: c.maxDiscount,
      active: c.active,
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
      usageLimit: c.usageLimit,
      perUserLimit: c.perUserLimit,
    });
    setEditing(c._id);
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (form.code.trim().length < 3) return setError('Code must be at least 3 characters');
    if (Number(form.value) <= 0) return setError('Discount value must be greater than 0');

    const payload = {
      ...form,
      code: form.code.toUpperCase().trim(),
      value: Number(form.value),
      minOrder: Number(form.minOrder),
      maxDiscount: Number(form.maxDiscount),
      usageLimit: Number(form.usageLimit),
      perUserLimit: Number(form.perUserLimit),
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    };

    setSaving(true);
    try {
      if (editing === 'new') {
        const { data } = await api.post('/admin/coupons', payload);
        setCoupons((c) => [data.data, ...c]);
        toast.success('Coupon created');
      } else {
        const { data } = await api.put(`/admin/coupons/${editing}`, payload);
        setCoupons((c) => c.map((x) => (x._id === editing ? data.data : x)));
        toast.success('Coupon updated');
      }
      setEditing(null);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return;
    try {
      await api.delete(`/admin/coupons/${c._id}`);
      setCoupons((list) => list.filter((x) => x._id !== c._id));
      toast.success('Coupon deleted');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const toggleActive = async (c) => {
    try {
      const { data } = await api.put(`/admin/coupons/${c._id}`, { active: !c.active });
      setCoupons((list) => list.map((x) => (x._id === c._id ? data.data : x)));
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">{coupons.length} coupon code{coupons.length === 1 ? '' : 's'}</p>
        {editing !== 'new' && (
          <button onClick={openNew} className="btn-primary"><Plus className="h-4 w-4" /> New coupon</button>
        )}
      </div>

      <ErrorNote>{error}</ErrorNote>

      {editing && (
        <form onSubmit={save} className="card grid gap-4 p-5 sm:grid-cols-3">
          <div>
            <label className="label">Code *</label>
            <input className="field uppercase" value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="DIWALI25" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <input className="field" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="25% off festive orders" />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="field" value={form.type} onChange={(e) => set('type', e.target.value)}>
              <option value="percent">Percentage (%)</option>
              <option value="flat">Flat ₹</option>
            </select>
          </div>
          <div>
            <label className="label">{form.type === 'percent' ? 'Percentage' : 'Amount (₹)'} *</label>
            <input type="number" min="0" className="field" value={form.value} onChange={(e) => set('value', e.target.value)} placeholder={form.type === 'percent' ? '10' : '200'} />
          </div>
          <div>
            <label className="label">Max discount (₹)</label>
            <input type="number" min="0" className="field" value={form.maxDiscount} onChange={(e) => set('maxDiscount', e.target.value)} placeholder="0 = no cap" />
          </div>
          <div>
            <label className="label">Min order (₹)</label>
            <input type="number" min="0" className="field" value={form.minOrder} onChange={(e) => set('minOrder', e.target.value)} />
          </div>
          <div>
            <label className="label">Usage limit</label>
            <input type="number" min="0" className="field" value={form.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} placeholder="0 = unlimited" />
          </div>
          <div>
            <label className="label">Expires on</label>
            <input type="date" className="field" value={form.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} />
          </div>
          <label className="flex items-center gap-2 self-end pb-3 text-sm font-medium sm:col-span-3">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="h-4 w-4 rounded border-ink-300 text-ink-900 focus:ring-ink-900" />
            Active (customers can apply this code)
          </label>
          <div className="flex gap-2 sm:col-span-3">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? <ButtonSpinner /> : editing === 'new' ? 'Create coupon' : 'Save changes'}</button>
            <button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <PageLoader label="Loading coupons…" />
      ) : coupons.length === 0 ? (
        <div className="card py-16 text-center text-ink-400">No coupons yet. Create your first one!</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c) => {
            const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
            return (
              <div key={c._id} className={cx('card p-5', !c.active && 'opacity-60')}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-lg font-bold tracking-wide">{c.code}</p>
                    <p className="mt-0.5 text-xs text-ink-500">{c.description || '—'}</p>
                  </div>
                  <button onClick={() => remove(c)} className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 text-2xl font-bold">
                  {c.type === 'percent' ? `${c.value}%` : inr(c.value)}
                  <span className="ml-1 text-xs font-medium text-ink-400">off</span>
                </p>
                <dl className="mt-2 space-y-1 text-xs text-ink-500">
                  <div className="flex justify-between"><dt>Min order</dt><dd>{c.minOrder ? inr(c.minOrder) : '—'}</dd></div>
                  {c.type === 'percent' && <div className="flex justify-between"><dt>Max discount</dt><dd>{c.maxDiscount ? inr(c.maxDiscount) : 'No cap'}</dd></div>}
                  <div className="flex justify-between"><dt>Used</dt><dd>{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</dd></div>
                  <div className="flex justify-between"><dt>Expires</dt><dd>{c.expiresAt ? formatDate(c.expiresAt) : 'Never'}</dd></div>
                </dl>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => toggleActive(c)} className={cx('rounded-full px-2.5 py-1 text-[11px] font-bold', expired ? 'bg-ink-100 text-ink-400' : c.active ? 'bg-emerald-100 text-emerald-800' : 'bg-ink-100 text-ink-500')}>
                    {expired ? 'Expired' : c.active ? 'Active' : 'Paused'}
                  </button>
                  <button onClick={() => openEdit(c)} className="btn-ghost px-3 py-1 text-xs"><Pencil className="h-3 w-3" /> Edit</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <button onClick={() => setEditing(null)} className="fixed bottom-4 right-4 rounded-full bg-ink-900 p-3 text-sand-50 shadow-pop lg:hidden" aria-label="Close form">
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
