const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    // Core user identity fields
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String, // Should be a hashed password
        required: true,
    },
    
    // Web3 integration
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
    }
}, { timestamps: true });

const Member = mongoose.model('Member', memberSchema);

module.exports = Member;

