'use strict';

/**
 * FGA CRM Service
 *
 * Creates and maintains a unified CRM profile for every person on the platform.
 * Profiles are keyed by (profileType, linkedId) to avoid duplicates.
 */

const FGACRMProfile = require('../models/FGACRMProfile');

const MODEL_MAP = {
  homeowner:    'Homeowner',
  professional: 'Pro',
  recruiter:    'RecruiterProfile',
};

/**
 * Upsert a CRM profile.  Safe to call on every signup — won't create duplicates.
 *
 * @param {object} opts
 * @param {string}  opts.profileType  - 'homeowner'|'professional'|'recruiter'
 * @param {*}       opts.linkedId     - Mongoose ObjectId of the linked record
 * @param {object}  [opts.contact]    - { name, email, phone, city, state }
 * @param {*}       [opts.leadId]     - FGALead._id
 * @param {object}  [opts.metadata]   - Extra fields
 * @returns {Promise<FGACRMProfile>}
 */
async function upsert(opts = {}) {
  const { profileType, linkedId, contact = {}, leadId, metadata } = opts;

  if (!profileType || !linkedId) {
    console.warn('[FGA:CRM] ⚠️ upsert() requires profileType and linkedId');
    return null;
  }

  const linkedModel = MODEL_MAP[profileType];
  if (!linkedModel) {
    console.warn(`[FGA:CRM] ⚠️ Unknown profileType: ${profileType}`);
    return null;
  }

  try {
    const profile = await FGACRMProfile.findOneAndUpdate(
      { profileType, linkedId },
      {
        $setOnInsert: { profileType, linkedId, linkedModel },
        $set: {
          ...(contact.name  && { name:  contact.name }),
          ...(contact.email && { email: contact.email }),
          ...(contact.phone && { phone: contact.phone }),
          ...(contact.city  && { city:  contact.city }),
          ...(contact.state && { state: contact.state }),
          ...(leadId        && { leadId }),
          ...(metadata      && { metadata }),
          lastActivityAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
    return profile;
  } catch (err) {
    console.error('[FGA:CRM] ❌ upsert() error:', err.message);
    return null;
  }
}

/**
 * Increment a numeric counter on a CRM profile.
 *
 * @param {string}  profileType  - 'homeowner'|'professional'|'recruiter'
 * @param {*}       linkedId     - Mongoose ObjectId
 * @param {object}  increments   - e.g. { jobCount: 1, lifetimeValue: 4999 }
 */
async function increment(profileType, linkedId, increments = {}) {
  if (!profileType || !linkedId || !Object.keys(increments).length) return;
  try {
    await FGACRMProfile.findOneAndUpdate(
      { profileType, linkedId },
      { $inc: increments, $set: { lastActivityAt: new Date() } }
    );
  } catch (err) {
    console.error('[FGA:CRM] ❌ increment() error:', err.message);
  }
}

/**
 * Add a tag or note to a CRM profile.
 *
 * @param {string}  profileType
 * @param {*}       linkedId
 * @param {object}  opts         - { tag?, note? }
 */
async function annotate(profileType, linkedId, opts = {}) {
  const push = {};
  if (opts.tag)  push.tags  = opts.tag;
  if (opts.note) push.notes = opts.note;
  if (!Object.keys(push).length) return;

  try {
    await FGACRMProfile.findOneAndUpdate(
      { profileType, linkedId },
      { $addToSet: push, $set: { lastActivityAt: new Date() } }
    );
  } catch (err) {
    console.error('[FGA:CRM] ❌ annotate() error:', err.message);
  }
}

/**
 * Fetch a CRM profile by profileType + linkedId.
 */
async function getProfile(profileType, linkedId) {
  return FGACRMProfile.findOne({ profileType, linkedId }).lean();
}

/**
 * Search CRM profiles by email.
 */
async function findByEmail(email) {
  return FGACRMProfile.find({ email: email.toLowerCase() }).lean();
}

module.exports = { upsert, increment, annotate, getProfile, findByEmail };
