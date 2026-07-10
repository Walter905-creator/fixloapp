/**
 * FGE AI-Generated Image Model
 *
 * Stores images generated via OpenAI DALL-E and uploaded to Cloudinary.
 */

const mongoose = require('mongoose');

const FGEImageSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true },
    url: { type: String, required: true },          // Cloudinary / CDN URL
    thumbnailUrl: { type: String },
    cloudinaryPublicId: { type: String },
    width: { type: Number },
    height: { type: Number },
    format: { type: String, default: 'png' },
    usedIn: { type: String },                       // campaign, blog, landing-page ID
    tags: [{ type: String }],
    generatedBy: { type: String, default: 'dall-e-3' },
  },
  { timestamps: true }
);

FGEImageSchema.index({ tags: 1 });
FGEImageSchema.index({ usedIn: 1 });

module.exports = mongoose.model('FGEImage', FGEImageSchema);
