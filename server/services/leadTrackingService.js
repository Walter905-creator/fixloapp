const crypto = require('crypto');
const mongoose = require('mongoose');
const LeadAssignment = require('../models/LeadAssignment');
const LeadAccess = require('../models/LeadAccess');
const LeadEvent = require('../models/LeadEvent');
const SmsNotification = require('../models/SmsNotification');
const Pro = require('../models/Pro');
const JobRequest = require('../models/JobRequest');
const { sendSms, sendWhatsAppMessage, isUSPhoneNumber } = require('../utils/twilio');
const countryDetection = require('../utils/countryDetection');

const DEFAULT_LINK_TTL_MS = 24 * 60 * 60 * 1000;

function getClientUrl() {
  return (process.env.CLIENT_URL || 'https://fixloapp.com').replace(/\/+$/, '');
}

function getApiBaseUrl() {
  return (
    process.env.API_URL ||
    process.env.SERVER_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    'http://localhost:3001'
  ).replace(/\/+$/, '');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(18).toString('base64url');
}

function getClientIp(req) {
  const ip = req?.headers?.['x-forwarded-for']?.split(',')?.[0]?.trim()
    || req?.headers?.['x-real-ip']
    || req?.socket?.remoteAddress
    || req?.ip
    || '';

  return String(ip).replace(/^::ffff:/, '');
}

function parseUserAgent(userAgent = '') {
  const ua = String(userAgent || '');
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const browserName = /Edg\//.test(ua)
    ? 'Edge'
    : /Chrome\//.test(ua)
      ? 'Chrome'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Safari\//.test(ua) && !/Chrome\//.test(ua)
          ? 'Safari'
          : 'Unknown';

  const platform = /Android/i.test(ua)
    ? 'Android'
    : /iPhone|iPad|iOS/i.test(ua)
      ? 'iOS'
      : /Windows/i.test(ua)
        ? 'Windows'
        : /Mac OS X|Macintosh/i.test(ua)
          ? 'macOS'
          : /Linux/i.test(ua)
            ? 'Linux'
            : 'Unknown';

  return {
    browserName,
    platform,
    deviceType: isMobile ? 'mobile' : 'desktop'
  };
}

function formatDistance(distanceMiles) {
  if (!Number.isFinite(distanceMiles)) return 'Within 30 miles';
  return `${Math.round(distanceMiles * 10) / 10} miles`;
}

function formatBudget(lead) {
  if (typeof lead?.budget === 'string' && lead.budget.trim()) {
    return lead.budget.trim();
  }

  const total = lead?.totalCost || lead?.laborCost || lead?.visitFee;
  if (Number.isFinite(total) && total > 0) {
    if (total < 250) return 'Under $250';
    if (total < 500) return '$250-$500';
    if (total < 1000) return '$500-$1,000';
    return '$1,000+';
  }

  return 'Contact for details';
}

function getRequestedTime(lead) {
  return lead?.preferredTime || lead?.urgency || 'Flexible';
}

function getLeadPreview(lead, assignment = null) {
  return {
    id: String(lead._id),
    service: lead.trade || lead.serviceType || 'Service Request',
    city: lead.city || '',
    state: lead.state || '',
    description: lead.description || '',
    estimatedBudget: formatBudget(lead),
    distance: Number.isFinite(assignment?.distanceMiles)
      ? Math.round(assignment.distanceMiles * 10) / 10
      : null,
    distanceLabel: formatDistance(assignment?.distanceMiles),
    requestedTime: getRequestedTime(lead),
    createdAt: lead.createdAt,
    expiresAt: assignment?.exclusiveUntil || null
  };
}

async function detectRequestLocation(req) {
  try {
    const ip = countryDetection.extractIP(req);
    if (!ip || ip === '0.0.0.0') {
      return { city: '', region: '', countryCode: '' };
    }

    const location = await countryDetection.detectCountry(ip);
    return {
      city: location?.city || '',
      region: location?.region || '',
      countryCode: location?.countryCode || ''
    };
  } catch {
    return { city: '', region: '', countryCode: '' };
  }
}

async function recordLeadEvent({
  leadId,
  proId = null,
  assignmentId = null,
  accessId = null,
  eventType,
  actorType = 'system',
  req = null,
  metadata = {}
}) {
  try {
    return await LeadEvent.create({
      leadId,
      proId,
      assignmentId,
      accessId,
      eventType,
      actorType,
      timestamp: new Date(),
      ipAddress: req ? getClientIp(req) : undefined,
      userAgent: req?.headers?.['user-agent'] || undefined,
      metadata
    });
  } catch (error) {
    console.error(`❌ Failed to record lead event (${eventType}):`, error.message);
    return null;
  }
}

async function ensureLeadCreatedEvent(lead) {
  if (!lead?._id) {
    return null;
  }

  const existing = await LeadEvent.findOne({
    leadId: lead._id,
    eventType: 'lead_created'
  }).lean();

  if (existing) {
    return existing;
  }

  return recordLeadEvent({
    leadId: lead._id,
    eventType: 'lead_created',
    metadata: {
      service: lead.trade,
      city: lead.city,
      state: lead.state,
      source: lead.source || 'website'
    }
  });
}

async function invalidateActiveAccessRecords(assignmentId, excludeId = null) {
  const query = {
    assignmentId,
    status: { $in: ['active', 'asked_later'] }
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  await LeadAccess.updateMany(query, {
    status: 'invalidated',
    invalidatedAt: new Date()
  });
}

async function createLeadAccessRecord({ assignment, lead, pro }) {
  const expiresAt = assignment.exclusiveUntil
    ? new Date(assignment.exclusiveUntil)
    : new Date(Date.now() + DEFAULT_LINK_TTL_MS);

  await invalidateActiveAccessRecords(assignment._id);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const rawToken = generateToken();

    try {
      const access = await LeadAccess.create({
        leadId: lead._id,
        proId: pro._id,
        assignmentId: assignment._id,
        tokenHash: hashToken(rawToken),
        expiresAt
      });

      await LeadAssignment.findByIdAndUpdate(assignment._id, {
        secureAccessId: access._id
      });

      return {
        access,
        rawToken,
        url: `${getClientUrl()}/lead/${rawToken}`
      };
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }
    }
  }

  throw new Error('Unable to generate secure lead token');
}

function buildSecureLeadSms({ lead, assignment, url }) {
  return [
    `🔔 New ${lead.trade || 'Service'} Lead`,
    '',
    'Location:',
    [lead.city, lead.state].filter(Boolean).join(', ') || 'Location provided',
    '',
    'Distance:',
    formatDistance(assignment.distanceMiles),
    '',
    'Estimated Budget:',
    formatBudget(lead),
    '',
    'Tap below to view this lead.',
    '',
    url
  ].join('\n');
}

async function notifyProWithSecureLead({ lead, pro, assignment = null, assignmentType = 'regular_broadcast' }) {
  if (!lead?._id || !pro?._id) {
    return { success: false, reason: 'Missing lead or pro data' };
  }

  let activeAssignment = assignment;

  if (!activeAssignment) {
    activeAssignment = await LeadAssignment.findOneAndUpdate(
      {
        leadId: lead._id,
        proId: pro._id,
        assignmentType
      },
      {
        $setOnInsert: {
          status: 'pending',
          assignedAt: new Date(),
          distanceMiles: null
        }
      },
      {
        new: true,
        upsert: true
      }
    );
  }

  const { access, url } = await createLeadAccessRecord({
    assignment: activeAssignment,
    lead,
    pro
  });

  const isUSPro = pro.country === 'US' || isUSPhoneNumber(pro.phone);
  const callbackUrl = `${getApiBaseUrl()}/api/lead-access/twilio/status`;
  const body = buildSecureLeadSms({ lead, assignment: activeAssignment, url });

  try {
    const result = isUSPro
      ? await sendSms(pro.phone, body, { statusCallback: callbackUrl })
      : await sendWhatsAppMessage(pro.phone, body, { statusCallback: callbackUrl });

    const notification = await SmsNotification.recordNotification({
      notificationType: 'pro',
      leadId: lead._id,
      userId: pro._id,
      userModel: 'Pro',
      phoneNumberMasked: SmsNotification.maskPhoneNumber(pro.phone),
      status: 'sent',
      twilioSid: result.sid,
      twilioStatus: result.status,
      assignmentId: activeAssignment._id,
      accessId: access._id
    });

    const sentAt = new Date();

    await Promise.all([
      LeadAccess.findByIdAndUpdate(access._id, {
        channel: isUSPro ? 'sms' : 'whatsapp',
        twilioSid: result.sid,
        smsNotificationId: notification?._id || null,
        smsSentAt: sentAt
      }),
      LeadAssignment.findByIdAndUpdate(activeAssignment._id, {
        smsSentAt: sentAt
      }),
      recordLeadEvent({
        leadId: lead._id,
        proId: pro._id,
        assignmentId: activeAssignment._id,
        accessId: access._id,
        eventType: 'sms_sent',
        metadata: {
          channel: isUSPro ? 'sms' : 'whatsapp',
          twilioSid: result.sid
        }
      })
    ]);

    return {
      success: true,
      assignment: activeAssignment,
      accessId: access._id,
      url,
      messageId: result.sid,
      channel: isUSPro ? 'sms' : 'whatsapp'
    };
  } catch (error) {
    await SmsNotification.recordNotification({
      notificationType: 'pro',
      leadId: lead._id,
      userId: pro._id,
      userModel: 'Pro',
      phoneNumberMasked: SmsNotification.maskPhoneNumber(pro.phone),
      status: 'failed',
      errorCode: error.code || 'SEND_ERROR',
      errorMessage: error.message,
      assignmentId: activeAssignment._id,
      accessId: access._id
    }).catch(() => null);

    console.error(`❌ Secure lead message failed for ${pro._id}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function resolveLeadAccessByToken(token) {
  if (!token) return null;

  return LeadAccess.findOne({ tokenHash: hashToken(token) })
    .populate('leadId')
    .populate('proId', 'name businessName phone email')
    .populate('assignmentId');
}

async function expireAccessRecord(access, reason = 'expired') {
  if (!access || ['accepted', 'declined', 'expired', 'invalidated'].includes(access.status)) {
    return access;
  }

  access.status = 'expired';
  access.invalidatedAt = new Date();
  await access.save();

  await recordLeadEvent({
    leadId: access.leadId,
    proId: access.proId,
    assignmentId: access.assignmentId,
    accessId: access._id,
    eventType: 'expired',
    metadata: { reason }
  });

  await LeadAssignment.findByIdAndUpdate(access.assignmentId, {
    status: 'expired'
  });

  return access;
}

async function recordLeadAccessOpen(access, req) {
  if (!access?.leadId || !access?.assignmentId) {
    return access;
  }

  if (access.expiresAt && access.expiresAt <= new Date()) {
    return expireAccessRecord(access, 'token_expired');
  }

  const now = new Date();
  const location = await detectRequestLocation(req);
  const agent = parseUserAgent(req?.headers?.['user-agent']);

  const firstOpen = !access.firstOpenedAt;
  const updates = {
    lastOpenedAt: now,
    viewedAt: now,
    ipAddress: getClientIp(req),
    userAgent: req?.headers?.['user-agent'] || '',
    browserName: agent.browserName,
    deviceType: agent.deviceType,
    platform: agent.platform,
    city: location.city,
    region: location.region,
    countryCode: location.countryCode,
    openedCount: (access.openedCount || 0) + 1
  };

  if (firstOpen) {
    updates.firstOpenedAt = now;
    if (access.smsSentAt) {
      updates.openTimeMs = now.getTime() - new Date(access.smsSentAt).getTime();
    }
  }

  const updatedAccess = await LeadAccess.findByIdAndUpdate(
    access._id,
    updates,
    { new: true }
  );

  const assignmentUpdates = {
    lastViewedAt: now,
    openedCount: updates.openedCount
  };

  if (firstOpen) {
    assignmentUpdates.firstOpenedAt = now;
    assignmentUpdates.openTimeMs = updates.openTimeMs || null;
  }

  await LeadAssignment.findByIdAndUpdate(access.assignmentId._id || access.assignmentId, assignmentUpdates);

  await recordLeadEvent({
    leadId: access.leadId._id || access.leadId,
    proId: access.proId._id || access.proId,
    assignmentId: access.assignmentId._id || access.assignmentId,
    accessId: access._id,
    eventType: 'link_opened',
    actorType: 'pro',
    req,
    metadata: {
      openCount: updates.openedCount,
      responseTimeMs: updates.openTimeMs || null
    }
  });

  await recordLeadEvent({
    leadId: access.leadId._id || access.leadId,
    proId: access.proId._id || access.proId,
    assignmentId: access.assignmentId._id || access.assignmentId,
    accessId: access._id,
    eventType: 'lead_viewed',
    actorType: 'pro',
    req,
    metadata: {
      openCount: updates.openedCount
    }
  });

  return updatedAccess;
}

async function markLeadAccepted({ assignment, req = null }) {
  if (!assignment?._id) return null;

  const acceptedAt = assignment.acceptedAt || assignment.respondedAt || new Date();
  const leadId = assignment.leadId._id || assignment.leadId;
  const proId = assignment.proId._id || assignment.proId;
  const access = await LeadAccess.findOne({
    assignmentId: assignment._id,
    status: { $in: ['active', 'asked_later', 'accepted'] }
  }).sort({ createdAt: -1 });

  const acceptedCount = await LeadAssignment.countDocuments({
    leadId,
    status: 'accepted'
  });

  const acceptanceOrder = Math.max(acceptedCount, 1);
  const firstAcceptedProfessional = acceptanceOrder === 1;
  const acceptanceDelayMs = assignment.assignedAt
    ? acceptedAt.getTime() - new Date(assignment.assignedAt).getTime()
    : null;

  if (access) {
    const location = req ? await detectRequestLocation(req) : { city: '', region: '', countryCode: '' };
    const agent = parseUserAgent(req?.headers?.['user-agent']);

    await LeadAccess.findByIdAndUpdate(access._id, {
      status: 'accepted',
      acceptedAt,
      ipAddress: req ? getClientIp(req) : access.ipAddress,
      userAgent: req?.headers?.['user-agent'] || access.userAgent,
      browserName: agent.browserName || access.browserName,
      deviceType: agent.deviceType || access.deviceType,
      platform: agent.platform || access.platform,
      city: location.city || access.city,
      region: location.region || access.region,
      countryCode: location.countryCode || access.countryCode,
      responseTimeMs: acceptanceDelayMs,
      acceptanceDelayMs,
      acceptanceOrder,
      firstAcceptedProfessional
    });
  }

  await invalidateOtherLeadAccesses(leadId, assignment._id);

  await recordLeadEvent({
    leadId,
    proId,
    assignmentId: assignment._id,
    accessId: access?._id || null,
    eventType: 'accepted',
    actorType: 'pro',
    req,
    metadata: {
      acceptanceDelayMs,
      acceptanceOrder,
      firstAcceptedProfessional
    }
  });

  await refreshProPerformanceScore(proId);
  return { acceptanceOrder, firstAcceptedProfessional, acceptanceDelayMs };
}

async function markLeadDeclined({ assignment, req = null, reason = '' }) {
  if (!assignment?._id) return null;

  const leadId = assignment.leadId?._id || assignment.leadId;
  const proId = assignment.proId?._id || assignment.proId;
  const declinedAt = assignment.declinedAt || assignment.respondedAt || new Date();

  const access = await LeadAccess.findOne({
    assignmentId: assignment._id,
    status: { $in: ['active', 'asked_later', 'declined'] }
  }).sort({ createdAt: -1 });

  if (access) {
    await LeadAccess.findByIdAndUpdate(access._id, {
      status: 'declined',
      declinedAt,
      declinedReason: reason || access.declinedReason || ''
    });
  }

  await recordLeadEvent({
    leadId,
    proId,
    assignmentId: assignment._id,
    accessId: access?._id || null,
    eventType: 'declined',
    actorType: 'pro',
    req,
    metadata: {
      reason: reason || null
    }
  });

  await refreshProPerformanceScore(proId);
  return access;
}

async function markAskLater(access, req = null) {
  if (!access?._id || access.status !== 'active') {
    return access;
  }

  const now = new Date();
  await LeadAccess.findByIdAndUpdate(access._id, {
    status: 'asked_later',
    askedLaterAt: now
  });

  await LeadAssignment.findByIdAndUpdate(access.assignmentId._id || access.assignmentId, {
    askedLaterAt: now
  });

  await recordLeadEvent({
    leadId: access.leadId._id || access.leadId,
    proId: access.proId._id || access.proId,
    assignmentId: access.assignmentId._id || access.assignmentId,
    accessId: access._id,
    eventType: 'ask_later',
    actorType: 'pro',
    req
  });

  await refreshProPerformanceScore(access.proId._id || access.proId);
  return LeadAccess.findById(access._id);
}

async function invalidateOtherLeadAccesses(leadId, acceptedAssignmentId) {
  const otherAssignments = await LeadAssignment.find({
    leadId,
    _id: { $ne: acceptedAssignmentId }
  }).select('_id');

  const assignmentIds = otherAssignments.map((item) => item._id);
  if (!assignmentIds.length) return;

  await LeadAccess.updateMany(
    {
      assignmentId: { $in: assignmentIds },
      status: { $in: ['active', 'asked_later'] }
    },
    {
      status: 'invalidated',
      invalidatedAt: new Date()
    }
  );
}

async function handleTwilioDeliveryStatus({ messageSid, messageStatus }) {
  if (!messageSid || !messageStatus) {
    return null;
  }

  const notification = await SmsNotification.findOneAndUpdate(
    { twilioSid: messageSid },
    {
      twilioStatus: messageStatus,
      status: messageStatus === 'delivered' ? 'delivered' : undefined,
      deliveredAt: messageStatus === 'delivered' ? new Date() : undefined
    },
    { new: true }
  );

  const access = await LeadAccess.findOne({ twilioSid: messageSid });
  if (!access) {
    return notification;
  }

  if (messageStatus === 'delivered') {
    const deliveredAt = new Date();
    await Promise.all([
      LeadAccess.findByIdAndUpdate(access._id, { smsDeliveredAt: deliveredAt }),
      LeadAssignment.findByIdAndUpdate(access.assignmentId, { smsDeliveredAt: deliveredAt }),
      recordLeadEvent({
        leadId: access.leadId,
        proId: access.proId,
        assignmentId: access.assignmentId,
        accessId: access._id,
        eventType: 'sms_delivered',
        actorType: 'twilio',
        metadata: { twilioSid: messageSid, messageStatus }
      })
    ]);
  }

  return notification;
}

async function buildLeadAccessPayload(access, req = null) {
  if (!access) {
    return {
      available: false,
      message: 'This lead is no longer available.'
    };
  }

  const lead = access.leadId;
  const assignment = access.assignmentId;

  if (!lead || !assignment) {
    return {
      available: false,
      message: 'This lead is no longer available.'
    };
  }

  if (access.expiresAt && access.expiresAt <= new Date() && access.status !== 'accepted') {
    await expireAccessRecord(access, 'token_expired');
    return {
      available: false,
      message: 'This lead is no longer available.'
    };
  }

  if (['expired', 'invalidated', 'declined'].includes(access.status) || ['expired', 'released', 'declined'].includes(assignment.status)) {
    return {
      available: false,
      message: 'This lead is no longer available.'
    };
  }

  const updatedAccess = await recordLeadAccessOpen(access, req);
  const homeownerUnlocked = updatedAccess.status === 'accepted' || assignment.status === 'accepted';

  return {
    available: true,
    status: updatedAccess.status,
    lead: {
      ...getLeadPreview(lead, assignment),
      homeowner: homeownerUnlocked
        ? {
            name: lead.name || '',
            phone: lead.phone || '',
            email: lead.email || '',
            address: lead.address || ''
          }
        : null
    },
    professional: {
      id: String(access.proId._id || access.proId),
      name: access.proId?.businessName || access.proId?.name || ''
    },
    tracking: {
      openedAt: updatedAccess.firstOpenedAt,
      acceptedAt: updatedAccess.acceptedAt,
      expiresAt: updatedAccess.expiresAt,
      openCount: updatedAccess.openedCount
    }
  };
}

function calculatePerformanceScore(metrics) {
  const openRate = Math.min(metrics.openRate || 0, 100);
  const acceptanceRate = Math.min(metrics.acceptanceRate || 0, 100);
  const completionRate = Math.min(metrics.completionRate || 0, 100);
  const reliability = Math.min(metrics.reliability || 0, 100);
  const ratingScore = Math.min(((metrics.rating || 0) / 5) * 100, 100);
  const responseScore = metrics.averageResponseTimeMs == null
    ? 0
    : Math.max(0, 100 - Math.min(metrics.averageResponseTimeMs / (60 * 1000), 100));

  return Math.round(
    (responseScore * 0.25)
    + (acceptanceRate * 0.25)
    + (completionRate * 0.2)
    + (ratingScore * 0.15)
    + (reliability * 0.15)
  );
}

async function getProLeadMetrics(proId) {
  const normalizedProId = typeof proId === 'string' ? new mongoose.Types.ObjectId(proId) : proId;
  const [aggregate] = await LeadAssignment.aggregate([
    { $match: { proId: normalizedProId } },
    {
      $group: {
        _id: '$proId',
        leadsReceived: { $sum: 1 },
        leadsViewed: {
          $sum: {
            $cond: [{ $gt: ['$openedCount', 0] }, 1, 0]
          }
        },
        accepted: {
          $sum: {
            $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0]
          }
        },
        declined: {
          $sum: {
            $cond: [{ $eq: ['$status', 'declined'] }, 1, 0]
          }
        },
        avgOpenTimeMs: { $avg: '$openTimeMs' },
        avgAcceptTimeMs: { $avg: '$acceptanceDelayMs' },
        avgResponseTimeMs: { $avg: '$responseTimeMs' }
      }
    }
  ]);

  const acceptedLeadIds = await LeadAssignment.find({
    proId: normalizedProId,
    status: 'accepted'
  }).distinct('leadId');

  const completed = acceptedLeadIds.length
    ? await JobRequest.countDocuments({
        _id: { $in: acceptedLeadIds },
        status: 'completed',
        assignedProId: normalizedProId
      })
    : 0;

  const leadsReceived = aggregate?.leadsReceived || 0;
  const accepted = aggregate?.accepted || 0;
  const declined = aggregate?.declined || 0;
  const leadsViewed = aggregate?.leadsViewed || 0;
  const openRate = leadsReceived ? (leadsViewed / leadsReceived) * 100 : 0;
  const acceptanceRate = leadsReceived ? (accepted / leadsReceived) * 100 : 0;
  const declineRate = leadsReceived ? (declined / leadsReceived) * 100 : 0;
  const completionRate = accepted ? (completed / accepted) * 100 : 0;
  const reliability = leadsReceived ? ((accepted + leadsViewed) / (leadsReceived * 2)) * 100 : 0;

  const pro = await Pro.findById(normalizedProId).select('avgRating rating');
  const rating = pro?.avgRating || pro?.rating || 0;

  const metrics = {
    leadsReceived,
    leadsViewed,
    accepted,
    declined,
    completed,
    averageOpenTimeMs: aggregate?.avgOpenTimeMs || null,
    averageAcceptTimeMs: aggregate?.avgAcceptTimeMs || null,
    averageResponseTimeMs: aggregate?.avgResponseTimeMs || null,
    openRate: Number(openRate.toFixed(2)),
    acceptanceRate: Number(acceptanceRate.toFixed(2)),
    declineRate: Number(declineRate.toFixed(2)),
    completionRate: Number(completionRate.toFixed(2)),
    reliability: Number(reliability.toFixed(2)),
    rating
  };

  metrics.performanceScore = calculatePerformanceScore(metrics);
  return metrics;
}

async function refreshProPerformanceScore(proId) {
  const metrics = await getProLeadMetrics(proId);
  await Pro.findByIdAndUpdate(proId, {
    performanceScore: metrics.performanceScore
  });
  return metrics;
}

async function getOwnerLeadAnalytics(limit = 5) {
  const [leadCounts, openStats, acceptStats, pros] = await Promise.all([
    JobRequest.countDocuments(),
    LeadAssignment.aggregate([
      {
        $group: {
          _id: null,
          viewed: {
            $sum: {
              $cond: [{ $gt: ['$openedCount', 0] }, 1, 0]
            }
          },
          expired: {
            $sum: {
              $cond: [{ $eq: ['$status', 'expired'] }, 1, 0]
            }
          },
          avgOpenTimeMs: { $avg: '$openTimeMs' },
          avgAcceptTimeMs: { $avg: '$acceptanceDelayMs' }
        }
      }
    ]),
    LeadAssignment.countDocuments({ status: 'accepted' }),
    Pro.find().select('name businessName performanceScore avgRating rating').limit(500).lean()
  ]);

  const proMetrics = await Promise.all(
    pros.map(async (pro) => ({
      pro,
      metrics: await getProLeadMetrics(pro._id)
    }))
  );

  const sortBy = (field, direction = 'desc') => [...proMetrics]
    .sort((a, b) => direction === 'desc'
      ? (b.metrics[field] || 0) - (a.metrics[field] || 0)
      : (a.metrics[field] || 0) - (b.metrics[field] || 0))
    .slice(0, limit)
    .map(({ pro, metrics }) => ({
      proId: String(pro._id),
      name: pro.businessName || pro.name || 'Unknown pro',
      value: metrics[field] || 0,
      performanceScore: metrics.performanceScore || pro.performanceScore || 0
    }));

  const summary = openStats[0] || {};

  return {
    totalLeads: leadCounts,
    viewed: summary.viewed || 0,
    accepted: acceptStats || 0,
    expired: summary.expired || 0,
    averageOpenTimeMs: summary.avgOpenTimeMs || null,
    averageAcceptanceTimeMs: summary.avgAcceptTimeMs || null,
    topFastestResponders: sortBy('averageResponseTimeMs', 'asc'),
    topConversionRate: sortBy('acceptanceRate', 'desc'),
    topCompletionRate: sortBy('completionRate', 'desc'),
    slowestResponders: sortBy('averageResponseTimeMs', 'desc')
  };
}

module.exports = {
  ensureLeadCreatedEvent,
  recordLeadEvent,
  notifyProWithSecureLead,
  resolveLeadAccessByToken,
  buildLeadAccessPayload,
  markLeadAccepted,
  markLeadDeclined,
  markAskLater,
  expireAccessRecord,
  handleTwilioDeliveryStatus,
  invalidateOtherLeadAccesses,
  refreshProPerformanceScore,
  getProLeadMetrics,
  getOwnerLeadAnalytics,
  getClientIp,
  parseUserAgent
};
