const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DonationSchema = new Schema({
  member: {
    type: Schema.Types.ObjectId,
    ref: 'user', // Refers to your User model
    required: true,
  },
  campaign: {
    type: Schema.Types.ObjectId,
    ref: 'campaign', // Refers to your Campaign model
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String, // e.g., "USDC"
    required: true,
  },
  txHash: {
    type: String,
    required: true,
    unique: true, // Prevents double-recording
  },
  // You could also add an 'amountINR' field
  // if you get that data back from Coinbase
  
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('donation', DonationSchema);
