const { put } = require('@vercel/blob');

module.exports = async (req, res) => {
  console.log('Webhook called:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;
    console.log('Processing event:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('Checkout completed:', session.id);

      if (session.payment_status === 'paid') {
        const userId = session.client_reference_id;
        const licenseKey = generateLicenseKey();

        const paymentData = {
          licenseKey,
          sessionId: session.id,
          paidAt: new Date().toISOString(),
          amount: session.amount_total,
          currency: session.currency,
          customerEmail: session.customer_details?.email
        };

        try {
          // Store in your Blob storage
          const blob = await put(`payments/${userId}.json`, JSON.stringify(paymentData), {
            access: 'public',
          });
          
          console.log(`✅ Payment stored in blob for user: ${userId}, license: ${licenseKey}`);
          console.log(`📄 Blob URL: ${blob.url}`);
        } catch (storageError) {
          console.error('Blob storage failed:', storageError);
          console.log(`⚠️ License generated but not stored: ${userId} -> ${licenseKey}`);
        }
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