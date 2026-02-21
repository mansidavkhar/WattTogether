const Member = require('../models/memberModel');
const path = require('path');

/**
 * Submit KYC documents
 * Member uploads documents for verification
 */
exports.submitKYC = async (req, res) => {
    try {
        const memberId = req.member.id;
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please upload at least one document' 
            });
        }

        // Get uploaded file URLs - files are stored in uploads/kyc/ folder
        const documentUrls = req.files.map(file => `/uploads/kyc/${file.filename}`);

        // Update member with KYC documents
        const member = await Member.findByIdAndUpdate(
            memberId,
            {
                kycDocuments: documentUrls,
                kycStatus: 'pending',
                kycSubmittedAt: new Date()
            },
            { new: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'KYC documents submitted successfully. Awaiting admin approval.',
            member: {
                id: member._id,
                email: member.email,
                kycStatus: member.kycStatus,
                kycDocuments: member.kycDocuments
            }
        });

    } catch (error) {
        console.error('KYC submission error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to submit KYC documents',
            error: error.message 
        });
    }
};

/**
 * Get KYC status for current member
 */
exports.getKYCStatus = async (req, res) => {
    try {
        const member = await Member.findById(req.member.id).select('kycStatus kycDocuments kycSubmittedAt kycRejectionReason');
        
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        res.json({
            success: true,
            kycStatus: member.kycStatus,
            kycDocuments: member.kycDocuments,
            kycSubmittedAt: member.kycSubmittedAt,
            kycRejectionReason: member.kycRejectionReason
        });

    } catch (error) {
        console.error('Get KYC status error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get KYC status',
            error: error.message 
        });
    }
};

/**
 * Get all pending KYC requests (Admin only)
 */
exports.getPendingKYC = async (req, res) => {
    try {
        const pendingMembers = await Member.find({ kycStatus: 'pending' })
            .select('name email kycDocuments kycSubmittedAt')
            .sort({ kycSubmittedAt: -1 });

        res.json({
            success: true,
            count: pendingMembers.length,
            members: pendingMembers
        });

    } catch (error) {
        console.error('Get pending KYC error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get pending KYC requests',
            error: error.message 
        });
    }
};

/**
 * Approve KYC (Admin only)
 */
exports.approveKYC = async (req, res) => {
    try {
        const { memberId } = req.params;

        const member = await Member.findByIdAndUpdate(
            memberId,
            {
                kycStatus: 'verified',
                kycVerifiedAt: new Date(),
                kycRejectionReason: null
            },
            { new: true }
        ).select('name email kycStatus kycVerifiedAt');

        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        res.json({
            success: true,
            message: `KYC approved for ${member.email}`,
            member: {
                id: member._id,
                email: member.email,
                kycStatus: member.kycStatus,
                kycVerifiedAt: member.kycVerifiedAt
            }
        });

    } catch (error) {
        console.error('Approve KYC error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to approve KYC',
            error: error.message 
        });
    }
};

/**
 * Reject KYC (Admin only)
 */
exports.rejectKYC = async (req, res) => {
    try {
        const { memberId } = req.params;
        const { reason } = req.body;

        const member = await Member.findByIdAndUpdate(
            memberId,
            {
                kycStatus: 'rejected',
                kycRejectionReason: reason || 'Documents did not meet requirements',
                kycDocuments: [] // Clear documents
            },
            { new: true }
        ).select('name email kycStatus kycRejectionReason');

        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        res.json({
            success: true,
            message: `KYC rejected for ${member.email}`,
            member: {
                id: member._id,
                email: member.email,
                kycStatus: member.kycStatus,
                kycRejectionReason: member.kycRejectionReason
            }
        });

    } catch (error) {
        console.error('Reject KYC error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to reject KYC',
            error: error.message 
        });
    }
};
