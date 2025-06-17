const storage = require('./storage');

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
    const payment = storage.getPaidUser(userId);

    if (payment) {
      return res.status(200).json({
        hasPaid: true,
        licenseKey: payment.licenseKey,
        paidAt: payment.paidAt,
        amount: payment.amount,
        currency: payment.currency
      });
    } else {
      // Debug: show all stored users
      const allUsers = storage.getAllUsers();
      console.log('Available users:', Array.from(allUsers.keys()));
      
      return res.status(200).json({
        hasPaid: false,
        message: 'No payment found for this user',
        requestedUserId: userId,
        availableUsers: Array.from(allUsers.keys())
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