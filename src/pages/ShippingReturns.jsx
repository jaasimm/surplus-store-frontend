import { Link } from 'react-router-dom';
import { Truck, RotateCcw, Package, IndianRupee } from 'lucide-react';
import SEO from '../components/SEO';

const SECTIONS = [
  {
    icon: Truck,
    title: 'Shipping',
    points: [
      'Orders placed before 2 PM are dispatched the same working day; all others within 24 hours.',
      'Standard delivery takes 3–7 working days depending on your pincode. metros usually receive orders in 2–3 days.',
      'Shipping is FREE on orders of ₹999 and above. Below that, a flat ₹79 applies.',
      'You will receive an SMS with the tracking link as soon as the parcel is shipped.',
      'We currently deliver across India, including J&K and the North-East.',
    ],
  },
  {
    icon: RotateCcw,
    title: 'Returns & exchange',
    points: [
      'Raise a return from My Orders within 7 days of delivery.',
      'Items must be unworn, unwashed and carry their original tags and packaging.',
      'Pickup is arranged by our courier partner at no extra cost in most serviceable pincodes.',
      'Refunds are credited to the original payment method within 5–7 working days of the parcel reaching us (COD orders are refunded to a bank account/UPI we collect over SMS).',
      'Exchanges for a different size are subject to availability; we will confirm over SMS.',
      'Items like innerwear, masks and anything altered or damaged are not eligible for return for hygiene reasons.',
    ],
  },
  {
    icon: Package,
    title: 'Order tracking',
    points: [
      'Log in with your mobile number and open My Orders to see live status: Placed → Packed → Shipped → Delivered.',
      'Need to change something? Orders can be cancelled while they are still in the Placed or Packed stage.',
      'If a parcel arrives damaged, share a photo within 48 hours and we will replace it free of charge.',
    ],
  },
  {
    icon: IndianRupee,
    title: 'Payments & refunds',
    points: [
      'We accept UPI, credit/debit cards, net banking, wallets and Cash on Delivery.',
      'Online payments are processed by Razorpay and verified on our servers — we never store card details.',
      'Failed payments are auto-reversed by your bank within 5–7 working days.',
      'Use code WELCOME10 for 10% off your first order (up to ₹300).',
    ],
  },
];

export default function ShippingReturns() {
  return (
    <>
      <SEO title="Shipping & Returns" description="Shipping timelines, free shipping thresholds, 7-day return policy, exchanges and refund timelines for Surplus Store orders." path="/shipping-returns" />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Shipping & Returns</h1>
        <p className="mt-2 text-ink-500">Everything you need to know about delivery, returns and refunds.</p>

        <div className="mt-8 space-y-6">
          {SECTIONS.map((s) => (
            <section key={s.title} className="card p-6">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold">
                <s.icon className="h-5 w-5" /> {s.title}
              </h2>
              <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-ink-600">
                {s.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-400" />
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-3xl bg-ink-900 p-6 text-center text-sand-50">
          <p className="text-sm">Still have a question?</p>
          <Link to="/contact" className="btn mt-4 bg-sand-50 px-7 py-3 text-ink-900 hover:bg-white">Contact our team</Link>
        </div>
      </div>
    </>
  );
}
