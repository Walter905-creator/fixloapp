/**
 * FGE Campaign Model
 *
 * Represents a marketing campaign (email, SMS, social, blog, etc.).
 * Used by AI Marketing Center and Seasonal Campaign Manager.
 */

const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema(
  {
    // Campaign identity
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: [
        'email',
        'sms',
        'blog',
        'facebook',
        'instagram',
        'linkedin',
        'x',
        'google_business',
        'landing_page',
        'seasonal',
      ],
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'failed'],
      default: 'draft',
    },

    // Content
    subject: { type: String, trim: true }, // email subject / post headline
    body: { type: String },                // full HTML or plain text content
    excerpt: { type: String, trim: true }, // short preview / caption
    imageUrl: { type: String },            // featured image
    ctaUrl: { type: String },              // call-to-action link
    ctaText: { type: String },             // call-to-action label

    // Targeting
    audience: {
      type: String,
      enum: ['homeowners', 'contractors', 'recruiters', 'all'],
      default: 'all',
    },
    targetCities: [{ type: String }],
    targetServices: [{ type: String }],

    // Scheduling
    scheduledAt: { type: Date },
    publishedAt: { type: Date },
    expiresAt: { type: Date },

    // Season-aware
    season: { type: String, enum: ['spring', 'summer', 'fall', 'winter', ''] },

    // Engagement metrics
    stats: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      bounced: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
    },

    // Provenance
    generatedByAI: { type: Boolean, default: false },
    aiPrompt: { type: String },
    createdBy: { type: String }, // admin user identifier
    tags: [{ type: String }],
  },
  { timestamps: true }
);

CampaignSchema.index({ type: 1, status: 1 });
CampaignSchema.index({ scheduledAt: 1 });
CampaignSchema.index({ season: 1 });

module.exports = mongoose.model('FGECampaign', CampaignSchema);
