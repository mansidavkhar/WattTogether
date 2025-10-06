const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true,
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
