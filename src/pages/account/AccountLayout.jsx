import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { User, Package, MapPin, Heart, LogOut, LayoutDashboard, ChevronRight, ShoppingBag } from 'lucide-react';
import SEO from '../../components/SEO';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { cx } from '../../utils/format';

const LINKS = [
  { to: '/account', label: 'Profile', icon: User, end: true },
  { to: '/account/orders', label: 'My Orders', icon: Package },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  { to: '/wishlist', label: 'Wishlist', icon: Heart },
];

/** Renders a 2-letter avatar from name or last 2 digits of mobile. */
function Avatar({ name, mobile }) {
  const initials = name
    ? name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
    : mobile?.replace(/\D/g, '').slice(-2) || '??';
  return (
    <div
      aria-hidden
      className="flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-full bg-blue-600 text-sm font-bold tracking-wide text-white shadow-sm"
    >
      {initials}
    </div>
  );
}

/** Private account shell: sidebar on desktop, tabs on mobile. */
export default function AccountLayout() {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();

  const activeLabel =
    LINKS.find((l) => (l.end ? location.pathname === l.to : location.pathname.startsWith(l.to)))?.label ?? 'Account';

  return (
    <ProtectedRoute>
      <SEO title="My Account" description="Manage your Surplus Store profile, orders and saved addresses." path="/account" noindex />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-ink-100 pb-6">
          <div>
            <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-blue-600">My Account</p>
            <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">{activeLabel}</h1>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">

          {/* ── Sidebar ── */}
          <aside className="lg:sticky lg:top-28 lg:self-start space-y-3">

            {/* User identity card */}
            <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar name={user?.name} mobile={user?.mobile} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink-900 leading-tight">
                    {user?.name || 'Store Member'}
                  </p>
                  <p className="truncate text-xs text-ink-400 tabular-nums mt-0.5">{user?.mobile}</p>
                </div>
              </div>
              {isAdmin && (
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-700 border border-blue-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  Admin
                </span>
              )}
            </div>

            {/* Nav panel */}
            <div className="rounded-2xl border border-ink-100 bg-white shadow-sm overflow-hidden">

              {/* Mobile: horizontal tab strip */}
              <div className="flex overflow-x-auto no-scrollbar lg:hidden border-b border-ink-100">
                {LINKS.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    className={({ isActive }) =>
                      cx(
                        'flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap',
                        isActive
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-ink-500 hover:text-ink-800'
                      )
                    }
                  >
                    <l.icon className="h-4 w-4" />
                    {l.label}
                  </NavLink>
                ))}
              </div>

              {/* Desktop: vertical list */}
              <div className="hidden lg:flex lg:flex-col">
                <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-400">
                  Menu
                </p>
                {LINKS.map((l, i) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    className={({ isActive }) =>
                      cx(
                        'group flex items-center gap-3 px-4 py-3 text-sm font-medium transition',
                        i < LINKS.length - 1 && 'border-b border-ink-50',
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-ink-700 hover:bg-blue-50 hover:text-blue-700'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <l.icon
                          className={cx(
                            'h-4 w-4 shrink-0 transition',
                            isActive ? 'text-white' : 'text-ink-400 group-hover:text-blue-600'
                          )}
                        />
                        <span className="flex-1">{l.label}</span>
                        {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/60" />}
                      </>
                    )}
                  </NavLink>
                ))}

                {isAdmin && (
                  <>
                    <p className="px-4 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-amber-500 border-t border-ink-50">
                      Admin
                    </p>
                    <Link
                      to="/admin"
                      className="group flex items-center gap-3 px-4 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-50"
                    >
                      <LayoutDashboard className="h-4 w-4 shrink-0 text-amber-500 transition group-hover:text-amber-700" />
                      <span className="flex-1">Admin Panel</span>
                      <ChevronRight className="h-3.5 w-3.5 text-amber-300" />
                    </Link>
                  </>
                )}

                <div className="border-t border-ink-50 p-2">
                  <Link
                    to="/shop"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-400 transition hover:bg-ink-50 hover:text-ink-700"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Continue shopping
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
