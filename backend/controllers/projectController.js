const Project = require('../models/projectModel');

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
