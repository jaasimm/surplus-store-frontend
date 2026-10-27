import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import SEO from '../../components/SEO';
import ProductCard from '../../components/ProductCard';
import { ProductSkeleton } from '../../components/Feedback';
import api from '../../api/client';

/** Wishlist — public page, but requires login to load the saved list. */
export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .get('/users/wishlist')
      .then((res) => alive && setItems(res.data.data || []))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <SEO title="Wishlist" description="Your saved favourites at Surplus Store." path="/wishlist" noindex />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Wishlist</h1>
        <p className="mt-1 text-sm text-ink-500">{items.length} saved item{items.length === 1 ? '' : 's'}</p>

        <div className="mt-6">
          {loading ? (
            <ProductSkeleton count={4} />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-ink-200 bg-white py-20 text-center">
              <Heart className="h-10 w-10 text-ink-300" />
              <h2 className="mt-4 font-display text-xl font-bold">Nothing saved yet</h2>
              <p className="mt-1 max-w-xs text-sm text-ink-500">Tap the heart on any product to save it here for later.</p>
              <Link to="/shop" className="btn-primary mt-6 px-8">Explore products</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
              {items.map((p, i) => (
                <ProductCard
                  key={p._id || p.id}
                  index={i}
                  product={{ ...p, id: p.id || String(p._id), images: p.images || [], sizes: p.sizes || [], colors: p.colors || [] }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
