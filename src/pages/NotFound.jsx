import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import SEO from '../components/SEO';

export default function NotFound() {
  return (
    <>
      <SEO title="Page not found" description="This page does not exist." path="/404" noindex />
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <Compass className="h-10 w-10 text-ink-300" />
        <h1 className="mt-4 font-display text-5xl font-bold">404</h1>
        <p className="mt-2 text-ink-500">This page went out of stock. Let&apos;s get you back to the good stuff.</p>
        <div className="mt-6 flex gap-3">
          <Link to="/" className="btn-primary px-6">Go home</Link>
          <Link to="/shop" className="btn-outline px-6">Browse products</Link>
        </div>
      </div>
    </>
  );
}
