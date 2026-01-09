/**
 * Social Manager Models Index
 * Central export for all social manager database models
 */

const SocialAccount = require('./SocialAccount');
const EncryptedToken = require('./EncryptedToken');
const ScheduledPost = require('./ScheduledPost');
const PostMetric = require('./PostMetric');
const SocialAuditLog = require('./SocialAuditLog');

module.exports = {
  SocialAccount,
  EncryptedToken,
  ScheduledPost,
  PostMetric,
  SocialAuditLog
};
