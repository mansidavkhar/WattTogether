const Member = require('../models/memberModel');
const { PrivyClient } = require('@privy-io/server-auth');

// Initialize Privy client
const privyClient = new PrivyClient(
    process.env.PRIVY_APP_ID,
    process.env.PRIVY_APP_SECRET
);

/**
 * Auth with Privy - Handle both new users and existing users
 * Frontend sends Privy access token after user authenticates with Privy
 */
exports.authWithPrivy = async (req, res) => {
    try {
        const { accessToken } = req.body;
        
        if (!accessToken) {
            return res.status(400).json({ success: false, message: "Access token required" });
        }

        // Verify the Privy token and get user info
        const verifiedClaims = await privyClient.verifyAuthToken(accessToken);
        const privyUserId = verifiedClaims.userId;

        // Get full user details from Privy
        const privyUser = await privyClient.getUserById(privyUserId);
        
        // Extract email from Privy user
        const emailObject = privyUser.linkedAccounts?.find(account => account.type === 'email');
        const email = emailObject?.address;

        if (!email) {
            console.error('No email found for Privy user:', privyUserId);
            console.error('User linked accounts:', privyUser.linkedAccounts);
            return res.status(400).json({ 
                success: false, 
                message: "Email is required to complete registration. Please sign in with email instead of connecting a wallet directly." 
            });
        }

        // Extract wallet address if available
        const walletAccount = privyUser.linkedAccounts?.find(account => 
            account.type === 'wallet' && account.walletClient === 'privy'
        );
        const walletAddress = walletAccount?.address;

        // Check if member already exists by email or Privy ID
        let member = await Member.findOne({ 
            $or: [{ email }, { privyUserId }] 
        });

        if (member) {
            // Existing member - update Privy ID and wallet if not set
            if (!member.privyUserId) {
                member.privyUserId = privyUserId;
            }
            if (walletAddress && !member.walletAddress) {
                member.walletAddress = walletAddress;
            }
            await member.save();
        } else {
            // New member - create account
            member = new Member({
                email,
                privyUserId,
                name: emailObject?.name || email.split('@')[0],
                walletAddress: walletAddress || null
            });
            await member.save();
        }

        res.json({
            success: true,
            user: {
                id: member.id,
                name: member.name,
                email: member.email,
                walletAddress: member.walletAddress,
                privyUserId: member.privyUserId
            }
        });

    } catch (error) {
        console.error("Privy Auth Error:", error);
        res.status(500).json({ success: false, message: "Authentication failed", error: error.message });
    }
};

/**
 * Save or update wallet address for a member
 * Used when Privy creates a wallet for the user
 */
exports.saveWalletAddress = async (req, res) => {
    try {
        const { walletAddress } = req.body;
        const memberId = req.member.id; 

        const member = await Member.findByIdAndUpdate(
            memberId, 
            { walletAddress }, 
            { new: true }
        ).select('-password');

        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found.' });
        }

        res.json({ success: true, message: 'Wallet address updated successfully.', member });

    } catch (error) {
        if (error.code === 11000) {
             return res.status(400).json({ 
                 success: false, 
                 message: 'This wallet address is already associated with another account.' 
             });
        }
        console.error("Save Wallet Error:", error);
        res.status(500).json({ success: false, message: 'Server error while saving wallet address.' });
    }
};

/**
 * GET /api/members/get-wallet
 * Returns wallet address for the currently authenticated member
 * If wallet is not in DB, fetches from Privy and updates DB
 */
exports.getWalletAddress = async (req, res) => {
  try {
    let member = await Member.findById(req.member.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    // If wallet address is not in DB, try to get it from Privy
    if (!member.walletAddress && member.privyUserId) {
      try {
        const privyUser = await privyClient.getUserById(member.privyUserId);
        const walletAccount = privyUser.linkedAccounts?.find(account => 
          account.type === 'wallet' && account.walletClient === 'privy'
        );
        
        if (walletAccount?.address) {
          // Update member with wallet address from Privy
          member.walletAddress = walletAccount.address;
          await member.save();
          console.log('Synced wallet address from Privy:', walletAccount.address);
        }
      } catch (privyError) {
        console.error('Error fetching wallet from Privy:', privyError);
        // Continue without wallet address
      }
    }

    return res.json({
      success: true,
      walletAddress: member.walletAddress || null
    });
  } catch (err) {
    console.error('Error fetching wallet address:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * Gets the profile of the currently authenticated member
 */
exports.getMe = async (req, res) => {
    try {
        const member = await Member.findById(req.member.id).select('-password');

        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        res.json({ success: true, member });
    } catch (err) {
        console.error('Get member profile error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

