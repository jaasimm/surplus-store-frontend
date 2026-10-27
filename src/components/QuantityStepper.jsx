import { Minus, Plus } from 'lucide-react';
import { clamp, cx } from '../utils/format';

/** Compact +/- quantity control (works on touch). */
export default function QuantityStepper({ value, onChange, min = 1, max = 20, disabled, size = 'md' }) {
  const btn = cx(
    'flex items-center justify-center text-ink-600 transition disabled:opacity-30 enabled:hover:bg-ink-100',
    size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  );
  return (
    <div className={cx('inline-flex items-center rounded-full border border-ink-200 bg-white', size === 'sm' ? 'text-sm' : '')}>
      <button type="button" className={btn} onClick={() => onChange(clamp(value - 1, min, max))} disabled={disabled || value <= min} aria-label="Decrease quantity">
        <Minus className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </button>
      <span className={cx('min-w-[2rem] text-center font-semibold tabular-nums', size === 'sm' ? 'text-xs' : 'text-sm')}>{value}</span>
      <button type="button" className={btn} onClick={() => onChange(clamp(value + 1, min, max))} disabled={disabled || value >= max} aria-label="Increase quantity">
        <Plus className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </button>
    </div>
  );
}
