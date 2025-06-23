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
    // Use the blob URL pattern from your successful webhook
    const blobUrl = `https://ujoxpcjmmgez65np.public.blob.vercel-storage.com/payments/${userId}.json`;
    
    console.log('Checking blob URL:', blobUrl);
    
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
    } else {
      console.log('No payment found, response status:', response.status);
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