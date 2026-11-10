/**
 * Stored image URLs come in three shapes:
 *   1. absolute  https://… (Cloudinary / the API host)  → use as-is
 *   2. relative   /uploads/seed/…  → only works on the API's own host
 *   3. data:/blob: in-memory previews                     → use as-is
 *
 * The site is served from a different origin than the API (Netlify + Render),
 * and Netlify's SPA fallback answers `/uploads/…` with index.html — which is
 * why seed images rendered as broken placeholders. Case 2 is therefore
 * resolved against the API origin: the Vite dev proxy in development, the
 * configured VITE_API_URL when hosted.
 */
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function resolveImgSrc(url) {
  if (!url || typeof url !== 'string') return url;
  if (!url.startsWith('/')) return url; // absolute http(s), data:, blob:, '//'

  try {
    const { origin } = new URL(API_BASE, window.location.href);
    return new URL(url, origin).href;
  } catch {
    return url;
  }
}

export default resolveImgSrc;
