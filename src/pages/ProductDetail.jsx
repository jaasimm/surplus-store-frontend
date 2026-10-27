import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Heart, ShoppingBag, Truck, RotateCcw, ShieldCheck, Check, ChevronDown, MapPin } from 'lucide-react';
import SEO from '../components/SEO';
import LazyImage from '../components/LazyImage';
import Rating from '../components/Rating';
import QuantityStepper from '../components/QuantityStepper';
import ProductCard from '../components/ProductCard';
import { PageLoader, ErrorNote, ButtonSpinner } from '../components/Feedback';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { errMsg } from '../api/client';
import { inr, cx, formatDate } from '../utils/format';

const DELIVERY_DAYS = 4;

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem, busyId } = useCart();
  const { user, isAuthenticated, requireLogin, refreshUser } = useAuth();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [openPanel, setOpenPanel] = useState('description');
  const [pin, setPin] = useState('');
  const [pinResult, setPinResult] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotFound(false);
    setActiveImg(0);
    setSize('');
    setColor('');
    setQty(1);

    (async () => {
      try {
        const { data } = await api.get(`/products/${slug}`);
        if (!alive) return;
        const p = data.data;
        setProduct(p);
        // preselect the first available size/colour
        setSize(p.sizes?.find((s) => s.stock > 0)?.size || '');
        setColor(p.colors?.[0] || '');
        api
          .get(`/products/${slug}/related`)
          .then((res) => alive && setRelated(res.data.data || []))
          .catch(() => {});
      } catch (err) {
        if (alive && err.response?.status === 404) setNotFound(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    window.scrollTo({ top: 0 });
  }, [slug]);

  const selectedVariant = useMemo(
    () => product?.sizes?.find((s) => s.size === size),
    [product, size]
  );

  if (loading) return <PageLoader label="Loading product…" />;

  if (notFound || !product) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Product not found</h1>
        <p className="mt-2 text-ink-500">This item may have been removed or the link is incorrect.</p>
        <Link to="/shop" className="btn-primary mt-6">Continue shopping</Link>
      </div>
    );
  }

  const wished = Boolean(user?.wishlist?.includes?.(product.id));
  const eta = new Date(Date.now() + DELIVERY_DAYS * 86400000);
  const outOfStock = !product.inStock;

  const handleAdd = async (thenGo = false) => {
    if (!size) return toast.error('Please select a size');
    const ok = await addItem({ productId: product.id, size, color, qty });
    if (ok && thenGo) navigate('/checkout');
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated) return requireLogin('Login to save favourites');
    try {
      const { data } = await api.post('/users/wishlist', { productId: product.id });
      await refreshUser();
      toast.info(data?.message);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const checkPincode = () => {
    if (!/^\d{6}$/.test(pin)) return setPinResult('Enter a valid 6-digit pincode');
    const blocked = ['682001', '744101']; // demo: a couple of remote pincodes show as COD-unavailable
    setPinResult(
      blocked.includes(pin)
        ? 'Sorry, we do not deliver to this pincode yet.'
        : `Delivery by ${formatDate(eta)} · COD available · Free above ₹999`
    );
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: product.images?.map((i) => i.url),
    description: product.description,
    brand: { '@type': 'Brand', name: product.brand },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.price,
      availability: outOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      url: `https://surplusstore.in/product/${product.slug}`,
    },
    aggregateRating: product.numReviews ? { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.numReviews } : undefined,
  };

  return (
    <>
      <SEO
        title={product.title}
        description={`${product.title} — ${product.description.slice(0, 140)}`}
        path={`/product/${product.slug}`}
        image={product.images?.[0]?.url}
        jsonLd={jsonLd}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* breadcrumb */}
        <nav className="mb-4 text-xs text-ink-400">
          <Link to="/" className="hover:text-ink-700">Home</Link> /{' '}
          <Link to={`/shop?gender=${product.gender}`} className="capitalize hover:text-ink-700">{product.gender}</Link> /{' '}
          {product.category && (
            <>
              <Link to={`/shop?category=${product.category.slug}`} className="hover:text-ink-700">{product.category.name}</Link> /{' '}
            </>
          )}
          <span className="text-ink-700">{product.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* ------------------------------------------------------- gallery */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <div className="flex gap-3 sm:flex-col">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  aria-label={`View image ${i + 1}`}
                  className={cx(
                    'w-16 shrink-0 overflow-hidden rounded-xl border-2 transition sm:w-20',
                    i === activeImg ? 'border-ink-900' : 'border-transparent hover:border-ink-300'
                  )}
                >
                  <LazyImage src={img.url} alt={`${product.title} ${i + 1}`} ratio="aspect-[4/5]" label={product.title} />
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-hidden rounded-3xl">
              <LazyImage
                key={activeImg}
                src={product.images[activeImg]?.url}
                alt={product.images[activeImg]?.alt || product.title}
                ratio="aspect-[4/5]"
                label={product.title}
              />
            </div>
          </div>

          {/* -------------------------------------------------------- details */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{product.brand}</p>
            <h1 className="mt-1 font-display text-2xl font-bold leading-tight sm:text-3xl">{product.title}</h1>

            <div className="mt-2 flex items-center gap-3">
              <Rating value={product.rating} count={product.numReviews} />
              <span className="text-xs text-ink-400">· {product.soldCount} sold</span>
            </div>

            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-bold">{inr(product.price)}</span>
              {product.mrp > product.price && (
                <>
                  <span className="text-lg text-ink-400 line-through">{inr(product.mrp)}</span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    {product.discountPercent}% off
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-ink-500">Inclusive of all taxes</p>

            {/* stock status */}
            <p className={cx('mt-3 text-sm font-semibold', selectedVariant ? 'text-emerald-600' : 'text-ink-500')}>
              {outOfStock ? (
                <span className="text-red-600">Out of stock</span>
              ) : selectedVariant ? (
                <>
                  <Check className="mr-1 inline h-4 w-4" />
                  {selectedVariant.stock <= 5 ? `Hurry! Only ${selectedVariant.stock} left in ${size}` : `In stock — ${selectedVariant.stock} available in ${size}`}
                </>
              ) : (
                'Select a size to see availability'
              )}
            </p>

            {/* colours */}
            {product.colors?.length > 0 && (
              <div className="mt-6">
                <p className="label">
                  Colour: <span className="text-ink-700 normal-case">{color || 'Select'}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={cx('chip capitalize', color === c && 'chip-active')}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* sizes */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <p className="label mb-0">
                  Size: <span className="text-ink-700 normal-case">{size || 'Select'}</span>
                </p>
                <Link to="/shipping-returns" className="text-xs font-semibold underline underline-offset-2">
                  Size guide
                </Link>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s.size}
                    disabled={s.stock === 0}
                    onClick={() => {
                      setSize(s.size);
                      setQty(1);
                    }}
                    className={cx(
                      'relative min-w-[3.25rem] rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
                      s.stock === 0
                        ? 'cursor-not-allowed border-ink-100 text-ink-200 line-through'
                        : size === s.size
                          ? 'border-ink-900 bg-ink-900 text-sand-50'
                          : 'border-ink-200 hover:border-ink-900'
                    )}
                  >
                    {s.size}
                  </button>
                ))}
              </div>
            </div>

            {/* quantity + actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <QuantityStepper value={qty} onChange={setQty} max={Math.min(20, selectedVariant?.stock || 20)} disabled={!selectedVariant} />
              <button onClick={() => handleAdd(false)} disabled={outOfStock || busyId === product.id} className="btn-outline flex-1 py-3">
                {busyId === product.id ? <ButtonSpinner /> : (<><ShoppingBag className="h-4 w-4" /> Add to bag</>)}
              </button>
              <button onClick={() => handleAdd(true)} disabled={outOfStock} className="btn-primary flex-1 py-3">
                Buy now
              </button>
              <button
                onClick={toggleWishlist}
                aria-label="Add to wishlist"
                className={cx('grid h-12 w-12 place-items-center rounded-full border transition', wished ? 'border-red-300 bg-red-50' : 'border-ink-200 hover:border-ink-900')}
              >
                <Heart className={cx('h-5 w-5', wished && 'fill-red-500 text-red-500')} />
              </button>
            </div>

            {/* delivery promise */}
            <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-ink-100 bg-white p-4 text-center text-[11px] text-ink-600">
              <div><Truck className="mx-auto mb-1 h-4 w-4" /><b>Free shipping</b><br />above ₹999</div>
              <div><RotateCcw className="mx-auto mb-1 h-4 w-4" /><b>7-day returns</b><br />easy exchange</div>
              <div><ShieldCheck className="mx-auto mb-1 h-4 w-4" /><b>100% secure</b><br />payments</div>
            </div>

            {/* pincode check */}
            <div className="mt-4 rounded-2xl border border-ink-100 bg-white p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-ink-400" />
                <input
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Check delivery pincode"
                  inputMode="numeric"
                  className="flex-1 border-0 bg-transparent text-sm focus:outline-none"
                />
                <button onClick={checkPincode} className="text-xs font-bold underline underline-offset-2">Check</button>
              </div>
              {pinResult && <p className="mt-2 text-xs text-ink-600">{pinResult}</p>}
            </div>

            {/* accordions */}
            <div className="mt-6 divide-y divide-ink-100 rounded-2xl border border-ink-100 bg-white">
              {[
                { key: 'description', title: 'Description', body: <p className="text-sm leading-relaxed text-ink-600">{product.description}</p> },
                {
                  key: 'shipping',
                  title: 'Shipping & Returns',
                  body: (
                    <ul className="space-y-1.5 text-sm text-ink-600">
                      <li>• Dispatched within 24 hours, delivered in {DELIVERY_DAYS}–7 days.</li>
                      <li>• Free shipping on orders above ₹999, otherwise ₹79.</li>
                      <li>• 7-day easy returns &amp; exchange on unworn items with tags.</li>
                      <li>• Cash on delivery available across India.</li>
                    </ul>
                  ),
                },
                {
                  key: 'reviews',
                  title: `Reviews${product.numReviews ? ` (${product.numReviews})` : ''}`,
                  body: product.reviews?.length ? (
                    <ul className="space-y-3">
                      {product.reviews.map((r, i) => (
                        <li key={i} className="rounded-xl bg-ink-50 p-3">
                          <div className="flex items-center justify-between">
                            <b className="text-sm">{r.name || 'Customer'}</b>
                            <Rating value={r.rating} />
                          </div>
                          <p className="mt-1 text-sm text-ink-600">{r.comment}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-ink-500">
                      No reviews yet. Bought this item?{' '}
                      <Link to="/account/orders" className="font-semibold underline underline-offset-2">Share your experience</Link> from your orders page.
                    </p>
                  ),
                },
              ].map((panel) => (
                <div key={panel.key}>
                  <button
                    onClick={() => setOpenPanel(openPanel === panel.key ? '' : panel.key)}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-sm font-semibold"
                  >
                    {panel.title}
                    <ChevronDown className={cx('h-4 w-4 transition', openPanel === panel.key && 'rotate-180')} />
                  </button>
                  {openPanel === panel.key && <div className="px-4 pb-4">{panel.body}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------- related */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 font-display text-2xl font-bold">You may also like</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
              {related.slice(0, 4).map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
