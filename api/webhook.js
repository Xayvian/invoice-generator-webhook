const Stripe = require('stripe');
const storage = require('./storage');

module.exports = async (req, res) => {
  console.log('Webhook called:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Skip signature verification for now - just process the event
    const event = req.body;
    console.log('Processing event:', event.type);

    // Handle checkout completion
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('Checkout completed:', session.id);

      if (session.payment_status === 'paid') {
        const userId = session.client_reference_id;
        const licenseKey = generateLicenseKey();

        // Store payment data using shared storage
        const paymentData = {
          licenseKey,
          sessionId: session.id,
          paidAt: new Date().toISOString(),
          amount: session.amount_total,
          currency: session.currency,
          customerEmail: session.customer_details?.email
        };

        storage.setPaidUser(userId, paymentData);
        console.log(`✅ Payment confirmed for user: ${userId}, license: ${licenseKey}`);
      }
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

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