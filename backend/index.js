const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { initializeSocket } = require('./socket/socketHandler');

// Modular routing
const memberRoutes = require('./routes/memberRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const networkRoutes = require('./routes/networkRoutes');
const faucetRoutes = require('./routes/faucetRoutes');
const kycRoutes = require('./routes/kycRoutes');
const donationRoutesV2 = require('./routes/donationRoutesV2');
const milestoneRoutes = require('./routes/milestoneRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// HTTP Server for Socket.IO
const server = http.createServer(app);
initializeSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directories exist
const uploadDirs = ['uploads', 'uploads/kyc', 'uploads/milestones'];
uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// Static hosting (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Modular Routes
app.use('/api/members', memberRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/faucet', faucetRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/donations', donationRoutesV2);
app.use('/api/milestones', milestoneRoutes);

// Root
app.get('/', (req, res) => {
  res.send('WattTogether API is running!');
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
