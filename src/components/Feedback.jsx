import { Loader2 } from 'lucide-react';
import { cx } from '../utils/format';

export function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={cx('animate-spin', className)} />;
}

export function ButtonSpinner({ label = 'Please wait…' }) {
  return (
    <>
      <Spinner className="h-4 w-4" />
      {label}
    </>
  );
}

/** Full-page loading state. */
export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-ink-500">
      <Spinner className="h-8 w-8 text-ink-400" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

/** Product-grid skeleton used while the catalogue loads. */
export function ProductSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="skeleton aspect-[4/5] rounded-2xl" />
          <div className="skeleton h-3 w-3/4 rounded-full" />
          <div className="skeleton h-3 w-1/2 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Inline alert used for form / API errors. */
export function ErrorNote({ children, className = '' }) {
  if (!children) return null;
  return (
    <p className={cx('rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700', className)} role="alert">
      {children}
    </p>
  );
}
