/** ₹ formatting + small display helpers. */

export const inr = (value, { decimals = 0 } = {}) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(Number(value) || 0);

export const formatDate = (value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  value ? new Date(value).toLocaleDateString('en-IN', opts) : '—';

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—';

export const STATUS_META = {
  placed: { label: 'Placed', color: 'bg-amber-100 text-amber-800', step: 1 },
  packed: { label: 'Packed', color: 'bg-sky-100 text-sky-800', step: 2 },
  shipped: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-800', step: 3 },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-800', step: 4 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', step: 0 },
};

export const PAYMENT_META = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800' },
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-800' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', color: 'bg-ink-100 text-ink-700' },
  cod_pending: { label: 'Pay on delivery', color: 'bg-amber-100 text-amber-800' },
};

export const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

export const cx = (...parts) => parts.filter(Boolean).join(' ');
