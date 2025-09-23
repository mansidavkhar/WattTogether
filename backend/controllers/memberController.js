const Member = require('../models/memberModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const jose = require('node-jose');

const KEYS_FILE = path.join(__dirname, '../config/keys.json');

// // --- Member Registration (Your existing code) ---
// exports.register = async (req, res) => {
//     console.log("Register endpoint hit.");
//     console.log("Request Body:", req.body);

//     try {
//         const { email, password, name } = req.body;

//         if (!email || !password || !name) {
//             console.log("Validation failed: Missing required fields.");
//             return res.status(400).json({ success: false, message: "Please provide name, email, and password." });
//         }

//         const existingMember = await Member.findOne({ email: req.body.email });
//         if (existingMember) {
//             console.log("Registration failed: Email already exists.");
//             return res.status(400).json({ success: false, message: "A member with this email already exists." });
//         }

//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(req.body.password, salt);
        
//         console.log("Password hashed. Creating new member...");

//         const newMember = new Member({
//             name: req.body.name,
//             email: req.body.email,
//             password: hashedPassword,
//             dob: req.body.dob,
//             phone: req.body.phone,
//             pincode: req.body.pincode,
//             interest: req.body.interest,
//         });

//         const member = await newMember.save();
//         console.log("Member saved successfully to DB:", member);

//         // Generate both regular JWT and Web3Auth-compatible JWT
//         const payload = { member: { id: member.id } };
//         const regularToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3d' });

//         // Generate Web3Auth-compatible token
//         const web3AuthToken = await generateWeb3AuthToken(member.id, member.email);

//         res.json({ 
//             success: true, 
//             token: regularToken,
//             id_token: web3AuthToken // For Web3Auth
//         });

//     } catch (error) {
//         console.error("!!! REGISTRATION ERROR !!!:", error);
//         res.status(500).json({ success: false, message: "Server Error during registration." });
//     }
// };

// // --- Member Login (Updated to include Web3Auth token) ---
// exports.login = async (req, res) => {
//     const { email, password } = req.body;
//     try {
//         const member = await Member.findOne({ email });
//         if (!member) {
//             return res.status(400).json({ success: false, message: "Invalid credentials. Member not found." });
//         }

//         const isMatch = await bcrypt.compare(password, member.password);
//         if (!isMatch) {
//             return res.status(400).json({ success: false, message: "Invalid credentials. Password incorrect." });
//         }

//         // Generate both regular JWT and Web3Auth-compatible JWT
//         const payload = { member: { id: member.id } };
//         const regularToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3d' });

//         // Generate Web3Auth-compatible token
//         const web3AuthToken = await generateWeb3AuthToken(member.id, member.email);

//         res.json({ 
//             success: true, 
//             token: regularToken,
//             id_token: web3AuthToken, // For Web3Auth
//             user: {
//                 id: member.id,
//                 name: member.name,
//                 email: member.email
//             }
//         });

//     } catch (error) {
//         console.error("Login Error:", error);
//         res.status(500).json({ success: false, message: "Server Error during login." });
//     }
// };




// --- Member Login (Updated to include Web3Auth token) ---
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const member = await Member.findOne({ email });
        if (!member) {
            return res.status(400).json({ success: false, message: "Invalid credentials. Member not found." });
        }

        const isMatch = await bcrypt.compare(password, member.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials. Password incorrect." });
        }

        // Generate regular JWT
        const payload = { member: { id: member.id } };
        const regularToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3d' });

        // Generate Web3Auth-compatible JWT
        const web3AuthToken = await generateWeb3AuthToken(member.id, member.email);

        res.json({ 
            success: true, 
            token: regularToken,        // For your regular API calls
            id_token: web3AuthToken,   // For Web3Auth
            user: {
                id: member.id,
                name: member.name,
                email: member.email
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: "Server Error during login." });
    }
};

// --- Member Registration (Updated to include Web3Auth token) ---
exports.register = async (req, res) => {
    console.log("Register endpoint hit.");
    console.log("Request Body:", req.body);

    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            console.log("Validation failed: Missing required fields.");
            return res.status(400).json({ success: false, message: "Please provide name, email, and password." });
        }

        const existingMember = await Member.findOne({ email: req.body.email });
        if (existingMember) {
            console.log("Registration failed: Email already exists.");
            return res.status(400).json({ success: false, message: "A member with this email already exists." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        
        console.log("Password hashed. Creating new member...");

        const newMember = new Member({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            dob: req.body.dob,
            phone: req.body.phone,
            pincode: req.body.pincode,
            interest: req.body.interest,
        });

        const member = await newMember.save();
        console.log("Member saved successfully to DB:", member);

        // Generate regular JWT
        const payload = { member: { id: member.id } };
        const regularToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3d' });

        // Generate Web3Auth-compatible JWT
        const web3AuthToken = await generateWeb3AuthToken(member.id, member.email);

        res.json({ 
            success: true, 
            token: regularToken,        // For your regular API calls
            id_token: web3AuthToken    // For Web3Auth
        });

    } catch (error) {
        console.error("!!! REGISTRATION ERROR !!!:", error);
        res.status(500).json({ success: false, message: "Server Error during registration." });
    }
};















// --- Save Wallet Address (Your existing code) ---
exports.saveWalletAddress = async (req, res) => {
    try {
        const { walletAddress } = req.body;
        const memberId = req.member.id; 

        const member = await Member.findByIdAndUpdate(memberId, { walletAddress }, { new: true });

        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found.' });
        }

        res.json({ success: true, message: 'Wallet address updated successfully.', member });

    } catch (error) {
        if (error.code === 11000) {
             return res.status(400).json({ success: false, message: 'This wallet address is already associated with another account.' });
        }
        console.error("Save Wallet Error:", error);
        res.status(500).json({ success: false, message: 'Server error while saving wallet address.' });
    }
};

// --- NEW: JWKS Functions ---

// Initialize RSA keys if they don't exist
exports.initializeKeys = async () => {
    try {
        if (!fs.existsSync(KEYS_FILE)) {
            console.log('Generating new RSA keys for Web3Auth JWT signing...');
            
            const keyStore = jose.JWK.createKeyStore();
            
            const key = await keyStore.generate('RSA', 2048, {
                alg: 'RS256',
                use: 'sig',
                kid: 'watt-together-key-1'
            });
            
            // Ensure config directory exists
            const configDir = path.dirname(KEYS_FILE);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            
            // Save both public and private keys
            fs.writeFileSync(KEYS_FILE, JSON.stringify(keyStore.toJSON(true), null, 2));
            console.log('Web3Auth RSA keys generated and saved successfully!');
        } else {
            console.log('Using existing RSA keys for Web3Auth JWT signing.');
        }
    } catch (error) {
        console.error('Error initializing Web3Auth keys:', error);
        process.exit(1);
    }
};

// Get JWKS (public keys only)
exports.getJWKS = async (req, res) => {
    try {
        if (!fs.existsSync(KEYS_FILE)) {
            await exports.initializeKeys();
        }
        
        const keysData = fs.readFileSync(KEYS_FILE, 'utf8');
        const keyStore = await jose.JWK.asKeyStore(keysData);
        
        // Return only public keys
        res.json(keyStore.toJSON());
    } catch (error) {
        console.error('Error loading JWKS:', error);
        res.status(500).json({ error: 'Failed to load keys' });
    }
};
// const generateWeb3AuthToken = async (userId, email) => {
//     try {
//         if (!fs.existsSync(KEYS_FILE)) {
//             await exports.initializeKeys();
//         }
        
//         const keysData = fs.readFileSync(KEYS_FILE, 'utf8');
//         const keyStore = await jose.JWK.asKeyStore(keysData);
//         const [key] = keyStore.all({ use: 'sig' });
        
//         const payload = {
//             sub: email, // Use email as subject since that's your verifier
//             email: email,
//             user_id: userId.toString(), // Include user ID as additional claim
//             iss: process.env.JWT_ISSUER || 'http://localhost:5000',
//             aud: process.env.JWT_AUDIENCE || 'watt-together-app',
//             exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
//             iat: Math.floor(Date.now() / 1000),
//             name: email.split('@')[0]
//         };
        
//         const privatePem = key.toPEM(true);
//         const token = jwt.sign(payload, privatePem, { 
//             algorithm: 'RS256',
//             keyid: 'watt-together-key-1'
//         });
        
//         return token;
        
//     } catch (error) {
//         console.error('Error creating Web3Auth token:', error);
//         throw error;
//     }
// };

// Generate Web3Auth-compatible JWT token
const generateWeb3AuthToken = async (userId, email) => {
    try {
        const KEYS_FILE = path.join(__dirname, '../config/keys.json');
        
        if (!fs.existsSync(KEYS_FILE)) {
            await exports.initializeKeys();
        }
        
        const keysData = fs.readFileSync(KEYS_FILE, 'utf8');
        const keyStore = await jose.JWK.asKeyStore(keysData);
        const [key] = keyStore.all({ use: 'sig' });
        
        const payload = {
            sub: email, // Use email as subject (matches your Web3Auth verifier config)
            email: email,
            user_id: userId.toString(),
            iss: process.env.JWT_ISSUER || 'https://whole-carpets-judge.loca.lt/',
            aud: process.env.JWT_AUDIENCE || 'watt-together-app',
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
            iat: Math.floor(Date.now() / 1000),
            name: email.split('@')[0]
        };
        
        const privatePem = key.toPEM(true);
        const token = jwt.sign(payload, privatePem, { 
            algorithm: 'RS256',
            keyid: 'watt-together-key-1'
        });
        
        return token;
        
    } catch (error) {
        console.error('Error creating Web3Auth token:', error);
        throw error;
    }
};


// Test token generation (for development)
exports.generateTestToken = async (req, res) => {
    try {
        const { userId, email } = req.body;
        
        if (!userId || !email) {
            return res.status(400).json({ 
                error: 'userId and email are required' 
            });
        }
        
        const web3AuthToken = await generateWeb3AuthToken(userId, email);
        
        res.json({ 
            id_token: web3AuthToken,
            payload: jwt.decode(web3AuthToken) // For debugging
        });
        
    } catch (error) {
        console.error('Error creating test token:', error);
        res.status(500).json({ error: 'Failed to create token' });
    }
};
