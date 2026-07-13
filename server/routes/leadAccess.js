const express = require('express');
const router = express.Router();
const { MAX_DECLINE_REASON_LENGTH } = require('../constants/leadTracking');
const {
  resolveLeadAccessByToken,
  buildLeadAccessPayload,
  markAskLater,
  handleTwilioDeliveryStatus,
  recordLeadEvent
} = require('../services/leadTrackingService');
const { acceptLead, declineLead } = require('../services/leadAssignmentService');

router.post('/twilio/status', express.urlencoded({ extended: false }), async (req, res) => {
  try {
    await handleTwilioDeliveryStatus({
      messageSid: req.body.MessageSid,
      messageStatus: req.body.MessageStatus
    });

    res.status(204).end();
  } catch (error) {
    console.error('❌ Twilio lead status callback failed:', error.message);
    res.status(500).end();
  }
});

router.get('/:token', async (req, res) => {
  try {
    const access = await resolveLeadAccessByToken(req.params.token);
    const payload = await buildLeadAccessPayload(access, req);

    if (!payload.available) {
      return res.status(410).json(payload);
    }

    return res.json(payload);
  } catch (error) {
    console.error('❌ Failed to fetch secure lead:', error.message);
    return res.status(500).json({
      available: false,
      message: 'Unable to load this lead right now.'
    });
  }
});

router.post('/:token/accept', async (req, res) => {
  try {
    const access = await resolveLeadAccessByToken(req.params.token);
    if (!access) {
      return res.status(404).json({ ok: false, message: 'Lead link not found.' });
    }

    const result = await acceptLead(access.leadId._id, access.proId._id);
    if (!result.ok) {
      return res.status(result.status || 409).json({ ok: false, message: result.error });
    }

    const payload = await buildLeadAccessPayload(await resolveLeadAccessByToken(req.params.token), req);
    return res.json({ ok: true, ...payload });
  } catch (error) {
    console.error('❌ Accept secure lead failed:', error.message);
    return res.status(500).json({ ok: false, message: 'Unable to accept this lead right now.' });
  }
});

router.post('/:token/decline', async (req, res) => {
  try {
    const access = await resolveLeadAccessByToken(req.params.token);
    if (!access) {
      return res.status(404).json({ ok: false, message: 'Lead link not found.' });
    }

    const reason = String(req.body?.reason || '').trim();
    if (reason.length > MAX_DECLINE_REASON_LENGTH) {
      return res.status(400).json({ ok: false, message: `Decline reason must be ${MAX_DECLINE_REASON_LENGTH} characters or less.` });
    }
    const result = await declineLead(access.leadId._id, access.proId._id, reason);
    if (!result.ok) {
      return res.status(result.status || 409).json({ ok: false, message: result.error });
    }

    return res.json({
      ok: true,
      available: false,
      message: 'You declined this lead.'
    });
  } catch (error) {
    console.error('❌ Decline secure lead failed:', error.message);
    return res.status(500).json({ ok: false, message: 'Unable to decline this lead right now.' });
  }
});

router.post('/:token/ask-later', async (req, res) => {
  try {
    const access = await resolveLeadAccessByToken(req.params.token);
    if (!access) {
      return res.status(404).json({ ok: false, message: 'Lead link not found.' });
    }

    await markAskLater(access, req);
    const payload = await buildLeadAccessPayload(await resolveLeadAccessByToken(req.params.token), req);
    return res.json({ ok: true, ...payload });
  } catch (error) {
    console.error('❌ Ask later failed:', error.message);
    return res.status(500).json({ ok: false, message: 'Unable to save your response right now.' });
  }
});

router.post('/:token/contacted', async (req, res) => {
  try {
    const access = await resolveLeadAccessByToken(req.params.token);
    if (!access) {
      return res.status(404).json({ ok: false, message: 'Lead link not found.' });
    }

    if (access.status !== 'accepted' && access.assignmentId?.status !== 'accepted') {
      return res.status(409).json({ ok: false, message: 'Accept the lead before marking it contacted.' });
    }

    await recordLeadEvent({
      leadId: access.leadId._id,
      proId: access.proId._id,
      assignmentId: access.assignmentId._id,
      accessId: access._id,
      eventType: 'homeowner_contacted',
      actorType: 'pro',
      req
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error('❌ Contacted event failed:', error.message);
    return res.status(500).json({ ok: false, message: 'Unable to save that action right now.' });
  }
});

module.exports = router;
