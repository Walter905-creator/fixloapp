'use strict';

/**
 * FGAMessage — Communication Center Log
 *
 * Every outgoing message sent through the FGA Communication Center is recorded
 * here.  This enables auditing, retry detection, and delivery analytics.
 *
 * Design: append-only; status updates are made via $set on specific fields.
 */

const mongoose = require('mongoose');

const FGAMessageSchema = new mongoose.Schema(
  {
    // ── Routing ──────────────────────────────────────────────────────────────
    channel: {
      type: String,
      enum: ['email', 'sms', 'push', 'whatsapp', 'voice'],
      required: true,
      index: true,
    },

    // ── Recipient ────────────────────────────────────────────────────────────
    recipientType: {
      type: String,
      enum: ['homeowner', 'professional', 'recruiter', 'owner', 'other'],
      default: 'other',
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    recipientAddress: {
      type: String,
      trim: true,
      required: true,
    },

    // ── Content ──────────────────────────────────────────────────────────────
    subject: { type: String, trim: true, default: '' },
    body:    { type: String, trim: true, default: '' },

    // ── Provider tracking ────────────────────────────────────────────────────
    provider: {
      type: String,
      enum: ['sendgrid', 'twilio', 'apns', 'fcm', 'internal'],
      default: 'internal',
    },
    providerMessageId: { type: String, trim: true, default: '' },

    // ── Status lifecycle ─────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'opened', 'clicked', 'failed', 'bounced'],
      default: 'queued',
      index: true,
    },
    errorMessage: { type: String, default: '' },

    // ── Timestamps ───────────────────────────────────────────────────────────
    sentAt:      { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    openedAt:    { type: Date, default: null },
    clickedAt:   { type: Date, default: null },

    // ── Event reference ──────────────────────────────────────────────────────
    triggerEvent: { type: String, default: '' },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FGALead',
      default: null,
      index: true,
    },

    // ── Metadata ─────────────────────────────────────────────────────────────
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'fga_messages',
  }
);

FGAMessageSchema.index({ createdAt: -1 });
FGAMessageSchema.index({ channel: 1, status: 1 });
FGAMessageSchema.index({ recipientId: 1, createdAt: -1 });
FGAMessageSchema.index({ leadId: 1, createdAt: -1 });

module.exports = mongoose.model('FGAMessage', FGAMessageSchema);
