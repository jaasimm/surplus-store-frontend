import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Heart, Menu, Search, ShoppingBag, User, X, LogOut, Package, MapPin, LayoutDashboard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { cx } from '../utils/format';

const NAV = [
  { to: '/shop?gender=men',        label: 'Men' },
  { to: '/shop?gender=women',      label: 'Women' },
  { to: '/shop?gender=kids',       label: 'Kids' },
  { to: '/shop?sort=newest',       label: 'New Arrivals' },
  { to: '/shop?sort=popularity',   label: 'Best Sellers' },
];

export default function Navbar() {
  const { cart } = useCart();
  const { user, isAuthenticated, isAdmin, requireLogin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled,    setScrolled]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [q,           setQ]           = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/shop?search=${encodeURIComponent(q.trim())}` : '/shop');
  };

  const goAccount = () => (isAuthenticated ? navigate('/account') : requireLogin('Login to view your account'));

  return (
    <header className="sticky top-0 z-50">
      {/* ── Announcement bar ── */}
      <div className="bg-blue-600 px-4 py-2 text-center text-[11px] font-medium tracking-wide text-white sm:text-xs">
        Free shipping above ₹999 · Easy 7-day returns · COD across India
      </div>

      {/* ── Main bar ── */}
      <div className={cx('border-b border-ink-100 bg-white transition-shadow', scrolled && 'shadow-sm')}>
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">

          {/* mobile hamburger */}
          <button
            className="rounded-lg p-2 text-ink-600 transition hover:bg-ink-100 -ml-2 lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 shrink-0">
            <span className="text-xl font-bold tracking-tight text-blue-600">Surplus</span>
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-400 sm:inline">Store</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="ml-8 hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  cx(
                    'rounded-lg px-3 py-2 text-sm font-medium transition',
                    isActive && location.search === `?${item.to.split('?')[1]}`
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right icons */}
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {/* desktop search */}
            <form onSubmit={submitSearch} className="hidden items-center md:flex">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search products…"
                  aria-label="Search products"
                  className="w-48 rounded-lg border border-ink-200 bg-ink-50 py-1.5 pl-9 pr-3 text-sm placeholder-ink-400 transition focus:w-64 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>
            </form>

            {/* mobile search toggle */}
            <button
              className="rounded-lg p-2 text-ink-600 transition hover:bg-ink-100 md:hidden"
              onClick={() => setSearchOpen((s) => !s)}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Wishlist */}
            <Link to="/wishlist" className="rounded-lg p-2 text-ink-600 transition hover:bg-ink-100" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative rounded-lg p-2 text-ink-600 transition hover:bg-ink-100"
              aria-label={`Bag with ${cart.count} items`}
            >
              <ShoppingBag className="h-5 w-5" />
              {cart.count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-sm">
                  {cart.count > 9 ? '9+' : cart.count}
                </span>
              )}
            </Link>

            {/* Admin shortcut if logged in as admin */}
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 sm:inline-flex"
                title="Go to Admin Panel"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Admin</span>
              </Link>
            )}

            {/* Desktop Auth Button */}
            {isAuthenticated ? (
              <button
                onClick={goAccount}
                className="hidden items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-ink-300 hover:bg-ink-50 sm:inline-flex"
              >
                <div className="grid h-5 w-5 place-items-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                  {(user?.name || user?.mobile || 'U').charAt(0).toUpperCase()}
                </div>
                <span>{user?.name ? user.name.split(' ')[0] : 'Account'}</span>
              </button>
            ) : (
              <button
                onClick={() => requireLogin('Login to view your account')}
                className="hidden items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:inline-flex"
              >
                <User className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* mobile search bar */}
        {searchOpen && (
          <form onSubmit={submitSearch} className="border-t border-ink-100 px-4 py-2.5 md:hidden">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products…"
                className="field py-2.5 pl-9"
              />
            </div>
          </form>
        )}
      </div>

      {/* ── Mobile drawer ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-80 max-w-[85%] flex-col bg-white shadow-pop animate-fadeUp">
            {/* drawer header */}
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <span className="text-lg font-bold text-blue-600">Surplus Store</span>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Shop</p>
              {NAV.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink-800 hover:bg-blue-50 hover:text-blue-700"
                >
                  {item.label}
                </Link>
              ))}

              <div className="my-3 border-t border-ink-100" />
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Account</p>
              {[
                { to: '/account',           label: 'My Account',       icon: User,           auth: true },
                { to: '/account/orders',    label: 'My Orders',        icon: Package,        auth: true },
                { to: '/account/addresses', label: 'Saved Addresses',  icon: MapPin,         auth: true },
                { to: '/wishlist',          label: 'Wishlist',         icon: Heart },
                { to: '/about',             label: 'About Us' },
                { to: '/contact',           label: 'Contact' },
                { to: '/shipping-returns',  label: 'Shipping & Returns' },
                { to: '/privacy',           label: 'Privacy Policy' },
                ...(isAdmin ? [{ to: '/admin', label: 'Admin Panel', icon: LayoutDashboard }] : []),
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={(e) => {
                    if (item.auth && !isAuthenticated) {
                      e.preventDefault();
                      requireLogin('Login to view your account');
                    }
                  }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  {item.icon && <item.icon className="h-4 w-4 text-ink-400" />}
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="safe-bottom border-t border-ink-100 p-4">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-ink-800">Hi, {user?.name || user?.mobile}</p>
                  <button onClick={logout} className="btn-outline w-full">
                    <LogOut className="h-4 w-4" /> Log out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setMenuOpen(false); requireLogin('Login to track orders, save addresses and check out'); }}
                  className="btn-primary w-full"
                >
                  <User className="h-4 w-4" /> Login / Sign up
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}

