import { Star } from 'lucide-react';
import { cx } from '../utils/format';

/** Star rating display (read-only) with optional review count. */
export default function Rating({ value = 0, count, className = '' }) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <div className={cx('flex items-center gap-1', className)}>
      <div className="flex" aria-label={`Rated ${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={cx('h-3.5 w-3.5', n <= rounded ? 'fill-amber-400 text-amber-400' : 'fill-ink-200 text-ink-200')}
          />
        ))}
      </div>
      {count !== undefined && <span className="text-xs text-ink-400">({count})</span>}
    </div>
  );
}
