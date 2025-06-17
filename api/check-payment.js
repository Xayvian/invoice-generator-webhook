// Share the same storage as webhook
const paidUsers = new Map();

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
    const payment = paidUsers.get(userId);

    if (payment) {
      return res.status(200).json({
        hasPaid: true,
        licenseKey: payment.licenseKey,
        paidAt: payment.paidAt,
        amount: payment.amount,
        currency: payment.currency
      });
    } else {
      return res.status(200).json({
        hasPaid: false,
        message: 'No payment found for this user'
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