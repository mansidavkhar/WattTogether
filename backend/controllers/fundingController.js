const Campaign = require('../models/campaignModel');
const ethers = require('ethers');
const ProjectEscrowArtifact = require('../contracts/artifacts/ProjectEscrow.json');
require('dotenv').config();

// Ethers setup to connect to the Polygon Amoy testnet
const provider = new ethers.JsonRpcProvider(process.env.POLYGON_AMOY_RPC_URL);

// Your admin wallet, which will pay for gas fees and send test USDC
const deployerWallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

/**
 * @desc    (DEV ONLY) Fund a campaign with test USDC from the admin wallet
 * This function simulates a user donation for development purposes.
 */
exports.fundWithTestUSDC = async (req, res) => {
    try {
        const { amount, campaignId } = req.body;

        if (!amount || !campaignId) {
            return res.status(400).json({ success: false, message: "Amount and Campaign ID are required." });
        }

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ success: false, message: "Campaign not found" });
        }
        if (!campaign.escrowContractAddress) {
            return res.status(400).json({ success: false, message: "Campaign does not have a smart contract address." });
        }

        console.log(`DEV FAUCET: Funding campaign "${campaign.title}" with ${amount} test USDC.`);

        // 1. Connect to the campaign's specific escrow contract
        const escrowContract = new ethers.Contract(campaign.escrowContractAddress, ProjectEscrowArtifact.abi, deployerWallet);

        // 2. Connect to the Test USDC contract to approve the spend
        const usdcContractAddress = process.env.USDC_AMOY_ADDRESS || process.env.USDC_TOKEN_ADDRESS_AMOY;
        if (!usdcContractAddress) {
            return res.status(500).json({ success: false, message: 'USDC token address not configured. Set USDC_AMOY_ADDRESS or USDC_TOKEN_ADDRESS_AMOY in .env' });
        }
        // Ensure the address is a contract on-chain
        const code = await provider.getCode(usdcContractAddress);
        if (code === '0x') {
            return res.status(400).json({ success: false, message: `USDC token address ${usdcContractAddress} has no code on-chain. Set it to a real ERC20 on Polygon Amoy.` });
        }
        const usdcABI = [
            "function approve(address spender, uint256 amount) public returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)",
            "function balanceOf(address owner) view returns (uint256)",
            "function decimals() view returns (uint8)",
            // Optional for dev tokens; if not present, call will fail gracefully when attempted
            "function mint(address to, uint256 amount) public"
        ];
        const usdcContract = new ethers.Contract(usdcContractAddress, usdcABI, deployerWallet);

        // Validate the escrow's configured token matches the configured USDC env var
        const onchainToken = await escrowContract.fundingTokenAddress();
        if (onchainToken.toLowerCase() !== usdcContractAddress.toLowerCase()) {
            return res.status(400).json({
                success: false,
                message: `Token mismatch: escrow expects ${onchainToken}, but server is configured with ${usdcContractAddress}. This campaign was deployed with a different token. Fix .env and create a new campaign.`,
            });
        }

        // Determine token decimals dynamically (default to 6 if not implemented)
        let usdcDecimals = 6;
        try {
            usdcDecimals = Number(await usdcContract.decimals());
            if (!Number.isFinite(usdcDecimals)) usdcDecimals = 6;
        } catch {}

        // Convert amount using actual token decimals
        const amountToDonate = ethers.parseUnits(amount.toString(), usdcDecimals);

        // Ensure deployer has enough token balance (to prevent ERC20 transfer revert)
        const deployerBalance = await usdcContract.balanceOf(deployerWallet.address);
        if (deployerBalance < amountToDonate) {
            // Optionally attempt to mint if DEV_FAUCET_AUTO_MINT=true and token has mint()
            if (String(process.env.DEV_FAUCET_AUTO_MINT).toLowerCase() === 'true') {
                try {
                    console.log(`Deployer balance is low (${deployerBalance}), attempting to mint ${amountToDonate}...`);
                    const mintTx = await usdcContract.mint(deployerWallet.address, amountToDonate);
                    await mintTx.wait();
                    console.log('Mint successful.');
                } catch (mintErr) {
                    return res.status(400).json({
                        success: false,
                        message: `Deployer USDC balance (${deployerBalance}) is less than requested amount (${amountToDonate}) and mint failed: ${mintErr?.reason || mintErr?.message || mintErr}`,
                    });
                }
            } else {
                return res.status(400).json({
                    success: false,
                    message: `Deployer USDC balance (${deployerBalance}) is less than requested amount (${amountToDonate}). Fund the deployer with test tokens or enable DEV_FAUCET_AUTO_MINT=true if your token supports mint(address,uint256).`,
                });
            }
        }

        // 3. The deployer wallet approves the escrow contract to spend its test USDC
        console.log("Approving test USDC spend...");
        const approveTx = await usdcContract.approve(campaign.escrowContractAddress, amountToDonate);
        await approveTx.wait();
        console.log("Approval successful.");

        // Verify allowance before attempting donate
        const allowance = await usdcContract.allowance(deployerWallet.address, campaign.escrowContractAddress);
        if (allowance < amountToDonate) {
            return res.status(400).json({ success: false, message: `Allowance ${allowance} is less than amount ${amountToDonate}.` });
        }

        // 4. The deployer wallet calls the 'donate' function on the escrow contract
        console.log("Calling donate function on escrow contract...");
        const donateTx = await escrowContract.donate(amountToDonate);
        await donateTx.wait();
        console.log("Donation transaction successful!");

        // 5. Update the campaign progress in your database
        const campaignFromDB = await Campaign.findById(campaignId);
        campaignFromDB.amountRaisedINR = (campaignFromDB.amountRaisedINR || 0) + Number(amount);
        await campaignFromDB.save();

        res.json({ success: true, message: `Successfully funded with ${amount} test USDC.` });

    } catch (err) {
        console.error("DEV FAUCET Error:", err);
        res.status(500).json({ success: false, message: 'Failed to fund with test USDC' });
    }
};
