'use strict';

/**
 * FGA Activity Logger
 *
 * Tracks every meaningful user action.  Parses basic device/browser info from
 * the User-Agent header without requiring an extra dependency.
 *
 * Usage:
 *   const activityLogger = require('./activityLogger');
 *   await activityLogger.log(req, { action: 'lead.created', resourceId: lead._id });
 */

const FGAActivity = require('../models/FGAActivity');

/**
 * Parse minimal device info from a User-Agent string.
 * Returns { browser, os, device }.
 */
function _parseUA(ua = '') {
  const browser = /Chrome\//.test(ua)   ? 'Chrome'
    : /Firefox\//.test(ua)  ? 'Firefox'
    : /Safari\//.test(ua)   ? 'Safari'
    : /Edge\//.test(ua)     ? 'Edge'
    : /MSIE|Trident/.test(ua) ? 'IE'
    : 'Other';

  const os = /Windows/.test(ua) ? 'Windows'
    : /Mac OS X/.test(ua)  ? 'macOS'
    : /Android/.test(ua)   ? 'Android'
    : /iPhone|iPad/.test(ua) ? 'iOS'
    : /Linux/.test(ua)     ? 'Linux'
    : 'Other';

  const device = /Mobile|Android|iPhone/.test(ua) ? 'mobile'
    : /iPad/.test(ua) ? 'tablet'
    : 'desktop';

  return { browser, os, device };
}

/**
 * Log a user activity.
 *
 * @param {Request} req            - Express request object (for IP, UA extraction)
 * @param {object}  opts
 * @param {string}    opts.action       - Verb describing what happened (e.g. 'lead.created')
 * @param {string}    [opts.resource]   - Resource type (e.g. 'lead', 'pro', 'job')
 * @param {string}    [opts.resourceId] - Mongoose _id or UUID of the resource
 * @param {string}    [opts.userId]     - Acting user's _id
 * @param {string}    [opts.userType]   - 'homeowner'|'professional'|'recruiter'|'admin'|'system'|'anonymous'
 * @param {string}    [opts.sessionId]  - Session identifier
 * @param {string}    [opts.status]     - 'success'|'failure'|'error'
 * @param {string}    [opts.errorMessage]
 * @param {object}    [opts.metadata]
 * @returns {Promise<FGAActivity|null>}
 */
async function log(req, opts = {}) {
  try {
    const ua  = (req && req.headers && req.headers['user-agent']) || '';
    const ip  = (req && (req.ip || (req.connection && req.connection.remoteAddress))) || '';
    const { browser, os, device } = _parseUA(ua);

    const entry = await FGAActivity.create({
      userId:       opts.userId     || null,
      userType:     opts.userType   || 'anonymous',
      sessionId:    opts.sessionId  || '',
      action:       opts.action,
      resource:     opts.resource   || '',
      resourceId:   opts.resourceId ? String(opts.resourceId) : '',
      ip,
      userAgent:    ua,
      browser,
      os,
      device,
      status:       opts.status       || 'success',
      errorMessage: opts.errorMessage || '',
      metadata:     opts.metadata     || {},
      timestamp:    new Date(),
    });

    return entry;
  } catch (err) {
    console.error('[FGA:ActivityLogger] ❌ log() error:', err.message);
    return null;
  }
}

/**
 * Log an activity from a system process (no request context).
 *
 * @param {object} opts  - Same opts as log() minus req
 */
async function logSystem(opts = {}) {
  return log(null, { ...opts, userType: opts.userType || 'system' });
}

module.exports = { log, logSystem };
