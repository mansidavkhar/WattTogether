const axios = require('axios');
const jwt = require('jsonwebtoken');

/**
 * Generates a Coinbase Onramp session token (JWT) using the API key and secret.
 * This JWT is passed to the frontend for use with the Coinbase Onramp SDK.
 *
 * @param {string} userId - The authenticated user/member id
 * @param {object} userData - (optional) Any user info for metadata or identification
 * @returns {string} sessionToken (JWT)
 */
exports.generateOnrampSessionToken = async (userId, userData) => {
  // Step 1: Build JWT payload according to Coinbase spec.
  // See: https://docs.cdp.coinbase.com/onramp-&-offramp/onramp-apis/generating-onramp-url

  const payload = {
    sub: userId,
    aud: 'coinbase_pay_sdk',
    // Optionally include more data such as user's Coinbase wallet address, email, etc.
    // Example: name: userData.name, email: userData.email, ...
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (5 * 60), // 5 min expiry
  };

  // Step 2: Sign payload with your Coinbase API secret as JWT signing key
  const sessionToken = jwt.sign(payload, process.env.COINBASE_API_SECRET, {
    algorithm: 'HS256', // Or per Coinbase doc spec if different
    issuer: process.env.COINBASE_API_KEY,
  });

  // Step 3: Return JWT session token for use by front-end Coinbase Pay SDK
  return sessionToken;
};

// Optionally, if you need to fetch extra data (initiate payment, etc.), add helper fns here.
