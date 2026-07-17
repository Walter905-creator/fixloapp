'use strict';

/**
 * FGACampaignAttribution — Professional Acquisition Source Tracking
 *
 * Tracks where every professional came from (UTM source, referrer, etc.)
 * and records the full conversion funnel from visitor → first completed job.
 */

const mongoose = require('mongoose');

const FGACampaignAttributionSchema = new mongoose.Schema(
  {
    proId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pro',
      required: true,
      unique: true,
      index: true,
    },

    // ── Acquisition source ────────────────────────────────────────────────────
    source: {
      type: String,
      enum: [
        'facebook',
        'instagram',
        'google',
        'seo',
        'referral',
        'recruiter',
        'direct',
        'landing_page',
        'qr_code',
        'email',
        'sms',
        'youtube',
        'tiktok',
        'twitter',
        'linkedin',
        'other',
        'unknown',
      ],
      default: 'unknown',
      index: true,
    },

    // UTM parameters captured at signup
    utmSource:   { type: String, trim: true, default: '' },
    utmMedium:   { type: String, trim: true, default: '' },
    utmCampaign: { type: String, trim: true, default: '' },
    utmContent:  { type: String, trim: true, default: '' },
    utmTerm:     { type: String, trim: true, default: '' },

    // Referring recruiter (if recruiter link was used)
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecruiterProfile',
      default: null,
      index: true,
    },
    recruiterCode: { type: String, trim: true, default: '' },

    // Landing page URL that drove the signup
    landingPage:   { type: String, trim: true, default: '' },
    referrerUrl:   { type: String, trim: true, default: '' },

    // QR code or promo code used
    promoCode:     { type: String, trim: true, default: '' },
    qrCodeId:      { type: String, trim: true, default: '' },

    // Signup IP for geographic analysis
    signupIp:      { type: String, trim: true, default: '' },

    // ── Funnel timestamps ─────────────────────────────────────────────────────
    visitorAt:          { type: Date, default: null },  // landing page visit
    leadAt:             { type: Date, default: null },  // started signup form
    registeredAt:       { type: Date, default: null },  // completed registration
    phoneVerifiedAt:    { type: Date, default: null },  // phone verified
    subscribedAt:       { type: Date, default: null },  // first subscription paid
    firstLeadAt:        { type: Date, default: null },  // received first lead
    firstJobCompletedAt:{ type: Date, default: null },  // completed first job

    // ── Funnel stage (current stage reached) ──────────────────────────────────
    funnelStage: {
      type: String,
      enum: [
        'visitor',
        'lead',
        'registered',
        'phone_verified',
        'subscribed',
        'first_lead',
        'first_job_completed',
      ],
      default: 'visitor',
      index: true,
    },

    // ── Revenue attributed to this source ─────────────────────────────────────
    lifetimeRevenueCents: { type: Number, default: 0 },
    monthsSubscribed:     { type: Number, default: 0 },

    // ── Attribution model ─────────────────────────────────────────────────────
    attributionModel: {
      type: String,
      enum: ['first_touch', 'last_touch', 'linear'],
      default: 'first_touch',
    },
  },
  {
    timestamps: true,
    collection: 'fga_campaign_attribution',
  }
);

FGACampaignAttributionSchema.index({ source: 1, funnelStage: 1 });
FGACampaignAttributionSchema.index({ utmCampaign: 1, subscribedAt: -1 });
FGACampaignAttributionSchema.index({ recruiterId: 1, subscribedAt: -1 });

module.exports = mongoose.model('FGACampaignAttribution', FGACampaignAttributionSchema);
