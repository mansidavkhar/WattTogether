const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const fs = require('fs');
const path = require('path');
const jose = require('node-jose');
require('dotenv').config();

const { initializeKeys } = require('./controllers/memberController');
const { initializeSocket } = require('./socket/socketHandler');

// Modular routing
const memberRoutes = require('./routes/memberRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const projectRoutes = require('./routes/projectRoutes');
const networkRoutes = require('./routes/networkRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const coinbaseRoutes = require('./routes/coinbaseRoutes'); // NEW (see below)

const app = express();
const PORT = process.env.PORT || 8080;

// HTTP Server for Socket.IO
const server = http.createServer(app);
initializeSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Init JWT/keys
initializeKeys();

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
app.use('/api/projects', projectRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/coinbase', coinbaseRoutes); // NEW: Coinbase Onramp API route

// JWKS endpoint
app.get('/.well-known/jwks.json', async (req, res) => {
  try {
    const KEYS_FILE = path.join(__dirname, 'config/keys.json');
    if (!fs.existsSync(KEYS_FILE)) {
      return res.status(500).json({ error: 'Keys file not found' });
    }
    const keysData = fs.readFileSync(KEYS_FILE, 'utf8');
    const keyStore = await jose.JWK.asKeyStore(keysData);
    res.json(keyStore.toJSON());
  } catch (error) {
    console.error('Error loading JWKS:', error);
    res.status(500).json({ error: 'Failed to load keys' });
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
