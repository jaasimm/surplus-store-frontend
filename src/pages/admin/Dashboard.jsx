import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, ShoppingCart, Users, Package, AlertTriangle } from 'lucide-react';
import { PageLoader, ErrorNote } from '../../components/Feedback';
import api, { errMsg } from '../../api/client';
import { inr, formatDate, STATUS_META, cx } from '../../utils/format';

/** Admin dashboard: revenue, orders, customers, sales trend and alerts. */
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api
      .get('/admin/stats')
      .then((res) => alive && setStats(res.data.data))
      .catch((err) => alive && setError(errMsg(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <PageLoader label="Loading dashboard…" />;
  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!stats) return null;

  const maxSale = Math.max(...stats.salesLast14Days.map((d) => d.revenue), 1);

  const cards = [
    { label: 'Revenue', value: inr(stats.revenue), sub: `${stats.paidOrders} paid orders`, icon: IndianRupee },
    { label: 'Total orders', value: stats.totalOrders, sub: `${stats.ordersByStatus.placed || 0} awaiting packing`, icon: ShoppingCart },
    { label: 'Customers', value: stats.customers, sub: 'registered accounts', icon: Users },
    { label: 'Active products', value: stats.products, sub: `${stats.lowStock.length} low on stock`, icon: Package },
  ];

  return (
    <div className="space-y-6">
      {/* --------------------------------------------------------- KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{c.label}</p>
              <c.icon className="h-4 w-4 text-ink-300" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold">{c.value}</p>
            <p className="mt-1 text-xs text-ink-500">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        {/* ------------------------------------------------ sales chart */}
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Sales — last 14 days</h2>
            <span className="text-xs text-ink-500">revenue per day</span>
          </div>
          <div className="mt-6 flex h-48 items-end gap-1.5">
            {stats.salesLast14Days.length === 0 && (
              <p className="self-center text-sm text-ink-400">No sales in the last 14 days yet.</p>
            )}
            {stats.salesLast14Days.map((d) => (
              <div key={d._id} className="group relative flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-ink-900 transition group-hover:bg-ink-700"
                  style={{ height: `${Math.max(6, (d.revenue / maxSale) * 160)}px` }}
                  title={`${d._id}: ${inr(d.revenue)}`}
                />
                <span className="text-[9px] text-ink-400">{d._id.slice(8)}</span>
                <span className="pointer-events-none absolute -top-6 hidden whitespace-nowrap rounded bg-ink-900 px-2 py-1 text-[10px] text-sand-50 group-hover:block">
                  {inr(d.revenue)} · {d.orders} orders
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* --------------------------------------------- status breakdown */}
        <section className="card p-5">
          <h2 className="font-display text-lg font-bold">Orders by status</h2>
          <ul className="mt-4 space-y-3">
            {Object.entries(stats.ordersByStatus).map(([status, count]) => (
              <li key={status} className="flex items-center justify-between">
                <span className={cx('rounded-full px-2.5 py-1 text-[11px] font-bold', STATUS_META[status]?.color || 'bg-ink-100')}>
                  {STATUS_META[status]?.label || status}
                </span>
                <b className="tabular-nums">{count}</b>
              </li>
            ))}
          </ul>

          {stats.pendingReturns > 0 && (
            <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
              {stats.pendingReturns} return request{stats.pendingReturns === 1 ? '' : 's'} awaiting review
            </p>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* ------------------------------------------------ recent orders */}
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Recent orders</h2>
            <Link to="/admin/orders" className="text-xs font-semibold underline underline-offset-2">View all</Link>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-ink-400">
                <tr><th className="py-2">Order</th><th>Customer</th><th>Status</th><th className="text-right">Total</th></tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {stats.recentOrders.map((o) => (
                  <tr key={o._id}>
                    <td className="py-2.5 font-medium tabular-nums">{o.orderNumber}</td>
                    <td className="tabular-nums">{o.shippingAddress?.phone || o.user?.mobile || '—'}</td>
                    <td>
                      <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-bold', STATUS_META[o.status]?.color)}>
                        {STATUS_META[o.status]?.label}
                      </span>
                    </td>
                    <td className="text-right font-semibold">{inr(o.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ------------------------------------------------ top products + low stock */}
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="font-display text-lg font-bold">Top products</h2>
            <ul className="mt-3 space-y-2.5 text-sm">
              {stats.topProducts.map((p, i) => (
                <li key={p.title} className="flex items-center justify-between">
                  <span className="line-clamp-1 pr-3">
                    <b className="mr-2 text-ink-400">{i + 1}.</b>
                    {p.title}
                  </span>
                  <span className="shrink-0 text-xs text-ink-500">{p.units} sold · {inr(p.revenue)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5">
            <h2 className="font-display text-lg font-bold">Low stock alert</h2>
            {stats.lowStock.length === 0 ? (
              <p className="mt-2 text-sm text-ink-500">All products are comfortably stocked.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {stats.lowStock.map((p, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="line-clamp-1 pr-3">{p.title} <span className="text-xs text-ink-400">({p.size})</span></span>
                    <b className={cx('shrink-0 text-xs', p.stock === 0 ? 'text-red-600' : 'text-amber-600')}>{p.stock} left</b>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <p className="text-xs text-ink-400">Dashboard generated on {formatDate(new Date(), { dateStyle: 'full' })}</p>
    </div>
  );
}
