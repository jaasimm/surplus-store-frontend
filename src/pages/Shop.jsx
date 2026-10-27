import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronLeft, ChevronRight, Search as SearchIcon } from 'lucide-react';
import SEO from '../components/SEO';
import ProductCard from '../components/ProductCard';
import { ProductSkeleton, ErrorNote } from '../components/Feedback';
import api, { errMsg } from '../api/client';
import { cx, inr } from '../utils/format';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2-3Y', '4-5Y', '6-7Y', '8-9Y'];
const COLORS = ['Black', 'White', 'Blue', 'Navy', 'Grey', 'Charcoal', 'Red', 'Pink', 'Green', 'Olive', 'Beige', 'Maroon', 'Indigo', 'Mustard'];
const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'popularity', label: 'Most popular' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'discount', label: 'Biggest discount' },
];
const PRICE_BANDS = [
  { label: 'Under ₹500', min: 0, max: 499 },
  { label: '₹500 – ₹999', min: 500, max: 999 },
  { label: '₹1000 – ₹1999', min: 1000, max: 1999 },
  { label: '₹2000 & above', min: 2000, max: 100000 },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ items: [], pagination: { page: 1, pages: 0, total: 0, limit: 12 } });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileFilters, setMobileFilters] = useState(false);

  /* ---- filter state mirrored into the URL (shareable, back-button friendly) ---- */
  const active = useMemo(
    () => ({
      search: params.get('search') || '',
      gender: params.get('gender') || '',
      category: params.getAll('category'),
      size: params.getAll('size'),
      color: params.getAll('color'),
      sort: params.get('sort') || 'newest',
      page: Number(params.get('page') || 1),
      minPrice: params.get('minPrice') ? Number(params.get('minPrice')) : undefined,
      maxPrice: params.get('maxPrice') ? Number(params.get('maxPrice')) : undefined,
    }),
    [params]
  );

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    next.delete('page'); // any filter change resets pagination
    if (Array.isArray(value)) {
      next.delete(key);
      value.forEach((v) => next.append(key, v));
    } else if (value === '' || value === undefined || value === null) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setParams(next);
  };

  /** Apply several filters in a single URL update (avoids stale-state races). */
  const setMany = (updates) => {
    const next = new URLSearchParams(params);
    next.delete('page');
    Object.entries(updates).forEach(([key, value]) => {
      next.delete(key);
      if (value === '' || value === undefined || value === null) return;
      if (Array.isArray(value)) value.forEach((v) => next.append(key, v));
      else next.set(key, String(value));
    });
    setParams(next);
  };

  const applyPriceBand = (band) => {
    const selected = active.minPrice === band.min && active.maxPrice === band.max;
    setMany({ minPrice: selected ? '' : band.min, maxPrice: selected ? '' : band.max });
  };

  const resetPrice = () => setMany({ minPrice: '', maxPrice: '' });

  const toggleInArray = (key, value) => {
    const current = active[key];
    setFilter(key, current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);
  };

  const clearAll = () => setParams(new URLSearchParams(active.search ? { search: active.search } : {}));

  const activeCount =
    active.category.length + active.size.length + active.color.length + (active.gender ? 1 : 0) + (active.minPrice !== undefined ? 1 : 0);

  /* ------------------------------------------------------------- fetch */
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    const query = {
      search: active.search || undefined,
      gender: active.gender || undefined,
      category: active.category.length ? active.category : undefined,
      size: active.size.length ? active.size : undefined,
      color: active.color.length ? active.color : undefined,
      minPrice: active.minPrice,
      maxPrice: active.maxPrice,
      sort: active.sort,
      page: active.page,
      limit: 12,
    };
    api
      .get('/products', { params: query })
      .then((res) => alive && setData(res.data.data))
      .catch((err) => alive && setError(errMsg(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data || [])).catch(() => {});
  }, []);

  /* ---------------------------------------------------------- filter UI */
  const FilterPanel = (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide">Filters</h3>
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-xs font-semibold text-red-600 underline underline-offset-2">
            Clear all
          </button>
        )}
      </div>

      {/* gender */}
      <div>
        <h4 className="label">Shop for</h4>
        <div className="flex flex-wrap gap-2">
          {['men', 'women', 'kids'].map((g) => (
            <button
              key={g}
              onClick={() => setFilter('gender', active.gender === g ? '' : g)}
              className={cx('chip capitalize', active.gender === g && 'chip-active')}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* category */}
      <div>
        <h4 className="label">Category</h4>
        <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
          {categories.map((c) => (
            <label key={c.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 text-sm hover:bg-ink-50">
              <input
                type="checkbox"
                checked={active.category.includes(c.slug)}
                onChange={() => toggleInArray('category', c.slug)}
                className="h-4 w-4 rounded border-ink-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-ink-700">{c.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* size */}
      <div>
        <h4 className="label">Size</h4>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button key={s} onClick={() => toggleInArray('size', s)} className={cx('chip min-w-[2.75rem] justify-center', active.size.includes(s) && 'chip-active')}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* color */}
      <div>
        <h4 className="label">Colour</h4>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button key={c} onClick={() => toggleInArray('color', c)} className={cx('chip', active.color.includes(c) && 'chip-active')}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* price */}
      <div>
        <h4 className="label">Price</h4>
        <div className="space-y-1.5">
          {PRICE_BANDS.map((band) => {
            const selected = active.minPrice === band.min && active.maxPrice === band.max;
            return (
              <button
                key={band.label}
                onClick={() => applyPriceBand(band)}
                className={cx('block w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition hover:bg-ink-50', selected && 'bg-blue-600 font-semibold text-white hover:bg-blue-700')}
              >
                {band.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={active.minPrice ?? ''}
            onChange={(e) => setFilter('minPrice', e.target.value)}
            className="field px-3 py-2 text-sm"
          />
          <span className="text-ink-400">–</span>
          <input
            type="number"
            placeholder="Max"
            value={active.maxPrice ?? ''}
            onChange={(e) => setFilter('maxPrice', e.target.value)}
            className="field px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <SEO
        title={active.search ? `Search: ${active.search}` : 'Shop'}
        description="Browse the full Surplus Store catalogue — filter by category, size, colour and price, and sort by newest, popularity or price."
        path={`/shop${params.toString() ? `?${params}` : ''}`}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* breadcrumb */}
        <nav className="mb-4 text-xs text-ink-400">
          <Link to="/" className="hover:text-ink-700">Home</Link> / <span className="text-ink-700">Shop</span>
          {active.gender && ` / ${active.gender[0].toUpperCase()}${active.gender.slice(1)}`}
        </nav>

        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">
              {active.search ? `Results for “${active.search}”` : active.gender ? `${active.gender[0].toUpperCase()}${active.gender.slice(1)}’s Collection` : 'All products'}
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              {loading ? 'Loading…' : `${data.pagination.total} product${data.pagination.total === 1 ? '' : 's'}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setMobileFilters(true)} className="btn-outline py-2 lg:hidden">
              <SlidersHorizontal className="h-4 w-4" /> Filters
              {activeCount > 0 && <span className="ml-1 rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">{activeCount}</span>}
            </button>
            <select
              value={active.sort}
              onChange={(e) => setFilter('sort', e.target.value)}
              aria-label="Sort products"
              className="field w-auto px-3 py-2"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* active filter chips */}
        {activeCount > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {active.category.map((c) => {
              const cat = categories.find((x) => x.slug === c);
              return (
                <button key={c} onClick={() => toggleInArray('category', c)} className="chip chip-active">
                  {cat?.name || c} <X className="h-3 w-3" />
                </button>
              );
            })}
            {active.gender && (
              <button onClick={() => setFilter('gender', '')} className="chip chip-active capitalize">
                {active.gender} <X className="h-3 w-3" />
              </button>
            )}
            {active.size.map((s) => (
              <button key={s} onClick={() => toggleInArray('size', s)} className="chip chip-active">
                Size {s} <X className="h-3 w-3" />
              </button>
            ))}
            {active.color.map((c) => (
              <button key={c} onClick={() => toggleInArray('color', c)} className="chip chip-active">
                {c} <X className="h-3 w-3" />
              </button>
            ))}
            {active.minPrice !== undefined && (
              <button onClick={resetPrice} className="chip chip-active">
                {inr(active.minPrice)}–{inr(active.maxPrice)} <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-8">
          {/* desktop sidebar */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-32">{FilterPanel}</div>
          </aside>

          <div className="flex-1">
            <ErrorNote className="mb-4">{error}</ErrorNote>

            {loading ? (
              <ProductSkeleton count={9} />
            ) : data.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-200 py-20 text-center">
                <SearchIcon className="h-8 w-8 text-ink-300" />
                <h2 className="mt-3 font-display text-xl font-bold">No products found</h2>
                <p className="mt-1 max-w-sm text-sm text-ink-500">
                  Try removing some filters or searching for something else like “t-shirt” or “jeans”.
                </p>
                <button onClick={clearAll} className="btn-primary mt-5">Clear all filters</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6">
                  {data.items.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
                </div>

                {/* pagination */}
                {data.pagination.pages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <button
                      className="btn-outline px-3 py-2"
                      disabled={active.page <= 1}
                      onClick={() => setFilter('page', active.page - 1)}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: data.pagination.pages })
                      .map((_, i) => i + 1)
                      .filter((p) => p === 1 || p === data.pagination.pages || Math.abs(p - active.page) <= 2)
                      .map((p, idx, arr) => (
                        <span key={p} className="flex items-center">
                          {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-ink-400">…</span>}
                          <button
                            onClick={() => setFilter('page', p)}
                            className={cx(
                              'h-9 w-9 rounded-lg text-sm font-semibold transition',
                              p === active.page ? 'bg-blue-600 text-white shadow-sm' : 'text-ink-700 hover:bg-ink-100'
                            )}
                          >
                            {p}
                          </button>
                        </span>
                      ))}
                    <button
                      className="btn-outline px-3 py-2"
                      disabled={active.page >= data.pagination.pages}
                      onClick={() => setFilter('page', active.page + 1)}
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* mobile filter drawer */}
      {mobileFilters && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-ink-900/50" onClick={() => setMobileFilters(false)} />
          <div className="safe-bottom absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-pop">
            <div className="sticky -top-6 -mx-6 mb-5 flex items-center justify-between border-b border-ink-100 bg-white px-6 pb-3 pt-1">
              <span className="font-display text-lg font-bold">Filters</span>
              <button onClick={() => setMobileFilters(false)} aria-label="Close filters"><X className="h-5 w-5" /></button>
            </div>
            {FilterPanel}
            <button onClick={() => setMobileFilters(false)} className="btn-primary mt-8 w-full py-3">
              Show {data.pagination.total} products
            </button>
          </div>
        </div>
      )}
    </>
  );
}
