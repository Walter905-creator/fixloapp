const mongoose = require('mongoose');

// ShareEvent Schema for tracking profile sharing and awarding boosts
const ShareEventSchema = new mongoose.Schema({
  proId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pro', 
    index: true, 
    required: true 
  },
  medium: { 
    type: String, 
    enum: ['facebook', 'instagram', 'linkedin', 'x', 'whatsapp', 'copy'], 
    required: true 
  },
  source: { 
    type: String, 
    default: 'profile_share' 
  }, // for future expansion
  utm: { 
    type: Object, 
    default: {} 
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    index: true 
  }
});

// Index for efficient querying by proId and date range
ShareEventSchema.index({ proId: 1, createdAt: -1 });

module.exports = mongoose.model('ShareEvent', ShareEventSchema);