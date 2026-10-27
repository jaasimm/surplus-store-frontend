import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Upload, Plus, X, Loader2 } from 'lucide-react';
import { PageLoader, ErrorNote, ButtonSpinner } from '../../components/Feedback';
import api, { errMsg } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { inr, cx } from '../../utils/format';

const EMPTY = {
  title: '',
  brand: 'Surplus',
  category: '',
  gender: 'unisex',
  description: '',
  price: '',
  mrp: '',
  colors: '',
  tags: '',
  images: [],
  sizes: [{ size: 'M', stock: 10 }],
  isFeatured: false,
  isActive: true,
};

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2-3Y', '4-5Y', '6-7Y', '8-9Y'];

/** Create / edit a product (multiple images, per-size stock, discount, visibility). */
export default function ProductForm() {
  const { id } = useParams(); // undefined when creating
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [urlInput, setUrlInput] = useState('');

  /* categories for the dropdown */
  useEffect(() => {
    api.get('/categories').then((res) => {
      setCategories(res.data.data || []);
      setForm((f) => (f.category ? f : { ...f, category: res.data.data?.[0]?.id || '' }));
    }).catch(() => {});
  }, []);

  /* existing product when editing */
  useEffect(() => {
    if (!id) return undefined;
    let alive = true;
    api
      .get(`/admin/products/${id}`)
      .then(({ data }) => {
        if (!alive) return;
        const p = data.data;
        setForm({
          title: p.title,
          brand: p.brand || 'Surplus',
          category: p.category?._id || p.category || '',
          gender: p.gender || 'unisex',
          description: p.description || '',
          price: String(p.price ?? ''),
          mrp: String(p.mrp ?? ''),
          colors: (p.colors || []).join(', '),
          tags: (p.tags || []).join(', '),
          images: (p.images || []).map((i) => ({ url: i.url, alt: i.alt || '' })),
          sizes: (p.sizes || []).length ? p.sizes : [{ size: 'M', stock: 10 }],
          isFeatured: Boolean(p.isFeatured),
          isActive: p.isActive !== false,
        });
      })
      .catch((err) => setError(errMsg(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  /* --------------------------------------------------------- images */
  const addUrl = () => {
    const url = urlInput.trim();
    if (!/^https?:\/\//.test(url) && !url.startsWith('/uploads/')) return setError('Enter a valid image URL');
    set('images', [...form.images, { url, alt: form.title }]);
    setUrlInput('');
    setError('');
  };

  const uploadFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('images', f));
      const { data } = await api.post('/admin/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      set('images', [...form.images, ...data.data.urls.map((url) => ({ url, alt: form.title }))]);
      toast.success(`${files.length} image(s) uploaded`);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (idx) => set('images', form.images.filter((_, i) => i !== idx));

  /* ---------------------------------------------------------- sizes */
  const updateSize = (idx, key, value) =>
    set('sizes', form.sizes.map((s, i) => (i === idx ? { ...s, [key]: key === 'stock' ? Math.max(0, Number(value) || 0) : value.toUpperCase() } : s)));

  const addSize = () => {
    const used = form.sizes.map((s) => s.size);
    const next = SIZE_OPTIONS.find((s) => !used.includes(s)) || 'M';
    set('sizes', [...form.sizes, { size: next, stock: 10 }]);
  };

  /* --------------------------------------------------------- submit */
  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.title.trim().length < 3) return setError('Title must be at least 3 characters');
    if (form.description.trim().length < 10) return setError('Description must be at least 10 characters');
    if (!form.category) return setError('Choose a category');
    if (!form.images.length) return setError('Add at least one image');
    if (!form.sizes.length) return setError('Add at least one size');
    if (Number(form.mrp) < Number(form.price)) return setError('MRP cannot be lower than the selling price');

    const payload = {
      title: form.title.trim(),
      brand: form.brand,
      category: form.category,
      gender: form.gender,
      description: form.description.trim(),
      price: Number(form.price),
      mrp: Number(form.mrp || form.price),
      images: form.images,
      sizes: form.sizes,
      colors: form.colors.split(',').map((c) => c.trim()).filter(Boolean),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      isFeatured: form.isFeatured,
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (id) {
        await api.put(`/admin/products/${id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/admin/products', payload);
        toast.success('Product created');
      }
      navigate('/admin/products');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader label="Loading product…" />;

  const discount = Number(form.mrp) > Number(form.price) && Number(form.mrp) > 0
    ? Math.round(((Number(form.mrp) - Number(form.price)) / Number(form.mrp)) * 100)
    : 0;

  return (
    <div className="max-w-4xl">
      <Link to="/admin/products" className="text-xs text-ink-400 hover:text-ink-700">← Back to products</Link>
      <h2 className="mt-1 font-display text-2xl font-bold">{id ? 'Edit product' : 'Add new product'}</h2>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <ErrorNote>{error}</ErrorNote>

        {/* ------------------------------------------------- basics */}
        <section className="card space-y-4 p-5">
          <h3 className="font-semibold">Basics</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Title *</label>
              <input className="field" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Premium Cotton Crew Neck Tee" />
            </div>
            <div>
              <label className="label">Brand</label>
              <input className="field" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
            </div>
            <div>
              <label className="label">Category *</label>
              <select className="field" value={form.category} onChange={(e) => set('category', e.target.value)}>
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Shop for</label>
              <select className="field" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                {['men', 'women', 'kids', 'unisex'].map((g) => (
                  <option key={g} value={g} className="capitalize">{g}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description *</label>
              <textarea rows={5} className="field resize-none" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Fabric, fit, wash care…" />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------- pricing */}
        <section className="card p-5">
          <h3 className="font-semibold">Pricing</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Selling price (₹) *</label>
              <input type="number" min="0" className="field" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="499" />
            </div>
            <div>
              <label className="label">MRP (₹) *</label>
              <input type="number" min="0" className="field" value={form.mrp} onChange={(e) => set('mrp', e.target.value)} placeholder="999" />
            </div>
            <div>
              <label className="label">Discount</label>
              <div className="field bg-ink-50 text-ink-600">{discount}% off · customer saves {inr(Math.max(0, Number(form.mrp) - Number(form.price)))}</div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------- variants */}
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Sizes & stock *</h3>
            <button type="button" onClick={addSize} className="btn-ghost px-3 py-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> Add size
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {form.sizes.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select value={s.size} onChange={(e) => updateSize(idx, 'size', e.target.value)} className="field w-28">
                  {Array.from(new Set([...SIZE_OPTIONS, s.size])).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  value={s.stock}
                  onChange={(e) => updateSize(idx, 'stock', e.target.value)}
                  className="field w-32"
                  placeholder="Stock"
                />
                <span className="text-xs text-ink-400">units in stock</span>
                <button
                  type="button"
                  onClick={() => set('sizes', form.sizes.filter((_, i) => i !== idx))}
                  className="ml-auto rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove size"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Colours (comma separated)</label>
              <input className="field" value={form.colors} onChange={(e) => set('colors', e.target.value)} placeholder="Black, Olive, Sand" />
            </div>
            <div>
              <label className="label">Tags (comma separated)</label>
              <input className="field" value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="summer, cotton, new" />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------- images */}
        <section className="card p-5">
          <h3 className="font-semibold">Images * (first image is the cover)</h3>

          <div className="mt-3 flex flex-wrap gap-3">
            {form.images.map((img, idx) => (
              <div key={idx} className="group relative w-24 overflow-hidden rounded-xl border border-ink-200">
                <img src={img.url} alt={img.alt || `Product ${idx + 1}`} className="aspect-[4/5] w-full object-cover" />
                {idx === 0 && <span className="absolute left-1 top-1 rounded bg-ink-900 px-1.5 py-0.5 text-[9px] font-bold text-sand-50">COVER</span>}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-600 opacity-0 transition group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Upload from device</label>
              <label className={cx('btn-outline w-full cursor-pointer py-2.5', uploading && 'pointer-events-none opacity-60')}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? 'Uploading…' : 'Choose images'}
                <input type="file" accept="image/*" multiple onChange={uploadFiles} className="hidden" />
              </label>
              <p className="mt-1 text-[11px] text-ink-400">JPEG / PNG / WEBP, up to 5 MB each</p>
            </div>
            <div>
              <label className="label">…or paste an image URL</label>
              <div className="flex gap-2">
                <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://…" className="field" />
                <button type="button" onClick={addUrl} className="btn-outline px-4">Add</button>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------- options */}
        <section className="card flex flex-wrap items-center gap-6 p-5">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="h-4 w-4 rounded border-ink-300 text-ink-900 focus:ring-ink-900" />
            Published (visible in the store)
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="h-4 w-4 rounded border-ink-300 text-ink-900 focus:ring-ink-900" />
            Featured on the home page
          </label>
        </section>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary px-8 py-3">
            {saving ? <ButtonSpinner label="Saving…" /> : id ? 'Update product' : 'Create product'}
          </button>
          <Link to="/admin/products" className="btn-ghost px-6">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
