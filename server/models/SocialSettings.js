const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  platform: String,
  content: String,
  postedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['sent', 'failed', 'skipped'], default: 'sent' }
}, { _id: false });

const SocialSettingsSchema = new mongoose.Schema({
  _singleton: { type: String, default: 'social', unique: true },

  autoPostingEnabled: { type: Boolean, default: false },
  postingFrequency: {
    type: String,
    enum: ['daily', 'twice_daily', 'weekly'],
    default: 'daily'
  },
  connectedAccounts: {
    facebook: { type: Boolean, default: false },
    instagram: { type: Boolean, default: false },
    twitter: { type: Boolean, default: false }
  },
  recentPosts: { type: [PostSchema], default: [] },

  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SocialSettings', SocialSettingsSchema);
