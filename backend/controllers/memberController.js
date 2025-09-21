const Member = require('../models/memberModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// --- Member Registration ---
// Handles the logic for creating a new member account.
exports.register = async (req, res) => {
    try {
        // Check if a member with the given email already exists
        const existingMember = await Member.findOne({ email: req.body.email });
        if (existingMember) {
            return res.status(400).json({ success: false, message: "A member with this email already exists." });
        }

        // Hash the password for security before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        // Create a new member instance with all the data from the frontend form
        const newMember = new Member({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            dob: req.body.dob,
            phone: req.body.phone,
            pincode: req.body.pincode,
            interest: req.body.interest,
        });

        // Save the new member to the database
        const member = await newMember.save();

        // Create a JWT payload and sign the token
        const payload = { member: { id: member.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3d' });

        res.json({ success: true, token });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, message: "Server Error during registration." });
    }
};

// --- Member Login ---
// Handles the logic for authenticating an existing member.
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Find the member by email
        const member = await Member.findOne({ email });
        if (!member) {
            return res.status(400).json({ success: false, message: "Invalid credentials. Member not found." });
        }

        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, member.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials. Password incorrect." });
        }

        // Create a JWT payload and sign the token
        const payload = { member: { id: member.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3d' });

        res.json({ success: true, token });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: "Server Error during login." });
    }
};

// --- Save Wallet Address ---
// An endpoint to save the wallet address obtained from Web3Auth on the frontend.
// This requires the user to be authenticated.
exports.saveWalletAddress = async (req, res) => {
    try {
        const { walletAddress } = req.body;
        // The member's ID is available from the JWT token after authentication
        const memberId = req.member.id; 

        // Find the member and update their wallet address
        const member = await Member.findByIdAndUpdate(memberId, { walletAddress }, { new: true });

        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found.' });
        }

        res.json({ success: true, message: 'Wallet address updated successfully.', member });

    } catch (error) {
        // Handle potential unique constraint error if the address already exists for another user
        if (error.code === 11000) {
             return res.status(400).json({ success: false, message: 'This wallet address is already associated with another account.' });
        }
        console.error("Save Wallet Error:", error);
        res.status(500).json({ success: false, message: 'Server error while saving wallet address.' });
    }
};
