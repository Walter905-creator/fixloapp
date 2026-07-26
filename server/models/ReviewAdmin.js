/**
 * ReviewAdmin model
 *
 * Stores the single Meta App Review administrator account.
 * This document is created at startup when META_REVIEW_MODE=true and
 * is never created or modified otherwise.
 *
 * The account email is always review@fixloapp.com.
 * The password hash is derived from the META_REVIEW_PASSWORD environment variable.
 */
const mongoose = require('mongoose');

const REVIEW_PERMISSIONS = [
  'dashboard',
  'social_media_manager',
  'meta_integration',
  'lead_management',
  'facebook_connect',
];

const reviewAdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin'],
      default: 'admin',
    },
    /**
     * Subset of features this review admin is allowed to access.
     * Must be a non-empty subset of REVIEW_PERMISSIONS.
     */
    permissions: {
      type: [String],
      enum: REVIEW_PERMISSIONS,
      default: REVIEW_PERMISSIONS,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReviewAdmin', reviewAdminSchema);
module.exports.REVIEW_PERMISSIONS = REVIEW_PERMISSIONS;
module.exports.REVIEW_EMAIL = 'review@fixloapp.com';
