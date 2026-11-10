import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import Shop from './Shop';
import api from '../api/client';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [cats, offers] = await Promise.all([
        api.get('/categories').catch(() => ({ data: { data: [] } })),
        api.get('/coupons/active').catch(() => ({ data: { data: [] } })),
      ]);
      if (!alive) return;
      setCategories(cats.data.data || []);
      setCoupons(offers.data.data || []);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <SEO
        title=""
        description="Shop shirts, t-shirts, pants, jeans, jackets, tracksuits and more at Surplus Store. Free shipping above ₹999, easy 7-day returns and COD across India."
        path="/"
      />

      {/* ------------------------------------------------------- CATEGORY RAIL */}
      {categories.length > 0 && (
        <nav className="border-b border-ink-100 bg-white py-3.5" aria-label="Shop by category">
          <div className="no-scrollbar mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6 lg:px-8">
            <div className="flex w-max items-center gap-2">
              <Link to="/shop" className="chip chip-active whitespace-nowrap">
                All
              </Link>
              {categories.map((c) => (
                <Link key={c.id} to={`/shop?category=${c.slug}`} className="chip whitespace-nowrap">
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* -------------------------------------------------------------- OFFERS */}
      {coupons.length > 0 && (
        <section className="border-b border-blue-100 bg-blue-50/60 py-3">
          <div className="no-scrollbar mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto px-4 sm:px-6 lg:px-8">
            <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-blue-700">Offers</span>
            {coupons.map((c) => (
              <span
                key={c.code}
                className="shrink-0 rounded-full border border-dashed border-blue-300 bg-white px-3.5 py-1 text-xs font-semibold text-blue-900 shadow-sm"
              >
                <span className="text-blue-600">{c.code}</span> — {c.description}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------- THE CATALOGUE */}
      <Shop embedded />
    </>
  );
}
