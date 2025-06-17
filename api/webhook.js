const Stripe = require('stripe');

// In-memory storage for paid users
const paidUsers = new Map();

module.exports = async (req, res) => {
  console.log('Webhook called:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing Stripe environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Get raw body for signature verification
    const body = JSON.stringify(req.body);
    const signature = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
      console.log('Webhook signature verified');
    } catch (err) {
      console.log('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle checkout completion
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('Checkout completed:', session.id);

      if (session.payment_status === 'paid') {
        const userId = session.client_reference_id;
        const licenseKey = generateLicenseKey();

        // Store payment data
        paidUsers.set(userId, {
          licenseKey,
          sessionId: session.id,
          paidAt: new Date().toISOString(),
          amount: session.amount_total,
          currency: session.currency,
          customerEmail: session.customer_details?.email
        });

        console.log(`Payment confirmed for user: ${userId}, license: ${licenseKey}`);
      }
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Generate license key
function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  
  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  return `INV-PRO-${segments.join('-')}`;
}