/**
 * Razorpay checkout loader.
 * The script is injected lazily only when real keys are configured;
 * otherwise the caller shows the built-in mock payment sheet.
 */
let promise = null;

export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  if (promise) return promise;

  promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Could not load Razorpay. Check your network.'));
    document.body.appendChild(script);
  });

  return promise;
}
