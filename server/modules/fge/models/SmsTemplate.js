/**
 * FGE SMS Template Model
 *
 * Stores re-usable SMS message templates used by the SMS Automation module.
 * Integrates with Twilio for delivery.
 */

const mongoose = require('mongoose');

const SmsTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    trigger: {
      type: String,
      required: true,
      enum: [
        'quote_confirmation',
        'job_reminder',
        'job_follow_up',
        'seasonal_reminder',
        'referral_invite',
        'recruiter_update',
        'manual',
      ],
    },
    body: { type: String, required: true, maxlength: 1600 }, // SMS body
    active: { type: Boolean, default: true },

    // Consent: only send to users who opted in to SMS
    requireConsent: { type: Boolean, default: true },

    // Scheduling hint (used by campaign manager)
    delayMinutes: { type: Number, default: 0 }, // send N minutes after trigger
    audience: {
      type: String,
      enum: ['homeowners', 'contractors', 'recruiters', 'all'],
      default: 'all',
    },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

SmsTemplateSchema.index({ trigger: 1, active: 1 });

module.exports = mongoose.model('FGESmsTemplate', SmsTemplateSchema);
