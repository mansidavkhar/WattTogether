// const Campaign = require('../models/campaignModel');
// const Project = require('../models/projectModel');

// // Create a new campaign (member inclusive: any authenticated member can create)
// exports.createCampaign = async (req, res) => {
//   try {
//     const memberId = req.member?.id; // from authMiddleware
//     if (!memberId) return res.status(401).json({ success: false, message: 'Unauthorized' });

//     const {
//       title,
//       fundingType,
//       fundingGoalINR,
//       description,
//       aboutEntrepreneur,
//       fundingDeadline,
//       projectDeadline,
//       coverImageUrl,
//       tags,
//     } = req.body;

//     const campaign = await Campaign.create({
//       owner: memberId,
//       title,
//       fundingType,
//       fundingGoalINR,
//       description,
//       aboutEntrepreneur,
//       fundingDeadline,
//       projectDeadline,
//       coverImageUrl,
//       tags,
//     });

//     res.status(201).json({ success: true, campaign });
//   } catch (err) {
//     console.error('Create Campaign Error:', err);
//     res.status(500).json({ success: false, message: 'Failed to create campaign' });
//   }
// };

// // Public: list campaigns (optionally filter by owner or status)
// exports.listCampaigns = async (req, res) => {
//   try {
//     const { owner, status, mine } = req.query;

//     const filter = {};
//     if (status) filter.status = status;
//     if (owner) filter.owner = owner;
//     if (mine === 'true' && req.member?.id) filter.owner = req.member.id;

//     const campaigns = await Campaign.find(filter)
//       .populate('owner', 'name email walletAddress')
//       .sort({ createdAt: -1 });

//     res.json({ success: true, campaigns });
//   } catch (err) {
//     console.error('List Campaigns Error:', err);
//     res.status(500).json({ success: false, message: 'Failed to fetch campaigns' });
//   }
// };

// // Public: get campaign by id
// exports.getCampaignById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const campaign = await Campaign.findById(id).populate('owner', 'name email walletAddress');
//     if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
//     res.json({ success: true, campaign });
//   } catch (err) {
//     console.error('Get Campaign Error:', err);
//     res.status(500).json({ success: false, message: 'Failed to fetch campaign' });
//   }
// };

// // Update campaign progress (e.g., on-chain contribution webhook or manual update)
// exports.updateFundingProgress = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { amountDeltaINR = 0, backerDelta = 0 } = req.body;

//     const campaign = await Campaign.findById(id);
//     if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

//     campaign.amountRaisedINR = Math.max(0, (campaign.amountRaisedINR || 0) + Number(amountDeltaINR));
//     campaign.backersCount = Math.max(0, (campaign.backersCount || 0) + Number(backerDelta));

//     // Auto-transition to funded if goal reached within deadline
//     const now = new Date();
//     const withinDeadline = campaign.fundingDeadline ? now <= new Date(campaign.fundingDeadline) : true;
//     if (campaign.amountRaisedINR >= campaign.fundingGoalINR && withinDeadline) {
//       campaign.status = 'funded';
//     }

//     await campaign.save();

//     res.json({ success: true, campaign });
//   } catch (err) {
//     console.error('Update Funding Error:', err);
//     res.status(500).json({ success: false, message: 'Failed to update campaign progress' });
//   }
// };

// // Transition a funded campaign to a project
// exports.convertToProject = async (req, res) => {
//   try {
//     const memberId = req.member?.id;
//     if (!memberId) return res.status(401).json({ success: false, message: 'Unauthorized' });

//     const { id } = req.params; // campaign id
//     const campaign = await Campaign.findById(id);
//     if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

//     // Only owner can convert; campaign must be funded
//     if (campaign.owner.toString() !== memberId) {
//       return res.status(403).json({ success: false, message: 'Only owner can convert campaign to project' });
//     }

//     if (campaign.status !== 'funded') {
//       return res.status(400).json({ success: false, message: 'Campaign is not funded yet' });
//     }

//     // Create project from campaign
//     const project = await Project.create({
//       owner: campaign.owner,
//       sourceCampaign: campaign._id,
//       title: campaign.title,
//       description: campaign.description,
//       aboutEntrepreneur: campaign.aboutEntrepreneur,
//       coverImageUrl: campaign.coverImageUrl,
//       fundingType: campaign.fundingType,
//       fundingGoalINR: campaign.fundingGoalINR,
//       amountRaisedINR: campaign.amountRaisedINR,
//       backersCount: campaign.backersCount,
//       projectDeadline: campaign.projectDeadline,
//       status: 'ongoing',
//       tags: campaign.tags,
//     });

//     res.status(201).json({ success: true, project });
//   } catch (err) {
//     console.error('Convert To Project Error:', err);
//     res.status(500).json({ success: false, message: 'Failed to convert campaign to project' });
//   }
// };











const Campaign = require('../models/campaignModel');
const Project = require('../models/projectModel');

// Create a new campaign (handles file upload via multer)

exports.createCampaign = async (req, res) => {
  try {
    const memberId = req.member?.id;
    if (!memberId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Support both direct JSON and multipart/form-data (legacy fields)
    const {
      title,
      project_name,
      fundingType,
      fund_type,
      fundingGoalINR,
      amount,
      description,
      aboutEntrepreneur,
      about_entrepreneur,
      fundingDeadline,
      funding_deadline,
      projectDeadline,
      project_deadline,
      tags,
    } = req.body;

    const campaign = await Campaign.create({
      owner: memberId,
      title: title || project_name,
      fundingType: fundingType || fund_type,
      fundingGoalINR: Number(fundingGoalINR || amount || 0),
      description,
      aboutEntrepreneur: aboutEntrepreneur || about_entrepreneur,
      fundingDeadline: fundingDeadline || funding_deadline,
      projectDeadline: projectDeadline || project_deadline,
      coverImageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      tags,
    });

    res.status(201).json({ success: true, campaign });
  } catch (err) {
    console.error('Create Campaign Error:', err);
    res.status(500).json({ success: false, message: 'Failed to create campaign' });
  }
};

exports.listCampaigns = async (req, res) => {
  try {
    const { owner, status, mine } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (owner) filter.owner = owner;
    if (mine === 'true' && req.member?.id) filter.owner = req.member.id;

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

    if (campaign.owner.toString() !== memberId) {
      return res.status(403).json({ success: false, message: 'Only owner can convert campaign to project' });
    }
    if (campaign.status !== 'funded') {
      return res.status(400).json({ success: false, message: 'Campaign is not funded yet' });
    }

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
      status: 'ongoing',
      tags: campaign.tags,
    });

    res.status(201).json({ success: true, project });
  } catch (err) {
    console.error('Convert To Project Error:', err);
    res.status(500).json({ success: false, message: 'Failed to convert campaign to project' });
  }
};
