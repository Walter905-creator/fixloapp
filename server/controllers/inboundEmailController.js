const { handleSendGridInboundWebhook } = require('../services/metaLeadAutomationService');

async function inboundEmailController(req, res) {
  try {
    const payload = { ...(req.body || {}), headers: req.headers };
    await handleSendGridInboundWebhook(payload, req);
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}

module.exports = {
  inboundEmailController
};
