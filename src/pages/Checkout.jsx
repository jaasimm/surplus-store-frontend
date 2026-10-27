import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, MapPin, Plus, CreditCard, Banknote, Tag, X, ShieldCheck, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';
import LazyImage from '../components/LazyImage';
import { PageLoader, ErrorNote, ButtonSpinner } from '../components/Feedback';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { errMsg, ensureFreshSession } from '../api/client';
import { loadRazorpay } from '../utils/razorpay';
import { inr, cx } from '../utils/format';

const EMPTY_FORM = { name: '', phone: '', pincode: '', line1: '', line2: '', city: '', state: '', isDefault: true };

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, refresh } = useCart();
  const { user, isAuthenticated, booting, requireLogin } = useAuth();
  const toast = useToast();

  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const [method, setMethod] = useState('razorpay');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const [pending, setPending] = useState(null); // unpaid order waiting for a payment attempt
  const [mock, setMock] = useState(null); // { rzp, order } in offline/test mode
  const [mockBusy, setMockBusy] = useState(false);

  /* login is required to reach checkout — requested from the cart / nav */
  useEffect(() => {
    if (!booting && !isAuthenticated) {
      requireLogin('Login to complete your order — we never store passwords, only an OTP', () => navigate(0));
    }
  }, [booting, isAuthenticated, requireLogin, navigate]);

  useEffect(() => {
    if (user?.addresses) {
      setAddresses(user.addresses);
      setSelectedId((prev) => prev || user.addresses.find((a) => a.isDefault)?._id || user.addresses[0]?._id || '');
    }
  }, [user]);

  /* an empty bag has nothing to check out */
  useEffect(() => {
    if (!placing && !pending && !booting && cart.items.length === 0) navigate('/cart', { replace: true });
  }, [cart.items.length, placing, pending, booting, navigate]);

  /* ------------------------------------------------------------ coupon */
  const applyCoupon = async (e) => {
    e?.preventDefault();
    setCouponError('');
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await api.post('/coupons/validate', { code: couponInput.trim(), subtotal: cart.itemsPrice });
      setCoupon(data.data);
      toast.success(data.message);
    } catch (err) {
      setCoupon(null);
      setCouponError(errMsg(err));
    } finally {
      setCouponLoading(false);
    }
  };

  /* ------------------------------------------------------------- address */
  const validateForm = () => {
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Enter the full name';
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, '').slice(-10))) errs.phone = 'Enter a 10-digit mobile number';
    if (!/^\d{6}$/.test(form.pincode)) errs.pincode = 'Pincode must be 6 digits';
    if (form.line1.trim().length < 4) errs.line1 = 'Enter house / street details';
    if (form.city.trim().length < 2) errs.city = 'Enter city';
    if (form.state.trim().length < 2) errs.state = 'Enter state';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const { data } = await api.post('/users/addresses', form);
      setAddresses(data.data);
      setSelectedId(data.data[data.data.length - 1]._id);
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success('Address saved');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  /* ------------------------------------------------------------ payment */
  /**
   * A 401 here means the session died mid-checkout (the access token only
   * lives 15 minutes). Rather than a raw error, recover or ask for a re-login.
   */
  const authExpired = useCallback(() => {
    setError('Your session expired. Please log in again — your bag and address are kept.');
    requireLogin('Your session expired — log in again to complete this order');
  }, [requireLogin]);

  /** Renew the session when possible; returns false when a re-login is needed. */
  const recoverSession = useCallback(async () => {
    if (await ensureFreshSession()) return true;
    authExpired();
    return false;
  }, [authExpired]);

  const verifyPayment = useCallback(
    async (order, payload) => {
      const attempt = () =>
        api.post('/orders/verify-payment', {
          orderId: order.id,
          razorpayOrderId: payload.razorpay_order_id || payload.orderId,
          razorpayPaymentId: payload.razorpay_payment_id || payload.paymentId,
          signature: payload.signature || payload.sig,
        });

      let response;
      try {
        response = await attempt();
      } catch (err) {
        // Session expired between opening the modal and confirming payment —
        // refresh once and replay the verification (the payment already went
        // through on Razorpay's side, so never lose this).
        if (err?.response?.status === 401 && (await ensureFreshSession())) {
          response = await attempt();
        } else if (err?.response?.status === 401) {
          authExpired();
          setPending(order); // keep the order so the user can retry after login
          throw err;
        } else {
          throw err;
        }
      }

      const { data } = response;
      await refresh();
      toast.success(data.message);
      navigate(`/order-success/${order.orderNumber}`, { replace: true });
      return data;
    },
    [navigate, refresh, toast, authExpired]
  );

  /** Open Razorpay (or the offline mock sheet when no keys are configured). */
  const startPayment = useCallback(
    async (order, rzp) => {
      if (!rzp.mock && rzp.keyId) {
        try {
          await loadRazorpay();
          const options = {
            key: rzp.keyId,
            order_id: rzp.orderId,
            amount: rzp.amount,
            currency: rzp.currency,
            name: 'Surplus Store',
            description: `Order ${order.orderNumber}`,
            image: '/favicon.ico',
            prefill: rzp.prefill || {},
            theme: { color: '#1c1d1a' },
            handler: async (response) => {
              try {
                await verifyPayment(order, response);
              } catch (err) {
                setError(errMsg(err));
                toast.error(errMsg(err));
              }
            },
            modal: {
              ondismiss: () => {
                api.post(`/orders/${order.id}/payment-failed`).catch(() => {});
                setPending(order);
                setError('Payment cancelled. You can retry below.');
              },
            },
          };
          new window.Razorpay(options).open();
        } catch (err) {
          setError(errMsg(err));
        }
        return;
      }
      // ---- offline / test mode: show our own payment sheet ----
      setMock({ order, rzp });
    },
    [verifyPayment, toast]
  );

  const placeOrder = async () => {
    setError('');
    if (!selectedId && !showForm) {
      setError('Please select or add a delivery address');
      return;
    }
    if (showForm && !validateForm()) return;

    setPlacing(true);
    try {
      // Renew the access token first if the tab has been open a while, so the
      // order isn't created and then blocked by an expired session.
      if (!(await recoverSession())) return;

      const payload = {
        paymentMethod: method,
        couponCode: coupon?.code || undefined,
        ...(selectedId ? { addressId: selectedId } : { address: form }),
      };
      const { data } = await api.post('/orders', payload);
      const order = data.data.order;

      if (method === 'cod') {
        await refresh();
        toast.success('Order placed!');
        navigate(`/order-success/${order.orderNumber}`, { replace: true });
        return;
      }
      setPending(order);
      await startPayment(order, data.data.razorpay);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setPlacing(false);
    }
  };

  /* -------------------------------------------- mock sheet actions */
  const mockSuccess = async () => {
    setMockBusy(true);
    try {
      await verifyPayment(mock.order, {
        razorpay_order_id: mock.rzp.orderId,
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        signature: 'mock_signature_verified_server_side',
      });
    } catch (err) {
      setError(errMsg(err));
      toast.error(errMsg(err));
    } finally {
      setMockBusy(false);
      setMock(null);
    }
  };

  const mockFail = async () => {
    setMockBusy(true);
    try {
      await api.post(`/orders/${mock.order.id}/payment-failed`);
      setError('Payment failed. Nothing was charged — please retry.');
    } catch {
      /* ignore */
    } finally {
      setMockBusy(false);
      setMock(null);
    }
  };

  const retryPayment = async () => {
    setError('');
    setPlacing(true);
    try {
      if (!(await recoverSession())) return;
      const { data } = await api.post(`/orders/${pending.id}/retry-payment`);
      setPending(data.data.order);
      await startPayment(data.data.order, data.data.razorpay);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setPlacing(false);
    }
  };

  /* ------------------------------------------------------------ render */
  if (booting || !isAuthenticated) return <PageLoader label="Preparing checkout…" />;

  const shipping = cart.itemsPrice >= 999 || cart.itemsPrice === 0 ? 0 : 79;
  const grandTotal = Math.max(0, cart.itemsPrice - (coupon?.discount || 0)) + shipping;

  return (
    <>
      <SEO title="Checkout" description="Complete your Surplus Store order." path="/checkout" noindex />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Checkout</h1>

        {/* progress */}
        <ol className="mt-4 flex items-center gap-2 text-xs font-semibold text-ink-400">
          {['Bag', 'Address', 'Payment'].map((s, i) => (
            <li key={s} className={cx('flex items-center gap-2', i > 0 && 'before:h-px before:w-6 before:bg-ink-200')}>
              <span className={cx('grid h-6 w-6 place-items-center rounded-full', i === 0 ? 'bg-ink-200 text-ink-600' : 'bg-ink-900 text-sand-50')}>{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            <ErrorNote>{error}</ErrorNote>

            {/* --------------------------------------------- address */}
            <section className="card p-5">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                  <MapPin className="h-5 w-5" /> Delivery address
                </h2>
                {!showForm && (
                  <button onClick={() => setShowForm(true)} className="btn-ghost px-3 py-1.5 text-xs">
                    <Plus className="h-4 w-4" /> Add new
                  </button>
                )}
              </div>

              {addresses.length > 0 && !showForm && (
                <div className="mt-4 space-y-2">
                  {addresses.map((a) => (
                    <label
                      key={a._id}
                      className={cx(
                        'flex cursor-pointer gap-3 rounded-2xl border p-4 transition',
                        selectedId === a._id ? 'border-ink-900 bg-ink-50' : 'border-ink-200 hover:border-ink-400'
                      )}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedId === a._id}
                        onChange={() => setSelectedId(a._id)}
                        className="mt-1 h-4 w-4 border-ink-300 text-ink-900 focus:ring-ink-900"
                      />
                      <div className="text-sm">
                        <p className="font-semibold">{a.name} <span className="ml-2 text-xs font-normal text-ink-400">{a.phone}</span></p>
                        <p className="mt-1 text-ink-600">{a.line1}{a.line2 ? `, ${a.line2}` : ''}</p>
                        <p className="text-ink-600">{a.city}, {a.state} — {a.pincode}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {showForm && (
                <form onSubmit={saveAddress} className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="addr-name">Full name</label>
                    <input id="addr-name" className={cx('field', formErrors.name && 'field-error')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Priya Sharma" />
                    {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
                  </div>
                  <div>
                    <label className="label" htmlFor="addr-phone">Mobile number</label>
                    <input id="addr-phone" inputMode="numeric" className={cx('field', formErrors.phone && 'field-error')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="98765 43210" />
                    {formErrors.phone && <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>}
                  </div>
                  <div>
                    <label className="label" htmlFor="addr-pin">Pincode</label>
                    <input id="addr-pin" inputMode="numeric" className={cx('field', formErrors.pincode && 'field-error')} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="400001" />
                    {formErrors.pincode && <p className="mt-1 text-xs text-red-600">{formErrors.pincode}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="addr-line1">House no., building, street</label>
                    <input id="addr-line1" className={cx('field', formErrors.line1 && 'field-error')} value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} placeholder="B-402, Sunrise Apartments" />
                    {formErrors.line1 && <p className="mt-1 text-xs text-red-600">{formErrors.line1}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="addr-line2">Area, landmark (optional)</label>
                    <input id="addr-line2" className="field" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} placeholder="Near City Mall" />
                  </div>
                  <div>
                    <label className="label" htmlFor="addr-city">City</label>
                    <input id="addr-city" className={cx('field', formErrors.city && 'field-error')} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Mumbai" />
                    {formErrors.city && <p className="mt-1 text-xs text-red-600">{formErrors.city}</p>}
                  </div>
                  <div>
                    <label className="label" htmlFor="addr-state">State</label>
                    <input id="addr-state" className={cx('field', formErrors.state && 'field-error')} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="Maharashtra" />
                    {formErrors.state && <p className="mt-1 text-xs text-red-600">{formErrors.state}</p>}
                  </div>
                  <label className="flex items-center gap-2 text-sm sm:col-span-2">
                    <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="h-4 w-4 rounded border-ink-300 text-ink-900 focus:ring-ink-900" />
                    Save this address for future orders
                  </label>
                  <div className="flex gap-2 sm:col-span-2">
                    <button type="submit" className="btn-primary">Save address</button>
                    <button type="button" onClick={() => { setShowForm(false); setFormErrors({}); }} className="btn-ghost">Cancel</button>
                  </div>
                </form>
              )}

              {addresses.length === 0 && !showForm && (
                <button onClick={() => setShowForm(true)} className="btn-outline mt-4 w-full py-3">
                  <Plus className="h-4 w-4" /> Add delivery address
                </button>
              )}
            </section>

            {/* ---------------------------------------------- payment */}
            <section className="card p-5">
              <h2 className="font-display text-lg font-bold">Payment method</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { key: 'razorpay', icon: CreditCard, title: 'UPI / Card / Net Banking', sub: 'Powered by Razorpay — 100% secure' },
                  { key: 'cod', icon: Banknote, title: 'Cash on Delivery', sub: 'Pay when it arrives at your door' },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    className={cx(
                      'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition',
                      method === opt.key ? 'border-ink-900 bg-ink-50' : 'border-ink-200 hover:border-ink-400'
                    )}
                  >
                    <input type="radio" name="payment" checked={method === opt.key} onChange={() => setMethod(opt.key)} className="mt-1 h-4 w-4 border-ink-300 text-ink-900 focus:ring-ink-900" />
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold"><opt.icon className="h-4 w-4" /> {opt.title}</p>
                      <p className="mt-0.5 text-xs text-ink-500">{opt.sub}</p>
                    </div>
                  </label>
                ))}
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-500">
                <ShieldCheck className="h-3.5 w-3.5" /> Payments are verified on our server before the order is confirmed.
              </p>
            </section>
          </div>

          {/* ------------------------------------------------ summary */}
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <div className="card p-5">
              <h2 className="font-display text-lg font-bold">Order summary</h2>

              <ul className="mt-4 max-h-56 space-y-3 overflow-y-auto pr-1">
                {cart.items.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <div className="w-14 shrink-0">
                      <LazyImage src={item.image} alt={item.title} ratio="aspect-[4/5]" className="rounded-lg" label={item.title} />
                    </div>
                    <div className="min-w-0 flex-1 text-xs">
                      <p className="line-clamp-1 font-semibold">{item.title}</p>
                      <p className="text-ink-500">Size {item.size} · Qty {item.qty}</p>
                    </div>
                    <p className="text-xs font-semibold">{inr(item.price * item.qty)}</p>
                  </li>
                ))}
              </ul>

              {/* coupon */}
              <form onSubmit={applyCoupon} className="mt-4 flex gap-2">
                <div className="relative flex-1">
                  <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    className="field py-2.5 pl-9 text-sm"
                    disabled={Boolean(coupon)}
                  />
                </div>
                {coupon ? (
                  <button type="button" onClick={() => { setCoupon(null); setCouponInput(''); }} className="btn-ghost px-3">
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <button type="submit" className="btn-outline px-4 py-2.5" disabled={couponLoading}>
                    {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                  </button>
                )}
              </form>
              {couponError && <p className="mt-2 text-xs text-red-600">{couponError}</p>}
              {coupon && (
                <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  <b>{coupon.code}</b> applied — you save <b>{inr(coupon.discount)}</b>
                </p>
              )}

              <dl className="mt-4 space-y-2 border-t border-dashed border-ink-200 pt-4 text-sm">
                <div className="flex justify-between"><dt className="text-ink-500">Items ({cart.count})</dt><dd>{inr(cart.itemsPrice)}</dd></div>
                {coupon?.discount > 0 && (
                  <div className="flex justify-between text-emerald-600"><dt>Coupon discount</dt><dd>− {inr(coupon.discount)}</dd></div>
                )}
                <div className="flex justify-between"><dt className="text-ink-500">Shipping</dt><dd>{shipping === 0 ? 'FREE' : inr(shipping)}</dd></div>
                <div className="flex justify-between border-t border-ink-100 pt-2.5 text-base font-bold"><dt>Total payable</dt><dd>{inr(grandTotal)}</dd></div>
              </dl>

              {pending ? (
                <div className="mt-5 space-y-2">
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Your order <b>{pending.orderNumber}</b> is saved but the payment is pending.
                  </p>
                  <button onClick={retryPayment} disabled={placing} className="btn-primary w-full py-3">
                    {placing ? <ButtonSpinner label="Starting…" /> : 'Retry payment'}
                  </button>
                </div>
              ) : (
                <button onClick={placeOrder} disabled={placing || cart.items.length === 0} className="btn-primary mt-5 w-full py-3">
                  {placing ? <ButtonSpinner label="Placing order…" /> : method === 'cod' ? `Place order · ${inr(grandTotal)}` : `Pay ${inr(grandTotal)}`}
                </button>
              )}

              <Link to="/cart" className="btn-ghost mt-2 w-full">Back to bag</Link>
            </div>
          </aside>
        </div>
      </div>

      {/* ---------------------------------------- mock payment sheet (test mode) */}
      {mock && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" />
          <div className="safe-bottom relative w-full max-w-md rounded-t-3xl bg-white p-6 shadow-pop sm:rounded-3xl">
            <h3 className="font-display text-lg font-bold">Test payment</h3>
            <p className="mt-1 text-sm text-ink-500">
              Razorpay keys are not configured, so a simulated checkout is used. No real money moves.
            </p>
            <dl className="mt-4 space-y-2 rounded-2xl bg-ink-50 p-4 text-sm">
              <div className="flex justify-between"><dt className="text-ink-500">Order</dt><dd className="font-semibold">{mock.order.orderNumber}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Amount</dt><dd className="font-semibold">{inr(mock.order.totalPrice)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Method</dt><dd className="font-semibold">UPI / Card (simulated)</dd></div>
            </dl>
            <div className="mt-5 flex gap-2">
              <button onClick={mockSuccess} disabled={mockBusy} className="btn-primary flex-1 py-3">
                {mockBusy ? <ButtonSpinner /> : 'Simulate success'}
              </button>
              <button onClick={mockFail} disabled={mockBusy} className="btn-outline flex-1 py-3">Simulate failure</button>
            </div>
            <button onClick={() => setMock(null)} className="btn-ghost mt-2 w-full">Cancel</button>
          </div>
        </div>
      )}

      {placing && !mock && (
        <div className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-sand-50 shadow-pop">
          <Check className="mr-1 inline h-3.5 w-3.5" /> Securely processing…
        </div>
      )}
    </>
  );
}
