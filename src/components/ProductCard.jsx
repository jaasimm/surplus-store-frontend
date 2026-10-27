import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import LazyImage from './LazyImage';
import { inr, cx } from '../utils/format';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { errMsg } from '../api/client';

/**
 * Product tile used on the home page, listings and related strips.
 * Quick-add picks the first in-stock size (deep selection happens on the PDP).
 */
export default function ProductCard({ product, index = 0 }) {
  const { addItem, busyId } = useCart();
  const { user, isAuthenticated, requireLogin, refreshUser } = useAuth();
  const toast = useToast();
  const [added, setAdded] = useState(false);

  const wished = Boolean(user?.wishlist?.includes?.(product.id));
  const firstSize = product.sizes?.find((s) => s.stock > 0)?.size || '';
  const busy = busyId === product.id;

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return requireLogin('Login to save favourites');
    try {
      const { data } = await api.post('/users/wishlist', { productId: product.id });
      await refreshUser();
      toast.info(data?.message);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const quickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firstSize) return toast.error('This item is out of stock');
    const ok = await addItem({ productId: product.id, size: firstSize, color: product.colors?.[0] || '', qty: 1 });
    if (ok) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    }
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group animate-fadeUp"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="relative overflow-hidden rounded-2xl bg-ink-100">
        <LazyImage
          src={product.images?.[0]?.url}
          alt={product.images?.[0]?.alt || product.title}
          label={product.title.split(' ')[0]}
          className="transition duration-500 group-hover:scale-[1.03]"
        />
        {/* second image on hover (desktop) */}
        {product.images?.[1] && (
          <div className="pointer-events-none absolute inset-0 hidden opacity-0 transition duration-500 group-hover:opacity-100 md:block">
            <LazyImage src={product.images[1].url} alt={product.title} label={product.title.split(' ')[0]} />
          </div>
        )}

        {product.discountPercent > 0 && (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            {product.discountPercent}% OFF
          </span>
        )}
        {!product.inStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-[2px] text-xs font-bold text-ink-700 uppercase tracking-wider">
            Out of Stock
          </span>
        )}

        <button
          onClick={toggleWishlist}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink-600 shadow-sm backdrop-blur transition hover:scale-110 active:scale-95"
        >
          <Heart className={cx('h-4 w-4', wished && 'fill-red-500 text-red-500')} />
        </button>

        {product.inStock && (
          <button
            onClick={quickAdd}
            className="absolute inset-x-3 bottom-3 hidden translate-y-12 items-center justify-center gap-2 rounded-lg bg-white/95 py-2.5 text-xs font-semibold text-blue-700 opacity-0 shadow-md transition duration-300 hover:bg-blue-600 hover:text-white group-hover:translate-y-0 group-hover:opacity-100 md:inline-flex"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {added ? 'Added ✓' : busy ? 'Adding…' : 'Quick add'}
          </button>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
          {product.brand || 'Surplus'}{product.category?.name ? ` · ${product.category.name}` : ''}
        </p>
        <h3 className="line-clamp-1 text-sm font-medium text-ink-900 group-hover:text-blue-600 transition-colors">{product.title}</h3>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-bold text-ink-900">{inr(product.price)}</span>
          {product.mrp > product.price && (
            <span className="text-xs text-ink-400 line-through">{inr(product.mrp)}</span>
          )}
          {product.discountPercent > 0 && (
            <span className="text-xs font-semibold text-blue-600">({product.discountPercent}% off)</span>
          )}
        </div>
        {/* mobile quick add */}
        <button onClick={quickAdd} className="btn-outline mt-1.5 w-full py-2 text-xs md:hidden" disabled={!product.inStock}>
          <ShoppingBag className="h-3.5 w-3.5" /> {added ? 'Added ✓' : 'Add to bag'}
        </button>
      </div>
    </Link>
  );
}
