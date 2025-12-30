const Campaign = require('../models/campaignModel');
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
        console.log('[1/5] Loading contract artifacts...');
        
        const artifactPath = path.join(__dirname, '..', 'contracts', 'artifacts', 'ProjectEscrowV2.json');

        if (!fs.existsSync(artifactPath)) {
            throw new Error("Contract artifact file not found at the specified path.");
        }

        const artifactRaw = fs.readFileSync(artifactPath, 'utf8');
        const artifact = JSON.parse(artifactRaw);

        contractABI = artifact.abi;
        contractBytecode = artifact.bytecode;

        if (!contractBytecode || !contractBytecode.startsWith('0x')) {
            throw new Error('Invalid bytecode in artifact file. Please compile the contract properly.');
        }

        console.log('     ✅ Contract artifacts loaded successfully.');

    } catch (artifactError) {
        console.error('🔥 Failed to load contract artifacts:', artifactError);
        return res.status(500).json({
            success: false,
            message: 'Server error: Could not load contract artifacts.',
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
        console.log(`     ✅ Deployer wallet: ${deployerWallet.address}`);
        
        console.log('[3/5] Creating ContractFactory...');
        const contractFactory = new ethers.ContractFactory(contractABI, contractBytecode, deployerWallet);
        console.log('     ✅ ContractFactory created.');

        const { beneficiary_address } = req.body;
        
        if (!beneficiary_address || !ethers.isAddress(beneficiary_address)) {
            return res.status(400).json({
                success: false,
                message: 'Valid beneficiary wallet address is required (where funds will be sent)'
            });
        }
        
        // Convert INR to Wei for target amount
        const INR_TO_WEI_RATE = 100000; // ₹100,000 = 1 ETH
        const ethAmount = amount / INR_TO_WEI_RATE;
        const goalInWei = ethers.parseEther(ethAmount.toString());
        
        console.log(`[4/5] Deploying new escrow contract instance...`, { 
            beneficiaryAddress: beneficiary_address, 
            targetAmount: goalInWei.toString(),
            targetINR: amount 
        });

        // Deploy with 2 parameters: beneficiary address and target amount in Wei
        const contract = await contractFactory.deploy(beneficiary_address, goalInWei);
        
        console.log('     ⏳ Waiting for deployment confirmation...');
        await contract.waitForDeployment();
        const contractAddress = await contract.getAddress();
        console.log(`     ✅ Contract deployed at: ${contractAddress}`);

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
            beneficiaryAddress: beneficiary_address,
        });
        console.log('     ✅ Campaign saved to database.');

        res.status(201).json({ success: true, campaign: newCampaign });

    } catch (deployError) {
        console.error('🔥 Smart contract deployment failed:', deployError);
        return res.status(500).json({
            success: false,
            message: 'Failed to deploy smart contract. Ensure deployer wallet has enough MATIC for gas fees.',
            error: deployError.message
        });
    }
};

// --- Keep all other functions (listCampaigns, etc.) as they are ---
exports.listCampaigns = async (req, res) => {
    try {
        const { owner, status, mine } = req.query;
        const filter = {};

        // If mine=true, auth middleware has already verified and attached req.member
        if (mine === 'true') {
            if (!req.member || !req.member.id) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            filter.owner = req.member.id;
        }

        if (status) filter.status = status;
        if (owner) filter.owner = owner;

        // For public browse (no mine or status query), show only active campaigns
        // For specific queries (mine=true or status specified), respect the filter
        if (!filter.status && mine !== 'true') {
            filter.status = 'active';
        } else if (!filter.status && mine === 'true') {
            // When fetching user's own campaigns, show active and funded
            filter.status = { $in: ['active', 'funded'] };
        }

        const campaigns = await Campaign.find(filter)
            .populate('owner', 'name email walletAddress')
            .sort({ createdAt: -1 });
        
        console.log(`📋 Returning ${campaigns.length} campaigns. Sample backersCount:`, 
            campaigns.slice(0, 3).map(c => ({ id: c._id, title: c.title, backers: c.backersCount })));
        
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
        
        console.log(`📊 Returning campaign ${id} with backersCount: ${campaign.backersCount}`);
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
