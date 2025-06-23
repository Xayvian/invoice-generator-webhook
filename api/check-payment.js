const { head } = require('@vercel/blob');

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
    // Get the blob URL from environment (Vercel sets this automatically)
    const blobUrl = process.env.BLOB_READ_WRITE_TOKEN ? 
      `https://${process.env.VERCEL_URL || 'your-project.vercel.app'}/api/blob/payments/${userId}.json` :
      null;

    // Try to fetch the payment data
    if (blobUrl) {
      const response = await fetch(blobUrl);
      
      if (response.ok) {
        const paymentData = await response.json();
        console.log('Found payment in blob:', paymentData);
        
        return res.status(200).json({
          hasPaid: true,
          licenseKey: paymentData.licenseKey,
          paidAt: paymentData.paidAt,
          amount: paymentData.amount,
          currency: paymentData.currency
        });
      }
    }
    
    // If not found or blob URL not available
    return res.status(200).json({
      hasPaid: false,
      message: 'No payment found for this user',
      userId: userId
    });

  } catch (error) {
    console.error('Payment check error:', error);
    return res.status(200).json({
      hasPaid: false,
      message: 'Payment check failed',
      userId: userId
    });
  }
};