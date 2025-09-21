const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Will be a hashed password
    dob: { type: String },
    phone: { type: String },
    pincode: { type: String },
    interest: [{ type: String }],
    // This is the crucial field for Web3 integration!
    walletAddress: { type: String, sparse: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Member', memberSchema);
