'use strict';

/**
 * FGALead — Universal Lead Model
 *
 * Every interaction with Fixlo creates a Lead.  Sources include the website,
 * landing pages, homeowner quotes, professional signups, recruiter signups,
 * referral links, QR codes, and manual admin entry.  Future sources (Meta Ads,
 * Google Ads, API integrations) slot in without schema changes.
 */

const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const FGALeadSchema = new mongoose.Schema(
  {
    // ── Identity ────────────────────────────────────────────────────────────
    uuid: {
      type: String,
      default: randomUUID,
      unique: true,
      index: true,
    },

    // ── Classification ───────────────────────────────────────────────────────
    leadType: {
      type: String,
      enum: [
        'homeowner',
        'professional',
        'recruiter',
        'referral',
        'manual',
        'ad_meta',
        'ad_google',
        'api',
        'other',
      ],
      required: true,
      index: true,
    },

    source: {
      type: String,
      enum: [
        'website',
        'landing_page',
        'homeowner_quote',
        'pro_signup',
        'recruiter_signup',
        'referral_link',
        'qr_code',
        'admin_manual',
        'meta_ads',
        'google_ads',
        'api',
        'other',
      ],
      default: 'website',
      index: true,
    },

    // ── Campaign & attribution ───────────────────────────────────────────────
    campaign: { type: String, trim: true, default: '' },
    utm: {
      source:   { type: String, trim: true, default: '' },
      medium:   { type: String, trim: true, default: '' },
      campaign: { type: String, trim: true, default: '' },
      term:     { type: String, trim: true, default: '' },
      content:  { type: String, trim: true, default: '' },
    },

    // ── Contact info ─────────────────────────────────────────────────────────
    name:  { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '', index: true },
    phone: { type: String, trim: true, default: '' },

    // ── Trade & location ─────────────────────────────────────────────────────
    trade: { type: String, trim: true, default: '' },
    city:  { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    zip:   { type: String, trim: true, default: '' },

    // ── Ownership ────────────────────────────────────────────────────────────
    assignedRecruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecruiterProfile',
      default: null,
      index: true,
    },

    // ── Status & lifecycle ───────────────────────────────────────────────────
    status: {
      type: String,
      enum: [
        'new',
        'contacted',
        'in_progress',
        'converted',
        'lost',
        'inactive',
        'duplicate',
      ],
      default: 'new',
      index: true,
    },

    // ── Linked platform records ──────────────────────────────────────────────
    linkedProId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pro',
      default: null,
    },
    linkedHomeownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Homeowner',
      default: null,
    },
    linkedJobRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobRequest',
      default: null,
    },

    // ── Tags ─────────────────────────────────────────────────────────────────
    tags: { type: [String], default: [] },

    // ── Flexible metadata ────────────────────────────────────────────────────
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ── Deactivation ─────────────────────────────────────────────────────────
    isActive: { type: Boolean, default: true, index: true },
    deactivatedAt: { type: Date, default: null },
    deactivatedBy: { type: String, default: null },

    // ── Merge tracking ───────────────────────────────────────────────────────
    mergedIntoLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FGALead',
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt
    collection: 'fga_leads',
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
FGALeadSchema.index({ createdAt: -1 });
FGALeadSchema.index({ status: 1, leadType: 1 });
FGALeadSchema.index({ email: 1, leadType: 1 });
FGALeadSchema.index({ phone: 1, leadType: 1 });
FGALeadSchema.index({ 'utm.campaign': 1 });
FGALeadSchema.index({ isActive: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('FGALead', FGALeadSchema);
