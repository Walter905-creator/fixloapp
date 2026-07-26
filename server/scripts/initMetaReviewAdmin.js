/**
 * initMetaReviewAdmin
 *
 * Creates the dedicated Meta App Review administrator account at server startup.
 *
 * Behaviour:
 *  - Runs only when META_REVIEW_MODE=true is set in the environment.
 *  - Requires META_REVIEW_PASSWORD to be set; aborts without creating the
 *    account if the variable is missing or empty (avoids a blank-password account).
 *  - Never overwrites an existing account for review@fixloapp.com.
 *  - Stores the password using bcrypt (12 salt rounds).
 */
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const ReviewAdmin = require('../models/ReviewAdmin');
const { REVIEW_PERMISSIONS, REVIEW_EMAIL } = require('../models/ReviewAdmin');

const BCRYPT_ROUNDS = 12;

async function initMetaReviewAdmin() {
  // Guard: only run when META_REVIEW_MODE is explicitly enabled.
  if (process.env.META_REVIEW_MODE !== 'true') {
    console.log('[META_REVIEW] META_REVIEW_MODE is not enabled — skipping review admin setup.');
    return null;
  }

  // Guard: require a non-empty password.
  const rawPassword = process.env.META_REVIEW_PASSWORD;
  if (!rawPassword?.trim()) {
    console.error(
      '[META_REVIEW] ❌ META_REVIEW_PASSWORD is not set or empty. ' +
      'Review admin account will NOT be created. ' +
      'Set META_REVIEW_PASSWORD in your environment and restart the server.'
    );
    return null;
  }

  // Guard: database must be connected.
  if (mongoose.connection.readyState !== 1) {
    console.error('[META_REVIEW] ❌ Database is not connected. Skipping review admin setup.');
    return null;
  }

  try {
    // Never overwrite an existing account.
    const existing = await ReviewAdmin.findOne({ email: REVIEW_EMAIL });
    if (existing) {
      console.log(`[META_REVIEW] ✅ Review admin account already exists (${REVIEW_EMAIL}). No changes made.`);
      return existing;
    }

    const passwordHash = await bcrypt.hash(rawPassword, BCRYPT_ROUNDS);

    const reviewAdmin = await ReviewAdmin.create({
      email: REVIEW_EMAIL,
      passwordHash,
      role: 'admin',
      permissions: REVIEW_PERMISSIONS,
      isActive: true,
    });

    console.log(`[META_REVIEW] ✅ Review admin account created: ${REVIEW_EMAIL}`);
    return reviewAdmin;
  } catch (error) {
    // Duplicate-key error means the account was created concurrently (race condition).
    if (error.code === 11000) {
      console.log(`[META_REVIEW] ✅ Review admin account already exists (${REVIEW_EMAIL}). No changes made.`);
      return null;
    }
    console.error('[META_REVIEW] ❌ Failed to create review admin account:', error.message);
    throw error;
  }
}

module.exports = { initMetaReviewAdmin };
