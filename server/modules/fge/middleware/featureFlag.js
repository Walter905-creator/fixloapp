/**
 * FGE Feature Flag Middleware
 *
 * Guards all FGE routes behind the FGE_ENABLED environment variable.
 * Set FGE_ENABLED=true to activate the Growth Engine.
 * When disabled, all FGE endpoints return 503 with a clear message.
 */

module.exports = function fgeFeatureFlag(req, res, next) {
  if (process.env.FGE_ENABLED !== 'true') {
    return res.status(503).json({
      ok: false,
      error: 'Fixlo Growth Engine is not enabled on this instance.',
      hint: 'Set FGE_ENABLED=true in server environment variables.',
    });
  }
  return next();
};
