/**
 * FGE Landing Page Model
 *
 * Represents an SEO-optimised landing page for a service + city combination.
 * Examples: /plumber/charlotte-nc, /electrician/dallas-tx
 */

const mongoose = require('mongoose');

const LandingPageSchema = new mongoose.Schema(
  {
    // URL structure
    service: { type: String, required: true, trim: true, lowercase: true }, // e.g. "plumber"
    city: { type: String, required: true, trim: true, lowercase: true },    // e.g. "charlotte"
    state: { type: String, required: true, trim: true, lowercase: true },   // e.g. "nc"
    slug: { type: String, required: true, unique: true, trim: true },       // e.g. "plumber/charlotte-nc"

    // Content
    title: { type: String, required: true },
    metaDescription: { type: String },
    h1: { type: String },
    body: { type: String },        // main page HTML / markdown
    faq: [
      {
        question: { type: String },
        answer: { type: String },
      },
    ],

    // SEO elements
    canonicalUrl: { type: String },
    schemaJson: { type: String },   // JSON-LD stringified
    ogTitle: { type: String },
    ogDescription: { type: String },
    ogImage: { type: String },
    breadcrumbs: [
      {
        label: { type: String },
        url: { type: String },
      },
    ],
    internalLinks: [
      {
        text: { type: String },
        href: { type: String },
      },
    ],

    // Status
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    indexingStatus: {
      type: String,
      enum: ['pending', 'queued', 'submitted', 'indexed', 'failed'],
      default: 'pending',
    },
    indexingSubmittedAt: { type: Date },
    publishedAt: { type: Date },

    // Metrics
    views: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    avgPosition: { type: Number, default: 0 },

    // AI provenance
    generatedByAI: { type: Boolean, default: false },
  },
  { timestamps: true }
);

LandingPageSchema.index({ slug: 1 }, { unique: true });
LandingPageSchema.index({ service: 1, city: 1, state: 1 });
LandingPageSchema.index({ status: 1, indexingStatus: 1 });

module.exports = mongoose.model('FGELandingPage', LandingPageSchema);
