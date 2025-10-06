const Member = require('../models/memberModel');
const Message = require('../models/messageModel');
const Connection = require('../models/connectionModel');

/**
 * @route   PUT /api/network/profile
 * @desc    Update the current member's network profile (bio, location, etc.)
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
    try {
        const { bio, location } = req.body;
        const memberId = req.member.id; // From authMiddleware

        const updatedFields = {
            bio,
            location,
            profileSetupComplete: true, // Mark setup as complete
        };

        const member = await Member.findByIdAndUpdate(
            memberId,
            { $set: updatedFields },
            { new: true, select: '-password' } // Return the updated document, exclude password
        );

        if (!member) {
            return res.status(404).json({ msg: 'Member not found' });
        }

        res.json(member);
    } catch (err) {
        console.error('Error updating profile:', err.message);
        res.status(500).send('Server Error');
    }
};

/**
 * @route   GET /api/network/search
 * @desc    Search for members by name or email
 * @access  Private
 */
exports.searchMembers = async (req, res) => {
    try {
        const query = req.query.q || '';
        const currentUserId = req.member.id;

        const members = await Member.find({
            _id: { $ne: currentUserId }, // Exclude the current user
            $or: [
                { name: { $regex: query, $options: 'i' } }, // Case-insensitive search
                { email: { $regex: query, $options: 'i' } },
            ],
        }).select('-password'); // Exclude password from results

        res.json(members);
    } catch (err) {
        console.error('Error searching members:', err.message);
        res.status(500).send('Server Error');
    }
};

/**
 * @route   POST /api/network/connect/:id
 * @desc    Send a connection request to another member
 * @access  Private
 */
exports.connectWithMember = async (req, res) => {
    // This is a simplified connection logic. In a real app, you might
    // want a request/accept system. Here, we'll just connect them directly.
    try {
        const currentUserId = req.member.id;
        const targetUserId = req.params.id;

        // Add each member to the other's connections list
        await Member.findByIdAndUpdate(currentUserId, { $addToSet: { connections: targetUserId } });
        await Member.findByIdAndUpdate(targetUserId, { $addToSet: { connections: currentUserId } });
        
        // You could create a Connection document here if needed for more detail
        // For now, this direct linking is simpler.

        res.json({ msg: 'Connection established' });
    } catch (err) {
        console.error('Error connecting with member:', err.message);
        res.status(500).send('Server Error');
    }
};

/**
 * @route   GET /api/network/connections
 * @desc    Get the current member's connections
 * @access  Private
 */
exports.getConnections = async (req, res) => {
    try {
        const member = await Member.findById(req.member.id)
            .populate('connections', 'name email profilePicture bio') // Populate with connection details
            .select('connections');

        if (!member) {
            return res.status(404).json({ msg: 'Member not found' });
        }

        res.json(member.connections);
    } catch (err) {
        console.error('Error getting connections:', err.message);
        res.status(500).send('Server Error');
    }
};

/**
 * @route   GET /api/network/chat/:recipientId
 * @desc    Get chat history with another member
 * @access  Private
 */
exports.getChatHistory = async (req, res) => {
    try {
        const currentUserId = req.member.id;
        const recipientId = req.params.recipientId;

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, recipient: recipientId },
                { sender: recipientId, recipient: currentUserId },
            ],
        }).sort({ timestamp: 'asc' });

        res.json(messages);
    } catch (err) {
        console.error('Error getting chat history:', err.message);
        res.status(500).send('Server Error');
    }
};
