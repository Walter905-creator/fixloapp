/**
 * OAuth Handlers Index
 * Central export for all platform OAuth handlers
 */

const metaHandler = require('./metaHandler');
const tiktokHandler = require('./tiktokHandler');
const xHandler = require('./xHandler');
const linkedinHandler = require('./linkedinHandler');

// Handler registry
const handlers = {
  meta_instagram: metaHandler,
  meta_facebook: metaHandler,
  tiktok: tiktokHandler,
  x: xHandler,
  linkedin: linkedinHandler
};

/**
 * Get OAuth handler for a platform
 * @param {string} platform - Platform name
 * @returns {Object} - OAuth handler instance
 */
function getHandler(platform) {
  const handler = handlers[platform];
  if (!handler) {
    throw new Error(`Unsupported platform: ${platform}`);
  }
  return handler;
}

/**
 * Check if a platform is configured
 * @param {string} platform - Platform name
 * @returns {boolean}
 */
function isPlatformConfigured(platform) {
  try {
    const handler = getHandler(platform);
    return handler.isConfigured();
  } catch {
    return false;
  }
}

/**
 * Get list of all configured platforms
 * @returns {Array<string>} - Array of configured platform names
 */
function getConfiguredPlatforms() {
  return Object.keys(handlers).filter(platform => {
    try {
      return handlers[platform].isConfigured();
    } catch {
      return false;
    }
  });
}

module.exports = {
  metaHandler,
  tiktokHandler,
  xHandler,
  linkedinHandler,
  getHandler,
  isPlatformConfigured,
  getConfiguredPlatforms
};
