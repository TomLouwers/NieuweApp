export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false });
  }
  // Soft-fail if Stripe not configured
  let Stripe;
  try { Stripe = require('stripe'); } catch { Stripe = null; }
  if (!Stripe || !process.env.STRIPE_SECRET_KEY) {
    return res.status(200).json({ ok: true, simulated: true });
  }
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
    const priceCents = Math.round(Number(process.env.PPD_PRICE_EUR_CENTS || '399'));
    const origin = req.headers['origin'] || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const email = (req.body?.email || '').toString();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: 'Groepsplan (.docx) download' },
          unit_amount: priceCents,
        },
        quantity: 1,
      }],
      customer_email: email || undefined,
      success_url: `${origin}/groepsplan/new?paid=1`,
      cancel_url: `${origin}/groepsplan/new?paid=0`,
    });
    return res.status(200).json({ ok: true, url: session.url });
  } catch (e) {
    try { console.error('[checkout]', e?.message || e); } catch {}
    return res.status(500).json({ ok: false });
  }
}

