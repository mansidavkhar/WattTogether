const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const { initializeSocket } = require('./socket/socketHandler');
const { initializeCronJobs, manualTrigger } = require('./services/milestoneExecutionService');

// Modular routing
const memberRoutes = require('./routes/memberRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const networkRoutes = require('./routes/networkRoutes');
const faucetRoutes = require('./routes/faucetRoutes');
const kycRoutes = require('./routes/kycRoutes');
const donationRoutes = require('./routes/donationRoutes');
const milestoneSubmissionRoutes = require('./routes/milestoneSubmissionRoutes');
const milestoneGovernanceRoutes = require('./routes/milestoneGovernanceRoutes');
const milestoneCommentRoutes = require('./routes/milestoneCommentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// HTTP Server for Socket.IO
const server = http.createServer(app);
initializeSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully.');
    
    // Initialize milestone execution cron jobs
    initializeCronJobs();
    console.log('✅ Milestone execution cron jobs initialized');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// Modular Routes
app.use('/api/members', memberRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/faucet', faucetRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/milestones', milestoneSubmissionRoutes);
app.use('/api/governance', milestoneGovernanceRoutes);
app.use('/api/milestone-comments', milestoneCommentRoutes);

// Manual trigger for milestone execution (for testing)
app.post('/api/admin/trigger-milestone-execution', async (req, res) => {
  try {
    console.log('🔧 Manual milestone execution triggered');
    await manualTrigger();
    res.json({ success: true, message: 'Milestone execution completed' });
  } catch (error) {
    console.error('Error in manual trigger:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Root
app.get('/', (req, res) => {
  res.send('WattTogether API is running!');
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
