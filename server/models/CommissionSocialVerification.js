const mongoose = require('mongoose');

/**
 * Commission Social Verification Model
 * 
 * Tracks social media posts made by referrers to unlock payouts.
 * Referrers must complete at least one public social media share.
 */
const commissionSocialVerificationSchema = new mongoose.Schema({
  // Referrer
  referrerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommissionReferrer',
    required: true,
    index: true
  },
  
  // Social platform
  platform: {
    type: String,
    enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'other'],
    required: true
  },
  
  // Public post URL
  postUrl: {
    type: String,
    required: true,
    trim: true
  },
  
  // Screenshot URL (optional, stored in Cloudinary)
  screenshotUrl: {
    type: String,
    default: null
  },
  
  // Verification status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  
  // Verification details
  verifiedAt: {
    type: Date,
    default: null
  },
  
  verifiedBy: {
    type: String,
    default: null // Admin user ID or email
  },
  
  rejectionReason: {
    type: String,
    default: null
  },
  
  // Admin notes
  adminNotes: {
    type: String,
    default: ''
  },
  
  // Country for compliance
  country: {
    type: String,
    uppercase: true,
    default: 'US'
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
commissionSocialVerificationSchema.index({ referrerId: 1, status: 1 });
commissionSocialVerificationSchema.index({ platform: 1, status: 1 });
commissionSocialVerificationSchema.index({ createdAt: -1 });

// Check if referrer has approved verification
commissionSocialVerificationSchema.statics.hasApprovedVerification = async function(referrerId) {
  const approved = await this.findOne({
    referrerId: referrerId,
    status: 'approved'
  });
  
  return !!approved;
};

module.exports = mongoose.model('CommissionSocialVerification', commissionSocialVerificationSchema);
