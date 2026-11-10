import { useEffect, useState } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight, Check, X, Truck, ExternalLink } from 'lucide-react';
import { PageLoader, ErrorNote } from '../../components/Feedback';
import api, { errMsg } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { inr, formatDate, STATUS_META, PAYMENT_META, cx } from '../../utils/format';

const STATUSES = ['all', 'placed', 'packed', 'shipped', 'delivered', 'cancelled'];

/** Admin order management: search, filter, update status, handle returns. */
export default function Orders() {
  const toast = useToast();
  const [data, setData] = useState({ items: [], pagination: { page: 1, pages: 0, total: 0, limit: 20 } });
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openRow, setOpenRow] = useState('');
  const [busy, setBusy] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/orders', {
        params: { status: status === 'all' ? undefined : status, search: search || undefined, page, limit: 20 },
      });
      setData(data.data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search, page]);

  const updateStatus = async (order, next) => {
    if (next === 'cancelled' && !window.confirm(`Cancel order ${order.orderNumber}? Stock will be restored.`)) return;
    setBusy(order._id);
    try {
      const { data } = await api.patch(`/admin/orders/${order._id}/status`, { status: next });
      setData((d) => ({ ...d, items: d.items.map((o) => (o._id === order._id ? data.data : o)) }));
      toast.success(data.message);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy('');
    }
  };

  const updateShipment = async (order, shipmentData) => {
    setBusy(order._id);
    try {
      const { data } = await api.patch(`/admin/orders/${order._id}/status`, { shipment: shipmentData });
      setData((d) => ({ ...d, items: d.items.map((o) => (o._id === order._id ? data.data : o)) }));
      toast.success('Tracking details updated');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy('');
    }
  };

  const handleReturn = async (order, action) => {
    setBusy(order._id);
    try {
      const { data } = await api.patch(`/admin/orders/${order._id}/return`, { action });
      setData((d) => ({ ...d, items: d.items.map((o) => (o._id === order._id ? data.data : o)) }));
      toast.success(data.message);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Order no., phone or name…"
            className="field py-2.5 pl-9"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={cx('chip shrink-0 capitalize', status === s && 'chip-active')}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <ErrorNote>{error}</ErrorNote>

      {loading ? (
        <PageLoader label="Loading orders…" />
      ) : data.items.length === 0 ? (
        <div className="card py-20 text-center text-ink-400">No orders match these filters.</div>
      ) : (
        <div className="space-y-3">
          {data.items.map((o) => {
            const pay = PAYMENT_META[o.payment.status] || {};
            const open = openRow === o._id;
            return (
              <article key={o._id} className="card overflow-hidden">
                <button
                  onClick={() => setOpenRow(open ? '' : o._id)}
                  className="flex w-full flex-wrap items-center gap-3 px-5 py-4 text-left hover:bg-ink-50/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold tabular-nums">{o.orderNumber}</p>
                    <p className="text-xs text-ink-500">
                      {formatDate(o.createdAt)} · {o.items?.length} item(s) · {o.shippingAddress?.name}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cx('rounded-full px-2.5 py-1 text-[11px] font-bold', STATUS_META[o.status]?.color)}>{STATUS_META[o.status]?.label}</span>
                    <span className={cx('rounded-full px-2.5 py-1 text-[11px] font-bold', pay.color)}>{pay.label}</span>
                    <span className="rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-bold uppercase text-ink-700">{o.payment.method}</span>
                    <b className="ml-1 text-sm">{inr(o.totalPrice)}</b>
                    <ChevronDown className={cx('h-4 w-4 text-ink-400 transition', open && 'rotate-180')} />
                  </div>
                </button>

                {open && (
                  <div className="grid gap-6 border-t border-ink-100 p-5 lg:grid-cols-3">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wide text-ink-400">Items</h4>
                      <ul className="mt-2 space-y-2 text-sm">
                        {o.items.map((it, i) => (
                          <li key={i} className="flex justify-between gap-3">
                            <span className="line-clamp-1">{it.title} <span className="text-xs text-ink-400">({it.size} × {it.qty})</span></span>
                            <b className="shrink-0">{inr(it.price * it.qty)}</b>
                          </li>
                        ))}
                      </ul>
                      <dl className="mt-3 space-y-1 border-t border-dashed border-ink-200 pt-2 text-xs">
                        <div className="flex justify-between"><dt className="text-ink-500">Items</dt><dd>{inr(o.itemsPrice)}</dd></div>
                        {o.discount > 0 && <div className="flex justify-between text-emerald-600"><dt>Coupon {o.couponCode}</dt><dd>− {inr(o.discount)}</dd></div>}
                        <div className="flex justify-between"><dt className="text-ink-500">Shipping</dt><dd>{o.shippingPrice === 0 ? 'FREE' : inr(o.shippingPrice)}</dd></div>
                        <div className="flex justify-between font-bold"><dt>Total</dt><dd>{inr(o.totalPrice)}</dd></div>
                      </dl>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wide text-ink-400">Customer</h4>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="font-semibold">{o.shippingAddress?.name}</p>
                        <p className="tabular-nums text-ink-600">{o.shippingAddress?.phone}</p>
                        <p className="text-ink-600">{o.shippingAddress?.line1}{o.shippingAddress?.line2 ? `, ${o.shippingAddress.line2}` : ''}</p>
                        <p className="text-ink-600">{o.shippingAddress?.city}, {o.shippingAddress?.state} — {o.shippingAddress?.pincode}</p>
                        {o.user?.email && <p className="text-ink-600">{o.user.email}</p>}
                      </div>
                      {o.payment.razorpayPaymentId && (
                        <p className="mt-2 break-all text-[11px] text-ink-400">Payment id: {o.payment.razorpayPaymentId}</p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wide text-ink-400">Update status</h4>
                      <select
                        value={o.status}
                        disabled={busy === o._id || o.status === 'cancelled'}
                        onChange={(e) => updateStatus(o, e.target.value)}
                        className="field mt-2"
                      >
                        {['placed', 'packed', 'shipped', 'delivered', 'cancelled'].map((s) => (
                          <option key={s} value={s} className="capitalize">{s}</option>
                        ))}
                      </select>
                      <p className="mt-1 text-[11px] text-ink-400">
                        Marking delivered confirms COD payment. Cancelling restores stock.
                      </p>

                      <ShipmentTrackingForm
                        order={o}
                        busy={busy === o._id}
                        onSave={(shipmentData) => updateShipment(o, shipmentData)}
                      />

                      {o.returnRequest?.requested && (
                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                          <p className="text-xs font-bold text-amber-800">Return requested</p>
                          <p className="mt-1 text-xs text-amber-800">{o.returnRequest.reason}</p>
                          <div className="mt-2 flex gap-2">
                            <button onClick={() => handleReturn(o, 'approve')} disabled={busy === o._id} className="btn-primary px-3 py-1.5 text-xs">
                              <Check className="h-3.5 w-3.5" /> Approve
                            </button>
                            <button onClick={() => handleReturn(o, 'reject')} disabled={busy === o._id} className="btn-outline px-3 py-1.5 text-xs">
                              <X className="h-3.5 w-3.5" /> Reject
                            </button>
                          </div>
                          <p className="mt-2 text-[11px] text-amber-800">Current state: <b>{o.returnRequest.status}</b></p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {data.pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button className="btn-outline px-3 py-2" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm text-ink-500">Page {data.pagination.page} of {data.pagination.pages}</span>
          <button className="btn-outline px-3 py-2" disabled={page >= data.pagination.pages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}

/** Form for managing courier and live tracking links for an order. */
function ShipmentTrackingForm({ order, onSave, busy }) {
  const [courier, setCourier] = useState(order.shipment?.courier || '');
  const [trackingNumber, setTrackingNumber] = useState(order.shipment?.trackingNumber || '');
  const [trackingUrl, setTrackingUrl] = useState(order.shipment?.trackingUrl || '');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setCourier(order.shipment?.courier || '');
    setTrackingNumber(order.shipment?.trackingNumber || '');
    setTrackingUrl(order.shipment?.trackingUrl || '');
    setDirty(false);
  }, [order.shipment]);

  const autoGenerateUrl = (cName, awb) => {
    const c = (cName || '').toLowerCase().trim();
    const cleanAwb = (awb || '').trim();
    if (!cleanAwb) return '';
    if (c.includes('delhivery')) return `https://www.delhivery.com/track/package/${cleanAwb}`;
    if (c.includes('shiprocket')) return `https://shiprocket.co/tracking/${cleanAwb}`;
    if (c.includes('bluedart') || c.includes('blue dart')) return `https://www.bluedart.com/tracking?trackFor=0&trackNo=${cleanAwb}`;
    if (c.includes('dtdc')) return `https://www.dtdc.in/tracking/tracking_results.asp?Ttype=awb_no&strCNNo=${cleanAwb}`;
    if (c.includes('post') || c.includes('speed')) return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`;
    return '';
  };

  const handleCourierChange = (val) => {
    setCourier(val);
    setDirty(true);
    if (!trackingUrl || trackingUrl.includes('delhivery') || trackingUrl.includes('shiprocket') || trackingUrl.includes('bluedart')) {
      const suggested = autoGenerateUrl(val, trackingNumber);
      if (suggested) setTrackingUrl(suggested);
    }
  };

  const handleAwbChange = (val) => {
    setTrackingNumber(val);
    setDirty(true);
    if (!trackingUrl || trackingUrl.includes('delhivery') || trackingUrl.includes('shiprocket') || trackingUrl.includes('bluedart')) {
      const suggested = autoGenerateUrl(courier, val);
      if (suggested) setTrackingUrl(suggested);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ courier, trackingNumber, trackingUrl });
    setDirty(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-2xl border border-ink-200 bg-sand-50/70 p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-700">
          <Truck className="h-3.5 w-3.5 text-blue-600" /> Courier & Tracking
        </span>
        {order.shipment?.trackingNumber ? (
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            Active
          </span>
        ) : (
          <span className="text-[10px] text-ink-400">Not assigned</span>
        )}
      </div>

      <div>
        <label className="text-[11px] font-medium text-ink-600">Courier Partner</label>
        <input
          type="text"
          list={`couriers-${order._id}`}
          value={courier}
          onChange={(e) => handleCourierChange(e.target.value)}
          placeholder="e.g. Delhivery, BlueDart, Shiprocket"
          className="field mt-1 py-1.5 text-xs bg-white"
        />
        <datalist id={`couriers-${order._id}`}>
          <option value="Delhivery" />
          <option value="Shiprocket" />
          <option value="Blue Dart" />
          <option value="DTDC" />
          <option value="India Post (Speed Post)" />
          <option value="Shadowfax" />
          <option value="Xpressbees" />
        </datalist>
      </div>

      <div>
        <label className="text-[11px] font-medium text-ink-600">AWB / Tracking Number</label>
        <input
          type="text"
          value={trackingNumber}
          onChange={(e) => handleAwbChange(e.target.value)}
          placeholder="e.g. 143256789012"
          className="field mt-1 py-1.5 text-xs bg-white font-mono"
        />
      </div>

      <div>
        <label className="text-[11px] font-medium text-ink-600">Tracking Link</label>
        <div className="flex gap-1.5 mt-1">
          <input
            type="url"
            value={trackingUrl}
            onChange={(e) => { setTrackingUrl(e.target.value); setDirty(true); }}
            placeholder="https://..."
            className="field py-1.5 text-xs bg-white"
          />
          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline px-2 py-1 text-xs shrink-0 inline-flex items-center"
              title="Test tracking link"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      <div className="pt-1 flex items-center justify-between">
        <button
          type="submit"
          disabled={busy || !dirty}
          className="btn-primary py-1.5 px-3 text-xs"
        >
          {busy ? 'Saving…' : 'Save tracking'}
        </button>
        {order.shipment?.shippedAt && (
          <span className="text-[10px] text-ink-400">
            Shipped on {formatDate(order.shipment.shippedAt)}
          </span>
        )}
      </div>
    </form>
  );
}
