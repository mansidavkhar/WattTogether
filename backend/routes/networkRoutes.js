const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const Member = require('../models/memberModel');
const Connection = require('../models/connectionModel');
const Message = require('../models/messageModel');
const mongoose = require('mongoose');

// Update user profile (bio, location, etc.)
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, bio, location } = req.body;
        const member = await Member.findByIdAndUpdate(
            req.member.id,
            { name, bio, location, profileSetupComplete: true },
            { new: true }
        ).select('-password');
        res.json(member);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Search for members
router.get('/members', authMiddleware, async (req, res) => {
    try {
        const searchTerm = req.query.search || '';
        const members = await Member.find({
            _id: { $ne: req.member.id }, // Exclude self
            name: { $regex: searchTerm, $options: 'i' }
        }).select('name bio location profilePicture');
        res.json(members);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Send a connection request
router.post('/connections/request/:recipientId', authMiddleware, async (req, res) => {
    try {
        const { recipientId } = req.params;
        const requesterId = req.member.id;

        if (requesterId === recipientId) {
            return res.status(400).json({ msg: 'You cannot connect with yourself.' });
        }

        // Check if a connection already exists
        const existingConnection = await Connection.findOne({
            $or: [
                { requester: requesterId, recipient: recipientId },
                { requester: recipientId, recipient: requesterId },
            ],
        });

        if (existingConnection) {
            return res.status(400).json({ msg: 'Connection request already sent or you are already connected.' });
        }

        const newConnection = new Connection({ requester: requesterId, recipient: recipientId });
        await newConnection.save();

        res.status(201).json(newConnection);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// Get all connections (pending and accepted)
router.get('/connections', authMiddleware, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.member.id);

        const connections = await Connection.find({
            $or: [{ requester: userId }, { recipient: userId }]
        }).populate('requester', 'name profilePicture').populate('recipient', 'name profilePicture');

        res.json(connections);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// Respond to a connection request
router.put('/connections/respond/:requestId', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body; // 'accepted' or 'declined'
        const { requestId } = req.params;

        const request = await Connection.findById(requestId);

        if (!request || request.recipient.toString() !== req.member.id) {
            return res.status(404).json({ msg: 'Request not found.' });
        }

        if (status === 'accepted') {
            request.status = 'accepted';
            await request.save();

            // Add each other to connections list
            await Member.findByIdAndUpdate(request.requester, { $addToSet: { connections: request.recipient } });
            await Member.findByIdAndUpdate(request.recipient, { $addToSet: { connections: request.requester } });
        } else {
            // If declined, we can remove the request
            await Connection.findByIdAndDelete(requestId);
            return res.status(200).json({ msg: 'Request declined.' });
        }
        
        const updatedRequest = await Connection.findById(requestId)
            .populate('requester', 'name profilePicture')
            .populate('recipient', 'name profilePicture');

        res.json(updatedRequest);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// Get chat history with another user
router.get('/messages/:partnerId', authMiddleware, async (req, res) => {
    try {
        const myId = req.member.id;
        const { partnerId } = req.params;

        const messages = await Message.find({
            $or: [
                { sender: myId, recipient: partnerId },
                { sender: partnerId, recipient: myId },
            ],
        }).sort({ createdAt: 1 }); // Fetch in chronological order

        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
