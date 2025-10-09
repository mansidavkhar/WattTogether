const Campaign = require('../models/campaignModel');
const Project = require('../models/projectModel');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

exports.createCampaign = async (req, res) => {
    console.log('Campaign creation request received.');

    if (!req.body.project_name || !req.body.amount || !req.body.funding_deadline) {
        console.error('Validation Error: Missing required fields.', { body: req.body });
        return res.status(400).json({
            success: false,
            message: 'Missing required form data. Ensure multer middleware is correctly configured on the route.'
        });
    }

    const memberId = req.member?.id;
    if (!memberId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
        project_name,
        amount,
        description,
        about_entrepreneur,
        funding_deadline,
        project_deadline,
        tags,
    } = req.body;

    let contractABI;
    let contractBytecode;

    try {
        console.log('[1/5] Loading contract artifacts using fs...');
        
        const artifactPath = path.join(__dirname, '..', 'contracts', 'artifacts', 'ProjectEscrow.json');

        if (!fs.existsSync(artifactPath)) {
            throw new Error("Contract artifact file not found at the specified path.");
        }

        const artifactRaw = fs.readFileSync(artifactPath, 'utf8');
        const artifact = JSON.parse(artifactRaw);

        contractABI = artifact.abi;

        // Try multiple common locations for bytecode (Remix, Hardhat, etc.)
        let bc =
            artifact.bytecode ||
            artifact?.byteCode ||
            artifact?.evm?.bytecode?.object ||
            artifact?.data?.bytecode?.object ||
            artifact?.bytecode?.object;

        if (typeof bc === 'string') {
            bc = bc.trim();
            // Normalize 0x prefix casing if needed
            if (bc.startsWith('0X')) {
                bc = '0x' + bc.slice(2);
            }
        }

        if (typeof bc !== 'string' || !bc.startsWith('0x')) {
            throw new Error('Bytecode not found in expected fields or is not a hex string.');
        }

        let hex = bc.slice(2);
        // Remove any whitespace/newlines that may be present (e.g., from manual formatting)
        hex = hex.replace(/\s+/g, '');
        if (!/^[0-9a-fA-F]*$/.test(hex)) {
            throw new Error(`Bytecode contains non-hex characters after sanitation. Length=${hex.length}`);
        }
        if (hex.length % 2 !== 0) {
            throw new Error(`Bytecode hex length is odd after sanitation. Length=${hex.length}`);
        }

        // Convert to Uint8Array to avoid any strict hex parsing quirks in ethers
        try {
            contractBytecode = Uint8Array.from(Buffer.from(hex, 'hex'));
        } catch (convErr) {
            throw new Error(`Bytecode hex conversion failed: ${convErr.message}`);
        }

        console.log('     ✅ Artifacts loaded successfully.');

    } catch (artifactError) {
        console.error('🔥 Failed to load contract artifacts:', artifactError);
        return res.status(500).json({
            success: false,
            message: 'Server error: Could not find or read contract files (ABI or Bytecode).',
            error: artifactError.message
        });
    }

    try {
        console.log('[2/5] Setting up blockchain provider and wallet...');
        
        if (!process.env.POLYGON_AMOY_RPC_URL || !process.env.DEPLOYER_PRIVATE_KEY) {
            throw new Error("RPC URL or Deployer Private Key is missing from .env file.");
        }

        const provider = new ethers.JsonRpcProvider(process.env.POLYGON_AMOY_RPC_URL);
        const deployerWallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
        console.log(`     ✅ Deployer wallet loaded. Address: ${deployerWallet.address}`);
        
        console.log('[3/5] Creating ContractFactory...');
        const contractFactory = new ethers.ContractFactory(contractABI, contractBytecode, deployerWallet);
        console.log('     ✅ ContractFactory created successfully.');

        const creatorAddress = deployerWallet.address;
        const fundingToken = process.env.USDC_TOKEN_ADDRESS_AMOY || process.env.USDC_AMOY_ADDRESS;
        if (!fundingToken) {
            throw new Error('USDC token address not configured. Set USDC_TOKEN_ADDRESS_AMOY or USDC_AMOY_ADDRESS in .env');
        }
        // Use the token's actual decimals to compute the goal amount in smallest units
        let tokenDecimals = 6;
        try {
            const erc20 = new ethers.Contract(
                fundingToken,
                ["function decimals() view returns (uint8)"],
                provider
            );
            const d = await erc20.decimals();
            tokenDecimals = Number(d);
            if (!Number.isFinite(tokenDecimals)) tokenDecimals = 6;
            console.log(`    Funding token decimals: ${tokenDecimals}`);
        } catch (decErr) {
            console.warn('     ⚠️ Could not fetch token decimals; defaulting to 6:', decErr?.message || decErr);
        }
        const goalInSmallestUnit = ethers.parseUnits((amount || '0').toString(), tokenDecimals);
        const deadlineDate = new Date(funding_deadline);
        const durationInDays = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        if (durationInDays <= 0) {
            return res.status(400).json({ success: false, message: 'Funding deadline must be in the future.' });
        }

        console.log('[4/5] Deploying contract with parameters:', { creatorAddress, fundingToken, goal: goalInSmallestUnit.toString(), duration: durationInDays });

        const contract = await contractFactory.deploy(creatorAddress, fundingToken, goalInSmallestUnit, durationInDays);
        
        await contract.waitForDeployment();
        const contractAddress = await contract.getAddress();
        console.log(`     ✅ Contract deployed successfully at: ${contractAddress}`);

        console.log('[5/5] Saving campaign to database...');
        const newCampaign = await Campaign.create({
            owner: memberId,
            title: project_name,
            fundingType: 'donation',
            fundingGoalINR: Number(amount || 0),
            description,
            aboutEntrepreneur: about_entrepreneur,
            fundingDeadline: funding_deadline,
            projectDeadline: project_deadline,
            coverImageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
            tags,
            escrowContractAddress: contractAddress,
        });
        console.log('     ✅ Campaign saved to database.');

        res.status(201).json({ success: true, campaign: newCampaign });

    } catch (deployError) {
        console.error('🔥 Smart contract deployment failed:', deployError);
        return res.status(500).json({
            success: false,
            message: 'Failed to deploy smart contract. Check server logs for details (e.g., out of gas).',
            error: deployError.message
        });
    }
};

// --- Keep all other functions (listCampaigns, etc.) as they are ---
exports.listCampaigns = async (req, res) => {
    try {
        const { owner, status, mine } = req.query;
        const filter = {};

        // Optional auth: if a token is provided, try to decode it to identify the member
        let memberId = undefined;
        try {
            let token = req.header('x-auth-token');
            if (!token && req.headers.authorization) {
                const m = req.headers.authorization.match(/^Bearer\s+(.*)$/i);
                if (m) token = m[1];
            }
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                memberId = decoded?.member?.id;
            }
        } catch (_) {
            // Ignore token errors in this route; only used when mine=true
        }

        if (status) filter.status = status;
        if (owner) filter.owner = owner;
        if (mine === 'true') {
            if (!memberId) return res.status(401).json({ success: false, message: 'Unauthorized' });
            filter.owner = memberId;
        }

        const campaigns = await Campaign.find(filter)
            .populate('owner', 'name email walletAddress')
            .sort({ createdAt: -1 });
        res.json({ success: true, campaigns });
    } catch (err) {
        console.error('List Campaigns Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch campaigns' });
    }
};

exports.getCampaignById = async (req, res) => {
    try {
        const { id } = req.params;
        const campaign = await Campaign.findById(id).populate('owner', 'name email walletAddress');
        if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
        res.json({ success: true, campaign });
    } catch (err) {
        console.error('Get Campaign Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch campaign' });
    }
};

exports.updateFundingProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { amountDeltaINR = 0, backerDelta = 0 } = req.body;
        const campaign = await Campaign.findById(id);
        if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
        campaign.amountRaisedINR = Math.max(0, (campaign.amountRaisedINR || 0) + Number(amountDeltaINR));
        campaign.backersCount = Math.max(0, (campaign.backersCount || 0) + Number(backerDelta));
        const now = new Date();
        const withinDeadline = campaign.fundingDeadline ? now <= new Date(campaign.fundingDeadline) : true;
        if (campaign.amountRaisedINR >= campaign.fundingGoalINR && withinDeadline) {
            campaign.status = 'funded';
        }
        await campaign.save();
        res.json({ success: true, campaign });
    } catch (err) {
        console.error('Update Funding Error:', err);
        res.status(500).json({ success: false, message: 'Failed to update campaign progress' });
    }
};

exports.convertToProject = async (req, res) => {
    try {
        const memberId = req.member?.id;
        if (!memberId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { id } = req.params;
        const campaign = await Campaign.findById(id);
        if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
        if (campaign.owner.toString() !== memberId) return res.status(403).json({ success: false, message: 'Only owner can convert campaign to project' });
        if (campaign.status !== 'funded') return res.status(400).json({ success: false, message: 'Campaign is not funded yet' });
        
        const project = await Project.create({
            owner: campaign.owner,
            sourceCampaign: campaign._id,
            title: campaign.title,
            description: campaign.description,
            aboutEntrepreneur: campaign.aboutEntrepreneur,
            coverImageUrl: campaign.coverImageUrl,
            fundingType: campaign.fundingType,
            fundingGoalINR: campaign.fundingGoalINR,
            amountRaisedINR: campaign.amountRaisedINR,
            backersCount: campaign.backersCount,
            projectDeadline: campaign.projectDeadline,
            escrowContractAddress: campaign.escrowContractAddress,
            status: 'ongoing',
            tags: campaign.tags,
        });
        res.status(201).json({ success: true, project });
    } catch (err) {
        console.error('Convert To Project Error:', err);
        res.status(500).json({ success: false, message: 'Failed to convert campaign to project' });
    }
};
