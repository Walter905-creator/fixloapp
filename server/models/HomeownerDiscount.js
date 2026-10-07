const mongoose = require('mongoose');

// Phone is the primary key. Keep this record when an account is deleted so a
// second account or another invitation cannot reset a used welcome discount.
const schema = new mongoose.Schema({
  _id: { type: String },
  homeownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Homeowner', required: true },
  invitationCode: { type: String, required: true },
  reservedJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRequest', default: null },
  usedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('HomeownerDiscount', schema);
