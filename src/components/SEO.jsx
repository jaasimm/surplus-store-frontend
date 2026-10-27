import { Helmet } from 'react-helmet-async';

/**
 * Per-page SEO tags (title, description, canonical, Open Graph).
 * Usage: <SEO title="Shop Men" description="..." path="/shop?gender=men" />
 */
export default function SEO({ title, description, path = '/', image, noindex = false, jsonLd }) {
  const site = 'Surplus Store';
  const fullTitle = title ? `${title} · ${site}` : `${site} — Fashion for Men, Women & Kids`;
  const url = `https://surplusstore.in${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
