/**
 * FGE Blog Model
 *
 * Represents an AI-generated or manually authored blog article.
 * Supports draft/publish workflow, scheduling, and SEO metadata.
 */

const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, trim: true },
    body: { type: String }, // full HTML content
    featuredImage: { type: String },

    // Authorship
    author: { type: String, default: 'Fixlo Team' },
    authorAvatar: { type: String },

    // Taxonomy
    category: { type: String, trim: true },
    tags: [{ type: String }],
    relatedServices: [{ type: String }],
    relatedCities: [{ type: String }],

    // SEO
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    canonicalUrl: { type: String },
    focusKeyword: { type: String },

    // Publishing
    status: { type: String, enum: ['draft', 'scheduled', 'published'], default: 'draft' },
    scheduledAt: { type: Date },
    publishedAt: { type: Date },

    // AI provenance
    generatedByAI: { type: Boolean, default: false },
    aiPrompt: { type: String },

    // Metrics
    views: { type: Number, default: 0 },
    readTimeMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

BlogSchema.index({ slug: 1 });
BlogSchema.index({ status: 1, publishedAt: -1 });
BlogSchema.index({ tags: 1 });
BlogSchema.index({ category: 1 });

module.exports = mongoose.model('FGEBlog', BlogSchema);
