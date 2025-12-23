const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    // Core user identity fields
    name: {
        type: String,
        required: false, // Privy may not always provide name initially
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    
    // Privy authentication
    privyUserId: {
        type: String,
        unique: true,
        sparse: true, // Unique identifier from Privy
    },
    
    // Legacy password field (optional for backward compatibility)
    password: {
        type: String,
        required: false,
    },
    
    // Web3 integration (managed by Privy)
    walletAddress: {
        type: String,
        unique: true,
        sparse: true, // Allows multiple documents to have a null value for this field
    },

    // // Additional personal information
    // dob: {
    //     type: String,
    // },
    // phone: {
    //     type: String,
    // },
    // pincode: {
    //     type: String,
    // },
    // interest: [{
    //     type: String,
    // }],

    // Fields for the networking profile feature
    bio: {
        type: String,
        default: '',
    },
    location: {
        type: String,
        default: '',
    },
    profilePicture: {
        type: String, // URL to the uploaded profile picture
        default: '',
    },
    connections: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
    }],
    profileSetupComplete: {
        type: Boolean,
        default: false,
    },
    
    // KYC fields
    kycStatus: {
        type: String,
        enum: ['none', 'pending', 'verified', 'rejected'],
        default: 'none'
    },
    kycDocuments: [{
        type: String // URLs to uploaded documents
    }],
    kycSubmittedAt: {
        type: Date
    },
    kycVerifiedAt: {
        type: Date
    },
    kycRejectionReason: {
        type: String
    }
}, { timestamps: true });

const Member = mongoose.model('Member', memberSchema);

module.exports = Member;

