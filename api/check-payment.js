const { head, list } = require('@vercel/blob');

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
    // Use Vercel Blob list to find the file
    const { blobs } = await list({ prefix: `payments/${userId}` });
    
    if (blobs.length > 0) {
      // Found a payment file for this user
      const response = await fetch(blobs[0].url);
      const paymentData = await response.json();
      
      console.log('Found payment in blob:', paymentData);
      
      return res.status(200).json({
        hasPaid: true,
        licenseKey: paymentData.licenseKey,
        paidAt: paymentData.paidAt,
        amount: paymentData.amount,
        currency: paymentData.currency
      });
    } else {
      console.log('No payment found for:', userId);
      return res.status(200).json({
        hasPaid: false,
        message: 'No payment found for this user',
        userId: userId
      });
    }

  } catch (error) {
    console.error('Payment check error:', error);
    return res.status(200).json({
      hasPaid: false,
      message: 'Payment check failed',
      userId: userId
    });
  }
};