const Project = require('../models/projectModel');
const { validationResult } = require('express-validator');
const ethers = require('ethers');
const ProjectEscrowArtifact = require('../contracts/artifacts/ProjectEscrow.json');
require('dotenv').config();


// --- Ethers.js Setup ---
const provider = new ethers.JsonRpcProvider(process.env.POLYGON_AMOY_RPC_URL);
const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

// Public: list projects (filter by owner or status)
exports.listProjects = async (req, res) => {
  try {
    const { owner, status, mine } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (owner) filter.owner = owner;
    if (mine === 'true' && req.member?.id) filter.owner = req.member.id;

    const projects = await Project.find(filter)
      .populate('owner', 'name email walletAddress')
      .populate('sourceCampaign', 'title')
      .sort({ createdAt: -1 });

    res.json({ success: true, projects });
  } catch (err) {
    console.error('List Projects Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch projects' });
  }
};

// Public: get project by id
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id)
      .populate('owner', 'name email walletAddress')
      .populate('sourceCampaign', 'title');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, project });
  } catch (err) {
    console.error('Get Project Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch project' });
  }
};

// Auth: owner can post an update
exports.addProjectUpdate = async (req, res) => {
  try {
    const memberId = req.member?.id;
    if (!memberId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { id } = req.params; // project id
    const { title, message } = req.body;

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.owner.toString() !== memberId) {
      return res.status(403).json({ success: false, message: 'Only owner can add updates' });
    }

    project.updates.push({ title, message });
    await project.save();

    res.json({ success: true, project });
  } catch (err) {
    console.error('Add Project Update Error:', err);
    res.status(500).json({ success: false, message: 'Failed to add project update' });
  }
};



// Create a new project and deploy its escrow contract
exports.createProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        title,
        description,
        fundingGoalINR,
        fundingDeadline,
        fundingType,
        aboutEntrepreneur
    } = req.body;

    try {
        // Step 1: Deploy the Smart Contract
        console.log("Deploying contract, please wait...");
        const ProjectEscrowFactory = new ethers.ContractFactory(ProjectEscrowArtifact.abi, ProjectEscrowArtifact.bytecode, wallet);

        // Convert funding goal to have 6 decimals (standard for USDC)
        const fundingGoalUSDC = ethers.parseUnits(fundingGoalINR.toString(), 6); 
        
        const deadlineDate = new Date(fundingDeadline);
        const now = new Date();
        const durationInDays = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

        const contract = await ProjectEscrowFactory.deploy(
            req.member.id, // Creator's address (using member ID for now)
            process.env.USDC_AMOY_ADDRESS,
            fundingGoalUSDC,
            durationInDays
        );

        await contract.waitForDeployment();
        const contractAddress = await contract.getAddress();
        console.log(`✅ Contract deployed successfully at: ${contractAddress}`);

        // Step 2: Save Project to Database
        const newProject = new Project({
            title,
            description,
            fundingGoalINR,
            fundingDeadline,
            fundingType,
            aboutEntrepreneur,
            owner: req.member.id,
            coverImage: req.file ? req.file.path.replace(/\\/g, "/") : null, // Handle file upload
            escrowContractAddress: contractAddress // Save the contract address
        });

        const project = await newProject.save();
        res.status(201).json(project);

    } catch (err) {
        console.error("Error in createProject:", err);
        res.status(500).send('Server Error');
    }
};
