const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Loads environment variables from .env file

// --- Initialize Express App ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Body parser for JSON requests

// --- Database Connection ---
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully.');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        // Exit process with failure
        process.exit(1);
    }
};

connectDB();

// --- API Routes ---
// Defines the base path for all member-related routes.
app.use('/api/members', require('./routes/memberRoutes'));


// --- Root Endpoint ---
app.get('/', (req, res) => {
    res.send('WattTogether API is running!');
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});