import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import { PageLoader, ErrorNote, ButtonSpinner } from '../../components/Feedback';
import LazyImage from '../../components/LazyImage';
import api, { errMsg } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { cx } from '../../utils/format';

const EMPTY = { name: '', group: 'other', image: '', description: '', isActive: true, sort: 0 };

/** Category manager (name, home-page group, image, ordering). */
export default function Categories() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.data || []);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (form.name.trim().length < 2) return setError('Category name is too short');
    setSaving(true);
    try {
      if (editing === 'new') {
        await api.post('/categories', form);
        toast.success('Category created');
      } else {
        await api.put(`/categories/${editing}`, form);
        toast.success('Category updated');
      }
      setEditing(null);
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"? Products using it will keep their data but show no category.`)) return;
    try {
      await api.delete(`/categories/${c._id}`);
      toast.success('Category deleted');
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">{categories.length} categories</p>
        {editing !== 'new' && (
          <button onClick={() => { setForm(EMPTY); setEditing('new'); }} className="btn-primary">
            <Plus className="h-4 w-4" /> New category
          </button>
        )}
      </div>

      <ErrorNote>{error}</ErrorNote>

      {editing && (
        <form onSubmit={save} className="card grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <label className="label">Name *</label>
            <input className="field" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="T-Shirts" />
          </div>
          <div>
            <label className="label">Home-page group</label>
            <select className="field" value={form.group} onChange={(e) => set('group', e.target.value)}>
              {['men', 'women', 'kids', 'accessories', 'other'].map((g) => (
                <option key={g} value={g} className="capitalize">{g}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Image URL</label>
            <input className="field" value={form.image} onChange={(e) => set('image', e.target.value)} placeholder="https://… or /uploads/…" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <input className="field" value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div>
            <label className="label">Sort order</label>
            <input type="number" className="field" value={form.sort} onChange={(e) => set('sort', Number(e.target.value))} />
          </div>
          <label className="flex items-center gap-2 self-end pb-3 text-sm font-medium">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="h-4 w-4 rounded border-ink-300 text-ink-900 focus:ring-ink-900" />
            Visible in the store
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? <ButtonSpinner /> : 'Save category'}</button>
            <button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <PageLoader label="Loading categories…" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className={cx('card p-4', !c.isActive && 'opacity-60')}>
              <div className="flex gap-3">
                <div className="w-16 shrink-0">
                  <LazyImage src={c.image} alt={c.name} ratio="aspect-square" className="rounded-xl" label={c.name} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-ink-400">/{c.slug} · {c.group}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => { setForm({ name: c.name, group: c.group, image: c.image, description: c.description, isActive: c.isActive, sort: c.sort }); setEditing(c.id); }} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100" aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(c)} className="rounded-lg p-1.5 text-ink-500 hover:bg-red-50 hover:text-red-600" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
