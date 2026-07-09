/**
 * FGE Email Template Model
 *
 * Stores re-usable email templates used by the Email Automation module.
 * Integrates with SendGrid for delivery.
 */

const mongoose = require('mongoose');

const EmailTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    trigger: {
      type: String,
      required: true,
      enum: [
        'new_homeowner',
        'new_contractor',
        'recruiter_signup',
        'quote_request',
        'inactive_user',
        'job_completed',
        'seasonal_spring',
        'seasonal_summer',
        'seasonal_fall',
        'seasonal_winter',
        'referral_invite',
        'manual',
      ],
    },
    subject: { type: String, required: true },
    bodyHtml: { type: String },      // full HTML
    bodyText: { type: String },      // plain text fallback
    previewText: { type: String },   // email client preview snippet
    fromName: { type: String, default: 'Fixlo' },
    fromEmail: { type: String, default: 'hello@fixloapp.com' },
    audience: {
      type: String,
      enum: ['homeowners', 'contractors', 'recruiters', 'all'],
      default: 'all',
    },
    active: { type: Boolean, default: true },
    sendgridTemplateId: { type: String }, // link to SendGrid dynamic template
    tags: [{ type: String }],
  },
  { timestamps: true }
);

EmailTemplateSchema.index({ trigger: 1, active: 1 });

module.exports = mongoose.model('FGEEmailTemplate', EmailTemplateSchema);
