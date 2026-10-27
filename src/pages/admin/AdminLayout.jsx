import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, Ticket, Tags, MessageSquare, Menu, X, Store, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { cx } from '../../utils/format';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
];

/** Admin shell — role-protected, collapsible sidebar on mobile. */
export default function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const Sidebar = (
    <div className="flex h-full flex-col">
      <Link to="/" className="flex items-baseline gap-2 px-5 py-5">
        <span className="font-display text-xl font-bold text-white">Surplus</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sand-300">Admin</span>
      </Link>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive ? 'bg-sand-50 text-ink-900' : 'text-sand-200 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4 text-xs text-sand-300">
        <p className="font-semibold text-white">{user?.name || 'Admin'}</p>
        <p className="tabular-nums">{user?.mobile}</p>
        <Link to="/shop" className="mt-3 inline-flex items-center gap-1.5 text-sand-200 underline underline-offset-2">
          <ExternalLink className="h-3.5 w-3.5" /> View store
        </Link>
      </div>
    </div>
  );

  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen bg-ink-50">
        {/* desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-ink-900 lg:block">{Sidebar}</aside>

        {/* mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-ink-900/50" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-64 bg-ink-900 shadow-pop">{Sidebar}</aside>
          </div>
        )}

        <div className="lg:pl-64">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink-100 bg-white/90 px-4 py-3 backdrop-blur">
            <button className="p-1 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="font-display text-lg font-bold">
              {NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))?.label || 'Admin'}
            </h1>
            <Link to="/" className="btn-ghost ml-auto px-3 py-1.5 text-xs">
              <Store className="h-4 w-4" /> Store
            </Link>
          </header>

          <main className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
