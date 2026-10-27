import SEO from '../components/SEO';

const SECTIONS = [
  {
    title: '1. Information we collect',
    body: [
      'Mobile number — used as your account identifier and to send order/OTP messages. We never ask for a password.',
      'Delivery details — name, address, pincode and phone number, stored so we can ship your orders.',
      'Order and payment metadata — order numbers, amounts and Razorpay payment ids. Card and UPI credentials are handled entirely by Razorpay and never touch our servers.',
      'Device information — IP address, browser and pages visited, used only to prevent fraud and improve the store.',
      'Cart contents — saved locally in your browser and on our servers after you log in, so your bag follows you across devices.',
    ],
  },
  {
    title: '2. How we use it',
    body: [
      'To fulfil, deliver and support your orders, including SMS and e-mail confirmations.',
      'To create your account automatically after OTP verification and to keep you logged in securely.',
      'To prevent abuse — OTP requests are rate limited and payment signatures are verified server-side.',
      'To improve the website experience and to send promotional messages only where you have opted in (unsubscribe any time by replying STOP).',
    ],
  },
  {
    title: '3. Sharing',
    body: [
      'Courier partners receive only the details required to deliver your parcel.',
      'Razorpay receives the order amount and reference to process your payment.',
      'We never sell your personal data to third parties.',
    ],
  },
  {
    title: '4. Cookies',
    body: [
      'We use httpOnly cookies (ss_access, ss_refresh) to keep you signed in securely — they cannot be read by JavaScript.',
      'A readable ss_csrf cookie protects forms against cross-site request forgery.',
      'A local-storage id keeps your guest cart before you log in.',
    ],
  },
  {
    title: '5. Security',
    body: [
      'All traffic is encrypted with HTTPS/TLS.',
      'OTP codes are hashed at rest and expire after 5 minutes.',
      'Server inputs are validated and sanitised to prevent injection attacks.',
      'Admin routes require a separate role check in addition to a valid login.',
    ],
  },
  {
    title: '6. Your rights',
    body: [
      'You can view and edit your profile and saved addresses at any time from My Account.',
      'You can ask us to delete your account and associated personal data by writing to privacy@surplusstore.in; we respond within 30 days.',
      'Order records are retained for 5 years as required by Indian tax law.',
    ],
  },
  {
    title: '7. Contact',
    body: ['Questions about this policy: privacy@surplusstore.in or Surplus Store, 402, Textile Market, Surat, Gujarat 395002.'],
  },
];

export default function Privacy() {
  return (
    <>
      <SEO title="Privacy Policy" description="How Surplus Store collects, uses and protects your personal information." path="/privacy" />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink-500">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <p className="mt-6 leading-relaxed text-ink-600">
          This policy explains what we collect when you shop on Surplus Store, why we collect it, and the control you
          have over it. By using the website you agree to the practices described here.
        </p>

        <div className="mt-8 space-y-6">
          {SECTIONS.map((s) => (
            <section key={s.title} className="card p-6">
              <h2 className="font-display text-lg font-bold">{s.title}</h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-600">
                {s.body.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-400" />
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
