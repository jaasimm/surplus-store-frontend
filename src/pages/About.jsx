import { Link } from 'react-router-dom';
import { Heart, Scissors, Recycle, Users } from 'lucide-react';
import SEO from '../components/SEO';

const VALUES = [
  { icon: Scissors, title: 'Honest quality', text: 'Every batch is inspected for fabric, stitching and finish before it reaches you.' },
  { icon: Recycle, title: 'Less waste', text: 'We sell surplus stock from trusted manufacturers — great clothes that would otherwise be destroyed.' },
  { icon: Heart, title: 'Fair pricing', text: 'No inflated MRPs. You pay for the garment, not for a celebrity endorsement.' },
  { icon: Users, title: 'Made in India', text: 'Sourced from mills and units across Surat, Tiruppur and Ludhiana.' },
];

export default function About() {
  return (
    <>
      <SEO title="About Us" description="Surplus Store sells premium surplus clothing at honest prices — quality first, fair pricing always." path="/about" />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Our story</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-600">
          Surplus Store started with a simple observation: perfectly good clothes were being destroyed because brands
          ordered more than they sold. We buy that surplus directly from manufacturers, inspect every piece, and pass
          the savings on to you.
        </p>
        <p className="mt-4 leading-relaxed text-ink-600">
          Today we ship thousands of orders every month across India — t-shirts, shirts, denim, dresses, kurtis and
          kids&apos; wear — with the same promise: premium fabric, honest pricing and a 7-day no-questions return
          window.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div key={v.title} className="card p-5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-ink-900 text-sand-50">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold">{v.title}</h3>
              <p className="mt-1 text-sm text-ink-600">{v.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { k: '50,000+', v: 'Happy customers' },
            { k: '1,200+', v: 'Styles listed' },
            { k: '4.6 / 5', v: 'Average rating' },
          ].map((s) => (
            <div key={s.v} className="rounded-2xl bg-ink-900 p-6 text-center text-sand-50">
              <p className="font-display text-3xl font-bold">{s.k}</p>
              <p className="mt-1 text-sm text-sand-300">{s.v}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-ink-100 bg-white p-8 text-center">
          <h2 className="font-display text-xl font-bold">Questions? We&apos;re listening.</h2>
          <p className="mt-2 text-sm text-ink-500">Our team replies within 24 hours, all week long.</p>
          <Link to="/contact" className="btn-primary mt-5 px-7 py-3">Contact us</Link>
        </div>
      </div>
    </>
  );
}
