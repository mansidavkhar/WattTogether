const { generateOnrampSessionToken } = require('../services/coinbaseService');

exports.generateOnrampSessionTokenController = async (req, res) => {
  try {
    const userId = req.member.id; // Provided by authMiddleware
    const sessionToken = await generateOnrampSessionToken(userId);
    res.json({ sessionToken });
  } catch (err) {
    console.error('Coinbase session token error:', err);
    res.status(500).json({ error: 'Coinbase session token failed' });
  }
};
