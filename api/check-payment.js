const { createClient } = require('redis');

let redis;

async function getRedis() {
  if (!redis) {
    redis = createClient({
      url: process.env.STORAGE_URL,
    });
    await redis.connect();
  }
  return redis;
}

module.exports = async (req, res) => {
  console.log('Payment check called for:', req.query.userId);

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ 
      error: 'Missing userId parameter',
      hasPaid: false 
    });
  }

  try {
    // Get from Redis
    const redisClient = await getRedis();
    const paymentDataString = await redisClient.get(`payment:${userId}`);

    if (paymentDataString) {
      const paymentData = JSON.parse(paymentDataString);
      console.log('Found payment in Redis:', paymentData);
      return res.status(200).json({
        hasPaid: true,
        licenseKey: paymentData.licenseKey,
        paidAt: paymentData.paidAt,
        amount: paymentData.amount,
        currency: paymentData.currency
      });
    } else {
      console.log('No payment found in Redis for:', userId);
      return res.status(200).json({
        hasPaid: false,
        message: 'No payment found for this user',
        userId: userId
      });
    }

  } catch (error) {
    console.error('Payment check error:', error);
    return res.status(500).json({ 
      error: 'Payment check failed',
      hasPaid: false 
    });
  }
};