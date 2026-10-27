import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Instagram, Facebook, Twitter } from 'lucide-react';

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { to: '/shop?gender=men', label: 'Men' },
      { to: '/shop?gender=women', label: 'Women' },
      { to: '/shop?gender=kids', label: 'Kids' },
      { to: '/shop?sort=newest', label: 'New Arrivals' },
      { to: '/shop?sort=popularity', label: 'Best Sellers' },
    ],
  },
  {
    title: 'Help',
    links: [
      { to: '/contact', label: 'Contact Us' },
      { to: '/shipping-returns', label: 'Shipping & Returns' },
      { to: '/account/orders', label: 'Track Order' },
      { to: '/about', label: 'FAQs' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About Us' },
      { to: '/privacy', label: 'Privacy Policy' },
      { to: '/shipping-returns', label: 'Terms of Service' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl font-extrabold text-white">Surplus<span className="text-blue-500">.</span></span>
              <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-blue-400">Store</span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
              Premium quality clothing at honest, surplus pricing. Designed in India, delivered to your doorstep with
              easy returns and cash on delivery.
            </p>
            <div className="mt-5 space-y-2 text-sm text-slate-400">
              <p className="flex items-center gap-2.5"><Phone className="h-4 w-4 text-blue-400" /> +91 98765 43210</p>
              <p className="flex items-center gap-2.5"><Mail className="h-4 w-4 text-blue-400" /> care@surplusstore.in</p>
              <p className="flex items-center gap-2.5"><MapPin className="h-4 w-4 text-blue-400" /> 402, Textile Market, Surat, Gujarat 395002</p>
            </div>
            <div className="mt-6 flex gap-2.5">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a key={i} href="#" aria-label="Social link" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-blue-500 hover:bg-blue-600 hover:text-white">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label + l.to}>
                    <Link to={l.to} className="text-sm text-slate-400 transition hover:text-white hover:underline underline-offset-4">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800/80 pt-6 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Surplus Store. All rights reserved.</p>
          <p className="flex flex-wrap items-center justify-center gap-2">
            <span>Secure payments:</span>
            <span className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5 font-medium text-slate-300">UPI</span>
            <span className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5 font-medium text-slate-300">Cards</span>
            <span className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5 font-medium text-slate-300">Net Banking</span>
            <span className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5 font-medium text-slate-300">COD</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
