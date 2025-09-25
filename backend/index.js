const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { initializeKeys } = require('./controllers/memberController');
const fs = require('fs');
const path = require('path');
const jose = require('node-jose');
require('dotenv').config();

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Keys
initializeKeys();

// Database Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected successfully.');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};

connectDB();

// Serve uploads folder as static for cover images, etc.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/members', require('./routes/memberRoutes'));
app.use('/api/campaigns', require('./routes/campaignRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));

// JWKS endpoint directly in index.js
app.get('/.well-known/jwks.json', async (req, res) => {
    try {
        const KEYS_FILE = path.join(__dirname, 'config/keys.json');
        
        if (!fs.existsSync(KEYS_FILE)) {
            return res.status(500).json({ error: 'Keys file not found' });
        }
        
        const keysData = fs.readFileSync(KEYS_FILE, 'utf8');
        const keyStore = await jose.JWK.asKeyStore(keysData);
        
        // Return only public keys
        res.json(keyStore.toJSON());
    } catch (error) {
        console.error('Error loading JWKS:', error);
        res.status(500).json({ error: 'Failed to load keys' });
    }
});

// Root Endpoint
app.get('/', (req, res) => {
    res.send('WattTogether API is running!');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
