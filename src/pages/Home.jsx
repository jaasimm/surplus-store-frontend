import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, RotateCcw, ShieldCheck, BadgeIndianRupee, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import LazyImage from '../components/LazyImage';
import ProductCard from '../components/ProductCard';
import { ProductSkeleton } from '../components/Feedback';
import api from '../api/client';

const GROUPS = [
  { key: 'men', title: 'Men', to: '/shop?gender=men', blurb: 'Shirts, tees & denim' },
  { key: 'women', title: 'Women', to: '/shop?gender=women', blurb: 'Dresses, tops & kurtis' },
  { key: 'kids', title: 'Kids', to: '/shop?gender=kids', blurb: 'Play-ready comfort' },
];

const PROMISES = [
  { icon: Truck, title: 'Free shipping', text: 'On orders above ₹999' },
  { icon: RotateCcw, title: '7-day returns', text: 'Easy exchange & refunds' },
  { icon: BadgeIndianRupee, title: 'Cash on delivery', text: 'Available across India' },
  { icon: ShieldCheck, title: 'Secure payments', text: 'UPI, cards & net banking' },
];

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [cats, fresh, popular, offers] = await Promise.all([
          api.get('/categories'),
          api.get('/products', { params: { sort: 'newest', limit: 8 } }),
          api.get('/products', { params: { sort: 'popularity', limit: 8 } }),
          api.get('/coupons/active').catch(() => ({ data: { data: [] } })),
        ]);
        if (!alive) return;
        setCategories(cats.data.data || []);
        setNewArrivals(fresh.data.data?.items || []);
        setBestSellers(popular.data.data?.items || []);
        setCoupons(offers.data.data || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const heroImage =
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=70';

  return (
    <>
      <SEO
        title=""
        description="Shop premium yet affordable clothing for men, women and kids at Surplus Store. Free shipping above ₹999, easy 7-day returns and COD across India."
        path="/"
      />

      {/* ------------------------------------------------------------ HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
        <img
          src={heroImage}
          alt="Modern fashion"
          className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-luminosity"
          loading="eager"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="max-w-xl animate-fadeUp">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-blue-300">
              Season Finale · Up to 60% Off
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight leading-[1.08] sm:text-6xl text-white">
              Quality you expect.
              <br />
              <span className="text-blue-400">Prices you don&apos;t.</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-300 sm:text-base">
              Surplus-grade clothing from the brands you already love — freshly stocked every week and delivered
              anywhere in India.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop?gender=women" className="btn bg-blue-600 px-6 py-3 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500">
                Shop Women <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/shop?gender=men" className="btn border border-white/20 bg-white/10 px-6 py-3 text-white backdrop-blur hover:bg-white/20">
                Shop Men
              </Link>
              <Link to="/shop?gender=kids" className="btn border border-white/20 bg-white/10 px-6 py-3 text-white backdrop-blur hover:bg-white/20">
                Shop Kids
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- OFFERS */}
      {coupons.length > 0 && (
        <section className="border-y border-blue-100 bg-blue-50/60 py-3">
          <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto px-4 no-scrollbar sm:px-6 lg:px-8">
            <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-blue-700">Offers</span>
            {coupons.map((c) => (
              <span key={c.code} className="shrink-0 rounded-full border border-dashed border-blue-300 bg-white px-3.5 py-1 text-xs font-semibold text-blue-900 shadow-sm">
                <span className="text-blue-600">{c.code}</span> — {c.description}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------ CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Shop by Category</h2>
            <p className="mt-1 text-sm text-ink-500">Fresh drops for everyone in the family</p>
          </div>
          <Link to="/shop" className="hidden text-sm font-semibold text-blue-600 hover:text-blue-700 sm:block">
            View all categories →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          {GROUPS.map((g) => {
            const cat = categories.find((c) => c.group === g.key);
            return (
              <Link
                key={g.key}
                to={cat ? `/shop?category=${cat.slug}` : g.to}
                className="group relative overflow-hidden rounded-2xl bg-slate-900 shadow-sm transition hover:shadow-md"
              >
                <div className="aspect-[4/3] sm:aspect-[3/4]">
                  <LazyImage
                    src={`https://images.unsplash.com/photo-${
                      g.key === 'men' ? '1617137968427-85924c800a22' : g.key === 'women' ? '1483985988355-763728e1935b' : '1519238263530-99bdd11df2ea'
                    }?auto=format&fit=crop&w=900&q=70`}
                    alt={`${g.title} clothing`}
                    ratio="aspect-[3/4]"
                    label={g.title}
                    className="opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-6 pt-16">
                  <h3 className="font-display text-2xl font-bold text-white">{g.title}</h3>
                  <p className="text-sm text-slate-300">{g.blurb}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-300 group-hover:text-white">
                    Explore <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------ NEW ARRIVALS */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">New Arrivals</h2>
            <p className="mt-1 text-sm text-ink-500">Just landed this week</p>
          </div>
          <Link to="/shop?sort=newest" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            See all →
          </Link>
        </div>
        {loading ? (
          <ProductSkeleton count={8} />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {newArrivals.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------- PROMISES */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-ink-100 bg-white p-6 shadow-sm sm:grid-cols-4 sm:gap-6">
          {PROMISES.map((p) => (
            <div key={p.title} className="flex flex-col items-center gap-2 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <p.icon className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-ink-800">{p.title}</p>
              <p className="text-xs text-ink-500">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------- BEST SELLERS */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Best Sellers</h2>
            <p className="mt-1 text-sm text-ink-500">What everyone is buying right now</p>
          </div>
          <Link to="/shop?sort=popularity" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            See all →
          </Link>
        </div>
        {loading ? (
          <ProductSkeleton count={8} />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {bestSellers.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* --------------------------------------------------------- NEWSLETTER */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-6 py-12 text-center text-white shadow-lg shadow-blue-500/10 sm:px-12">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Get ₹200 off your first order</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-blue-100">
            Use code <b className="rounded bg-white/20 px-2 py-0.5 text-white font-mono">FLAT200</b> at checkout on orders above ₹1499.
          </p>
          <Link to="/shop" className="btn mt-6 bg-white px-8 py-3 font-semibold text-blue-700 shadow-sm hover:bg-blue-50">
            Start shopping
          </Link>
        </div>
      </section>
    </>
  );
}
