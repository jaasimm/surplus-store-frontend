import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, Tag } from 'lucide-react';
import SEO from '../components/SEO';
import LazyImage from '../components/LazyImage';
import QuantityStepper from '../components/QuantityStepper';
import { PageLoader } from '../components/Feedback';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { inr } from '../utils/format';

const FREE_SHIPPING_ABOVE = 999;
const SHIPPING_FEE = 79;

export default function CartPage() {
  const { cart, loading, busyId, updateQty, removeItem } = useCart();
  const { isAuthenticated, requireLogin } = useAuth();
  const navigate = useNavigate();

  const subtotal = cart.itemsPrice;
  const mrpSavings = cart.mrpTotal - cart.itemsPrice;
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;
  const toFreeShipping = Math.max(0, FREE_SHIPPING_ABOVE - subtotal);

  const checkout = () => {
    if (!isAuthenticated) {
      // Login is requested ONLY here — browsing and cart work without an account.
      requireLogin('Login to complete your order — it takes 10 seconds with an OTP', () => navigate('/checkout'));
      return;
    }
    navigate('/checkout');
  };

  if (loading) return <PageLoader label="Loading your bag…" />;

  return (
    <>
      <SEO title="Shopping Bag" description="Review the items in your Surplus Store shopping bag." path="/cart" noindex />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Your bag</h1>
        <p className="mt-1 text-sm text-ink-500">
          {cart.count} item{cart.count === 1 ? '' : 's'} · no login needed until checkout
        </p>

        {cart.items.length === 0 ? (
          <div className="mt-10 flex flex-col items-center rounded-3xl border border-dashed border-ink-200 bg-white py-20 text-center">
            <ShoppingBag className="h-10 w-10 text-ink-300" />
            <h2 className="mt-4 font-display text-xl font-bold">Your bag is empty</h2>
            <p className="mt-1 max-w-xs text-sm text-ink-500">
              Looks like you haven&apos;t added anything yet. Explore the latest drops.
            </p>
            <Link to="/shop" className="btn-primary mt-6 px-8 py-3">Start shopping</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
            {/* --------------------------------------------------- items */}
            <div className="space-y-4">
              {toFreeShipping > 0 && (
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Add <b>{inr(toFreeShipping)}</b> more to unlock <b>free shipping</b> 🚚
                </div>
              )}

              {cart.items.map((item) => (
                <div key={item.id} className="card flex gap-4 p-3 sm:p-4">
                  <Link to={`/product/${item.slug || ''}`} className="w-24 shrink-0 sm:w-28">
                    <LazyImage src={item.image} alt={item.title} ratio="aspect-[4/5]" className="rounded-xl" label={item.title} />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="line-clamp-1 text-sm font-semibold sm:text-base">{item.title}</h3>
                        <p className="mt-0.5 text-xs text-ink-500">
                          Size {item.size}{item.color ? ` · ${item.color}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.title}`}
                        className="p-1 text-ink-400 transition hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                      <div className="flex items-center gap-3">
                        <QuantityStepper
                          size="sm"
                          value={item.qty}
                          onChange={(qty) => updateQty(item.id, qty)}
                          disabled={busyId === item.id}
                          max={20}
                        />
                        <span className="text-xs text-ink-400">max 20</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{inr(item.price * item.qty)}</p>
                        {item.mrp > item.price && (
                          <p className="text-xs text-ink-400 line-through">{inr(item.mrp * item.qty)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ------------------------------------------------- summary */}
            <aside className="lg:sticky lg:top-32 lg:self-start">
              <div className="card p-5">
                <h2 className="font-display text-lg font-bold">Order summary</h2>

                <dl className="mt-4 space-y-2.5 text-sm">
                  <div className="flex justify-between"><dt className="text-ink-500">Item total</dt><dd className="font-medium">{inr(subtotal)}</dd></div>
                  {mrpSavings > 0 && (
                    <div className="flex justify-between text-emerald-600"><dt>You save</dt><dd className="font-medium">− {inr(mrpSavings)}</dd></div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-ink-500">Shipping</dt>
                    <dd className="font-medium">{shipping === 0 ? 'FREE' : inr(shipping)}</dd>
                  </div>
                  <div className="border-t border-dashed border-ink-200 pt-2.5 text-base">
                    <div className="flex justify-between font-bold"><dt>Total</dt><dd>{inr(total)}</dd></div>
                  </div>
                </dl>

                <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-500">
                  <Tag className="h-3.5 w-3.5" /> Coupons can be applied at checkout
                </p>

                <button onClick={checkout} className="btn-primary mt-5 w-full py-3">
                  {isAuthenticated ? 'Proceed to checkout' : 'Login & checkout'} <ArrowRight className="h-4 w-4" />
                </button>

                <Link to="/shop" className="btn-ghost mt-2 w-full">Continue shopping</Link>
              </div>

              <div className="mt-4 rounded-2xl border border-ink-100 bg-white p-4 text-xs text-ink-500">
                <p className="font-semibold text-ink-800">Why shop with us?</p>
                <ul className="mt-2 space-y-1.5">
                  <li>✓ 7-day easy returns &amp; exchange</li>
                  <li>✓ COD available across India</li>
                  <li>✓ Secure UPI / card / net-banking payments</li>
                </ul>
              </div>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
