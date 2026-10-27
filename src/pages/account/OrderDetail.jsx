import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Package, Truck, Home, XCircle } from 'lucide-react';
import { PageLoader, ErrorNote } from '../../components/Feedback';
import LazyImage from '../../components/LazyImage';
import api, { errMsg } from '../../api/client';
import { inr, formatDate, formatDateTime, STATUS_META, PAYMENT_META, cx } from '../../utils/format';

const STEPS = [
  { key: 'placed', label: 'Placed', icon: Package },
  { key: 'packed', label: 'Packed', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Home },
];

/** Full order detail + visual status tracker. */
export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api
      .get(`/orders/${id}`)
      .then((res) => alive && setOrder(res.data.data))
      .catch((err) => alive && setError(errMsg(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <PageLoader label="Loading order…" />;
  if (error) return <div className="mx-auto max-w-3xl px-4 py-12"><ErrorNote>{error}</ErrorNote></div>;
  if (!order) return null;

  const cancelled = order.status === 'cancelled';
  const currentStep = STATUS_META[order.status]?.step ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/account/orders" className="text-xs text-ink-400 hover:text-ink-700">← Back to orders</Link>
          <h2 className="font-display text-xl font-bold tabular-nums">{order.orderNumber}</h2>
          <p className="text-xs text-ink-500">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <span className={cx('rounded-full px-3 py-1.5 text-xs font-bold', STATUS_META[order.status]?.color)}>
          {STATUS_META[order.status]?.label}
        </span>
      </div>

      {/* ------------------------------------------------------- tracker */}
      <section className="card p-6">
        {cancelled ? (
          <div className="flex items-center gap-3 text-red-700">
            <XCircle className="h-6 w-6" />
            <div>
              <p className="font-semibold">This order was cancelled</p>
              <p className="text-sm text-ink-500">{order.cancelReason || 'Cancelled'}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center">
              {STEPS.map((step, i) => {
                const done = currentStep > i;
                const active = currentStep === i + 1;
                return (
                  <div key={step.key} className={cx('flex flex-1 items-center', i > 0 && '')}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={cx(
                          'grid h-9 w-9 place-items-center rounded-full border-2 transition',
                          done ? 'border-emerald-500 bg-emerald-500 text-white' : active ? 'border-ink-900 text-ink-900' : 'border-ink-200 text-ink-300'
                        )}
                      >
                        {done ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                      </div>
                      <span className={cx('text-[11px] font-semibold', done || active ? 'text-ink-900' : 'text-ink-400')}>{step.label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={cx('mx-1 h-0.5 flex-1 rounded-full', currentStep > i + 1 ? 'bg-emerald-500' : 'bg-ink-200')} />
                    )}
                  </div>
                );
              })}
            </div>
            {order.deliveredAt && (
              <p className="mt-4 text-center text-sm text-ink-500">Delivered on {formatDate(order.deliveredAt)} 🎉</p>
            )}
          </>
        )}

        {order.statusHistory?.length > 0 && (
          <ul className="mt-5 space-y-2 border-t border-ink-100 pt-4 text-xs text-ink-600">
            {[...order.statusHistory].reverse().map((h, i) => (
              <li key={i} className="flex justify-between gap-4">
                <span>{h.note || h.status}</span>
                <span className="shrink-0 text-ink-400">{formatDateTime(h.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---------------------------------------------------- items */}
        <section className="card p-5">
          <h3 className="font-display text-lg font-bold">Items</h3>
          <ul className="mt-4 space-y-3">
            {order.items.map((item, i) => (
              <li key={i} className="flex gap-3">
                <div className="w-16 shrink-0">
                  <LazyImage src={item.image} alt={item.title} ratio="aspect-[4/5]" className="rounded-lg" label={item.title} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-ink-500">Size {item.size}{item.color ? ` · ${item.color}` : ''} · Qty {item.qty}</p>
                </div>
                <p className="text-sm font-semibold">{inr(item.price * item.qty)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-1.5 border-t border-dashed border-ink-200 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-ink-500">Items</dt><dd>{inr(order.itemsPrice)}</dd></div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600"><dt>Coupon {order.couponCode}</dt><dd>− {inr(order.discount)}</dd></div>
            )}
            <div className="flex justify-between"><dt className="text-ink-500">Shipping</dt><dd>{order.shippingPrice === 0 ? 'FREE' : inr(order.shippingPrice)}</dd></div>
            {order.codFee > 0 && <div className="flex justify-between"><dt className="text-ink-500">COD fee</dt><dd>{inr(order.codFee)}</dd></div>}
            <div className="flex justify-between border-t border-ink-100 pt-2 font-bold"><dt>Total</dt><dd>{inr(order.totalPrice)}</dd></div>
          </dl>
        </section>

        {/* ------------------------------------------------ address + payment */}
        <div className="space-y-6">
          <section className="card p-5">
            <h3 className="font-display text-lg font-bold">Delivery address</h3>
            <div className="mt-3 text-sm text-ink-700">
              <p className="font-semibold">{order.shippingAddress.name}</p>
              <p className="mt-1">{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} — <b>{order.shippingAddress.pincode}</b></p>
              <p className="mt-1 tabular-nums">{order.shippingAddress.phone}</p>
            </div>
          </section>

          <section className="card p-5">
            <h3 className="font-display text-lg font-bold">Payment</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-500">Method</dt><dd className="font-semibold capitalize">{order.payment.method === 'cod' ? 'Cash on delivery' : 'Razorpay'}</dd></div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Status</dt>
                <dd><span className={cx('rounded-full px-2.5 py-1 text-[11px] font-bold', PAYMENT_META[order.payment.status]?.color)}>{PAYMENT_META[order.payment.status]?.label}</span></dd>
              </div>
              {order.payment.razorpayPaymentId && (
                <div className="flex justify-between gap-4"><dt className="text-ink-500">Payment id</dt><dd className="truncate text-xs tabular-nums">{order.payment.razorpayPaymentId}</dd></div>
              )}
              {order.payment.paidAt && (
                <div className="flex justify-between"><dt className="text-ink-500">Paid on</dt><dd>{formatDateTime(order.payment.paidAt)}</dd></div>
              )}
            </dl>
          </section>

          {order.returnRequest?.requested && (
            <section className="card p-5">
              <h3 className="font-display text-lg font-bold">Return request</h3>
              <p className="mt-2 text-sm text-ink-600"><b>Reason:</b> {order.returnRequest.reason}</p>
              <p className="mt-1 text-sm">Status: <b className="capitalize">{order.returnRequest.status}</b></p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
