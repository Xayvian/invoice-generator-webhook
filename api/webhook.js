let redis;

async function getRedis() {
  if (!redis) {
    try {
      const { createClient } = require('redis');
      
      // Use the correct environment variable name
      const redisUrl = process.env.STORAGE_REDIS_URL;
      
      if (!redisUrl) {
        console.error('❌ STORAGE_REDIS_URL not found');
        return null;
      }
      
      console.log('Connecting to Redis...');
      
      redis = createClient({
        url: redisUrl,
      });
      
      await redis.connect();
      console.log('✅ Redis connected successfully');
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      return null;
    }
  }
  return redis;
}

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

        console.log(`✅ Payment confirmed for user: ${userId}, license: ${licenseKey}`);

        // Always return success even if Redis fails
        const paymentData = {
          licenseKey,
          sessionId: session.id,
          paidAt: new Date().toISOString(),
          amount: session.amount_total,
          currency: session.currency,
          customerEmail: session.customer_details?.email
        };

        // Try Redis with timeout
        const redisPromise = (async () => {
          try {
            const redisClient = await getRedis();
            if (redisClient) {
              await redisClient.set(`payment:${userId}`, JSON.stringify(paymentData));
              console.log(`✅ Payment stored in Redis for user: ${userId}`);
            }
          } catch (error) {
            console.error('Redis storage failed:', error);
          }
        })();

        // Don't wait for Redis - respond immediately
        setTimeout(() => redisPromise, 0);
      }
    }

    // Always return success quickly
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).json({ received: true }); // Return success anyway
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