const { handleTwilioInboundWebhook } = require('../services/metaLeadAutomationService');

async function inboundSmsController(req, res) {
  try {
    await handleTwilioInboundWebhook(req.body || {}, req);
    return res.status(200).send('<Response></Response>');
  } catch (error) {
    return res.status(500).type('text/plain').send('inbound_webhook_error');
  }
}

module.exports = {
  inboundSmsController
};
