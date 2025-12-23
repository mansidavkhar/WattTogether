const { PrivyClient } = require('@privy-io/server-auth');
const Member = require('../models/memberModel');

// Initialize Privy client
const privyClient = new PrivyClient(
    process.env.PRIVY_APP_ID,
    process.env.PRIVY_APP_SECRET
);

/**
 * Middleware to verify Privy access tokens
 * Extracts member info and attaches to req.member
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        let token = req.header('Authorization');
        
        console.log('Auth middleware - Request path:', req.path);
        console.log('Auth middleware - Token present:', !!token);
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No authorization token provided.' 
            });
        }

        // Remove 'Bearer ' prefix if present
        if (token.startsWith('Bearer ')) {
            token = token.slice(7);
        }

        console.log('Auth middleware - Verifying token with Privy...');

        // Verify token with Privy
        const verifiedClaims = await privyClient.verifyAuthToken(token);
        
        console.log('Auth middleware - Token verified, userId:', verifiedClaims.userId);
        
        if (!verifiedClaims || !verifiedClaims.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token.' 
            });
        }

        // Find member by Privy user ID
        let member = await Member.findOne({ privyUserId: verifiedClaims.userId });
        
        console.log('Auth middleware - Member found:', !!member);
        
        if (!member) {
            return res.status(404).json({ 
                success: false, 
                message: 'Member not found. Please complete registration.' 
            });
        }

        // If wallet address is missing, try to fetch it from Privy
        if (!member.walletAddress && member.privyUserId) {
            try {
                console.log('Auth middleware - Fetching wallet address from Privy...');
                const privyUser = await privyClient.getUserById(member.privyUserId);
                const walletAccount = privyUser.linkedAccounts?.find(account => 
                    account.type === 'wallet' && account.walletClient === 'privy'
                );
                
                if (walletAccount?.address) {
                    member.walletAddress = walletAccount.address;
                    await member.save();
                    // Reload member to ensure we have the updated data
                    member = await Member.findById(member._id);
                    console.log('Auth middleware - Wallet address synced from Privy:', walletAccount.address);
                }
            } catch (privyError) {
                console.warn('Auth middleware - Could not fetch wallet from Privy:', privyError.message);
            }
        }

        // Attach member info to request (including full member object)
        req.member = {
            _id: member._id,
            id: member._id,
            privyUserId: member.privyUserId,
            email: member.email,
            name: member.name,
            walletAddress: member.walletAddress
        };

        console.log('Auth middleware - Member attached to request:', {
            email: req.member.email,
            walletAddress: req.member.walletAddress || 'NOT SET'
        });

        next();

    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(401).json({ 
            success: false, 
            message: 'Token verification failed.',
            error: err.message 
        });
    }
};

module.exports = authMiddleware;
