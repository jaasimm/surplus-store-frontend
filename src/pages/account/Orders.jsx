import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, PackageSearch } from 'lucide-react';
import { PageLoader, ErrorNote } from '../../components/Feedback';
import LazyImage from '../../components/LazyImage';
import api, { errMsg } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { inr, formatDate, STATUS_META, PAYMENT_META, cx } from '../../utils/format';

/** Order history with status chips + cancel / return actions. */
export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const toast = useToast();

  const load = async () => {
    try {
      const { data } = await api.get('/orders/mine');
      setOrders(data.data || []);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cancel = async (order) => {
    const reason = window.prompt('Why are you cancelling this order? (optional)') || '';
    setBusy(order.id);
    try {
      const { data } = await api.post(`/orders/${order.id}/cancel`, { reason });
      setOrders((o) => o.map((x) => (x.id === order.id ? data.data : x)));
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(null);
    }
  };

  const requestReturn = async (order) => {
    const reason = window.prompt('What is the reason for the return? (required, e.g. "size too small")');
    if (!reason || reason.trim().length < 5) return toast.error('Please provide a short reason (min 5 characters)');
    setBusy(order.id);
    try {
      const { data } = await api.post(`/orders/${order.id}/return`, { reason });
      setOrders((o) => o.map((x) => (x.id === order.id ? data.data : x)));
      toast.success(data.message);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <PageLoader label="Loading your orders…" />;

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-ink-200 bg-white py-20 text-center">
        <PackageSearch className="h-10 w-10 text-ink-300" />
        <h2 className="mt-4 font-display text-xl font-bold">No orders yet</h2>
        <p className="mt-1 max-w-xs text-sm text-ink-500">When you place an order it will show up here with live tracking.</p>
        <Link to="/shop" className="btn-primary mt-6 px-8">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ErrorNote>{error}</ErrorNote>

      {orders.map((order) => {
        const status = STATUS_META[order.status] || STATUS_META.placed;
        const pay = PAYMENT_META[order.payment.status] || PAYMENT_META.pending;
        return (
          <article key={order.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold tabular-nums">{order.orderNumber}</p>
                <p className="text-xs text-ink-500">
                  Placed on {formatDate(order.createdAt)} · {order.items.length} item{order.items.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex gap-2">
                <span className={cx('rounded-full px-2.5 py-1 text-[11px] font-bold', status.color)}>{status.label}</span>
                <span className={cx('rounded-full px-2.5 py-1 text-[11px] font-bold', pay.color)}>{pay.label}</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-14 shrink-0">
                    <LazyImage src={item.image} alt={item.title} ratio="aspect-[4/5]" className="rounded-lg" label={item.title} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-ink-500">Size {item.size}{item.color ? ` · ${item.color}` : ''} · Qty {item.qty}</p>
                  </div>
                  <p className="text-sm font-semibold">{inr(item.price * item.qty)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4">
              <p className="text-sm">
                Total: <b>{inr(order.totalPrice)}</b>
                {order.discount > 0 && <span className="ml-2 text-xs text-emerald-600">saved {inr(order.discount)}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {['placed', 'packed'].includes(order.status) && (
                  <button onClick={() => cancel(order)} disabled={busy === order.id} className="btn-outline py-2 text-xs">
                    Cancel order
                  </button>
                )}
                {order.status === 'delivered' && !order.returnRequest?.requested && (
                  <button onClick={() => requestReturn(order)} disabled={busy === order.id} className="btn-outline py-2 text-xs">
                    Request return
                  </button>
                )}
                {order.payment.status === 'failed' && (
                  <Link to="/checkout" className="btn-primary py-2 text-xs">Retry payment</Link>
                )}
                {order.returnRequest?.requested && (
                  <span className="rounded-full bg-ink-100 px-3 py-2 text-xs font-semibold text-ink-700">
                    Return {order.returnRequest.status}
                  </span>
                )}
                <Link to={`/account/orders/${order.id}`} className="btn-ghost py-2 text-xs">
                  View details <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
