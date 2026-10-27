import { useState } from 'react';
import { cx } from '../utils/format';

/** Inline placeholder used when an image fails to load. */
const fallback = (label = 'Surplus Store') => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e7e7e2"/><stop offset="100%" stop-color="#cfd0c8"/>
    </linearGradient></defs>
    <rect width="800" height="1000" fill="url(#g)"/>
    <text x="50%" y="49%" text-anchor="middle" font-family="Georgia, serif" font-size="46" fill="#62655a">${label}</text>
    <text x="50%" y="55%" text-anchor="middle" font-family="Helvetica, Arial" font-size="24" letter-spacing="6" fill="#7e8175">SURPLUS STORE</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/**
 * Responsive, lazy-loaded image with a shimmer placeholder and graceful fallback.
 * `ratio` accepts any Tailwind aspect class (default 4/5 — apparel portrait).
 */
export default function LazyImage({ src, alt = '', ratio = 'aspect-[4/5]', className = '', sizes, label }) {
  const [state, setState] = useState('loading'); // loading | loaded | error

  return (
    <div className={cx('relative overflow-hidden bg-ink-100', ratio, className)}>
      {state === 'loading' && <div className="absolute inset-0 skeleton" aria-hidden="true" />}
      <img
        src={state === 'error' ? fallback(label || alt?.slice(0, 18)) : src}
        alt={alt}
        loading="lazy"
        decoding="async"
        sizes={sizes}
        onLoad={() => setState('loaded')}
        onError={() => setState('error')}
        className={cx(
          'h-full w-full object-cover transition duration-700 ease-out',
          state === 'loaded' ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
        )}
      />
    </div>
  );
}
