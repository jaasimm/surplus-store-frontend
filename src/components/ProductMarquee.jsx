import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import LazyImage from './LazyImage';
import { inr, cx } from '../utils/format';

/**
 * Endless strip of PRODUCT IMAGES travelling across the screen.
 *
 * The track holds four identical `.marquee-group` copies; translating it by
 * -50% (two whole groups) loops seamlessly with no jump. The item list is
 * repeated first so a single group is always wider than a big desktop
 * viewport — otherwise a gap opens up at the right edge.
 */
export default function ProductMarquee({ items = [], reverse = false, minGroup = 16, className = '' }) {
  const strip = useMemo(() => {
    if (!items.length) return [];
    let out = items;
    for (let i = 0; out.length < minGroup && i < 8; i += 1) out = out.concat(items);
    return out.slice(0, 48);
  }, [items, minGroup]);

  if (!strip.length) return null;

  const renderGroup = (copy) => (
    <div className="marquee-group" aria-hidden={copy > 0 ? 'true' : undefined}>
      {strip.map((p) => (
        <Link
          key={`${copy}-${p.id}`}
          to={`/product/${p.slug}`}
          tabIndex={copy > 0 ? -1 : undefined}
          className="group w-32 shrink-0 sm:w-44 lg:w-52"
        >
          <div className="relative overflow-hidden rounded-2xl bg-ink-100">
            <LazyImage
              src={p.images?.[0]?.url}
              alt={p.images?.[0]?.alt || p.title}
              label={p.title.split(' ')[0]}
              className="transition duration-500 group-hover:scale-[1.04]"
            />
            {p.discountPercent > 0 && (
              <span className="absolute left-2 top-2 rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                {p.discountPercent}% off
              </span>
            )}
            {!p.inStock && (
              <span className="absolute inset-0 flex items-center justify-center bg-white/80 text-[11px] font-bold uppercase tracking-wider text-ink-700 backdrop-blur-[2px]">
                Sold out
              </span>
            )}
          </div>
          <p className="mt-2 line-clamp-1 text-[13px] font-medium text-ink-800 transition-colors group-hover:text-blue-600">
            {p.title}
          </p>
          <p className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-ink-900">{inr(p.price)}</span>
            {p.mrp > p.price && <span className="text-[11px] font-normal text-ink-400 line-through">{inr(p.mrp)}</span>}
          </p>
        </Link>
      ))}
    </div>
  );

  return (
    <div className={cx('marquee product-marquee', reverse && 'is-reverse', className)}>
      <div className="marquee-track">{[0, 1, 2, 3].map(renderGroup)}</div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent sm:w-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent sm:w-20" />
    </div>
  );
}
