import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Package, MapPin, Truck } from 'lucide-react';
import SEO from '../components/SEO';
import { PageLoader } from '../components/Feedback';
import api from '../api/client';
import { inr, formatDate } from '../utils/format';

/** Confirmation page — reachable only with the order number (safe to share). */
export default function OrderSuccess() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .get(`/orders/${orderNumber}`)
      .then((res) => alive && setOrder(res.data.data))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [orderNumber]);

  if (loading) return <PageLoader label="Fetching your order…" />;

  return (
    <>
      <SEO title="Order Confirmed" description="Thank you for shopping with Surplus Store." path="/checkout" noindex />
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="card p-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold sm:text-3xl">
            {order?.payment?.status === 'paid' || order?.payment?.method === 'cod' ? 'Order confirmed!' : 'Order saved'}
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {order?.payment?.status === 'pending'
              ? 'Your payment is still pending — you can retry from My Orders.'
              : `Thank you! A confirmation has been sent to ${order?.shippingAddress?.phone}.`}
          </p>

          <div className="mt-6 grid gap-3 rounded-2xl bg-ink-50 p-5 text-left text-sm">
            <div className="flex justify-between"><span className="text-ink-500">Order number</span><b>{order?.orderNumber}</b></div>
            <div className="flex justify-between"><span className="text-ink-500">Amount paid</span><b>{inr(order?.totalPrice)}</b></div>
            <div className="flex justify-between"><span className="text-ink-500">Payment</span><b className="capitalize">{order?.payment?.method === 'cod' ? 'Cash on delivery' : 'Razorpay'}</b></div>
            {order?.shippingAddress && (
              <div className="flex items-start justify-between gap-4">
                <span className="text-ink-500">Delivering to</span>
                <span className="text-right">
                  <b>{order.shippingAddress.name}</b>
                  <br />
                  {order.shippingAddress.city} — {order.shippingAddress.pincode}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-ink-500">
            <span className="flex items-center gap-1.5"><Package className="h-4 w-4" /> Packed in 24 hrs</span>
            <span className="flex items-center gap-1.5"><Truck className="h-4 w-4" /> Arrives by {formatDate(Date.now() + 5 * 86400000)}</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> Track in My Orders</span>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/account/orders" className="btn-primary px-7 py-3">Track my order</Link>
            <Link to="/shop" className="btn-outline px-7 py-3">Continue shopping</Link>
          </div>
        </div>
      </div>
    </>
  );
}
