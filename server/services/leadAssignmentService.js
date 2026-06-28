const mongoose = require('mongoose');
const JobRequest = require('../models/JobRequest');
const LeadAssignment = require('../models/LeadAssignment');
const Pro = require('../models/Pro');
const { calculateDistance } = require('./proMatching');
const { sendSms, sendWhatsAppMessage, isUSPhoneNumber } = require('../utils/twilio');

const DEFAULT_RADIUS_MILES = 30;
const PREMIUM_WINDOW_MS = 60 * 60 * 1000;

const PREMIUM_NEW_LEAD_MESSAGE = 'New Fixlo Premium lead: You have exclusive access for 1 hour. Reply or open your dashboard to accept.';
const REGULAR_NEW_LEAD_MESSAGE = 'New Fixlo lead available in your area. Open Fixlo to respond.';
const PREMIUM_EXPIRED_MESSAGE = 'Your exclusive Fixlo lead window has expired. The lead may be offered to another pro.';
const HOMEOWNER_ACCEPTED_MESSAGE = 'Good news. A Fixlo pro has accepted your request.';

const TRADE_ALIASES = {
  plumbing: 'plumbing',
  electrical: 'electrical',
  landscaping: 'landscaping',
  cleaning: 'cleaning',
  house_cleaning: 'cleaning',
  housecleaning: 'cleaning',
  junk_removal: 'junk_removal',
  junkremoval: 'junk_removal',
  handyman: 'handyman',
  general_repairs: 'handyman',
  hvac: 'hvac',
  painting: 'painting',
  roofing: 'roofing',
  flooring: 'flooring',
  carpentry: 'carpentry',
  appliance_repair: 'appliance_repair'
};

function normalizeTrade(trade) {
  const normalized = String(trade || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  return TRADE_ALIASES[normalized] || normalized;
}

function getLeadCoordinates(lead) {
  const coordinates = lead?.location?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return null;
  }

  const [longitude, latitude] = coordinates;
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }

  return { longitude, latitude };
}

function hasActiveSubscription(pro) {
  return Boolean(
    pro?.isActive &&
    pro?.subscriptionActive &&
    pro?.wantsNotifications &&
    !['paused', 'cancelled', 'inactive', 'past_due'].includes(pro.subscriptionStatus) &&
    pro.paymentStatus !== 'failed'
  );
}

function isPremiumPro(pro) {
  return pro?.subscriptionPlan === 'premium' || pro?.leadPriority === 'premium';
}

async function sendDirectLeadMessage(pro, message) {
  if (!pro?.phone) {
    return { success: false, reason: 'missing phone' };
  }

  try {
    if (pro.country === 'US' || isUSPhoneNumber(pro.phone)) {
      await sendSms(pro.phone, message);
    } else if (pro.whatsappOptIn) {
      await sendWhatsAppMessage(pro.phone, message);
    } else {
      await sendSms(pro.phone, message);
    }

    return { success: true };
  } catch (error) {
    console.error(`❌ Lead message failed for ${pro._id}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function getMatchingProsForLead(lead, maxDistanceMiles = DEFAULT_RADIUS_MILES) {
  const coords = getLeadCoordinates(lead);
  if (!coords) {
    return [];
  }

  const radiusMeters = maxDistanceMiles * 1609.34;
  const trade = normalizeTrade(lead.trade || lead.serviceType);

  const pros = await Pro.find({
    trade,
    location: {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [coords.longitude, coords.latitude]
        },
        $maxDistance: radiusMeters
      }
    }
  })
    .select('_id name phone email country whatsappOptIn smsConsent trade location avgRating rating completedJobs subscriptionPlan subscriptionPrice leadPriority subscriptionActive subscriptionStatus wantsNotifications paymentStatus isActive serviceRadiusMiles')
    .limit(100);

  return pros
    .filter(hasActiveSubscription)
    .map((pro) => {
      const [proLongitude, proLatitude] = pro.location?.coordinates || [];
      const distanceMiles = Number.isFinite(proLongitude) && Number.isFinite(proLatitude)
        ? calculateDistance(coords.latitude, coords.longitude, proLatitude, proLongitude)
        : DEFAULT_RADIUS_MILES;

      return { pro, distanceMiles };
    })
    .filter(({ pro, distanceMiles }) => distanceMiles <= Math.min(pro.serviceRadiusMiles || DEFAULT_RADIUS_MILES, DEFAULT_RADIUS_MILES))
    .sort((a, b) => {
      const aPremium = isPremiumPro(a.pro) ? 1 : 0;
      const bPremium = isPremiumPro(b.pro) ? 1 : 0;
      if (aPremium !== bPremium) return bPremium - aPremium;

      const aRating = a.pro.avgRating || a.pro.rating || 0;
      const bRating = b.pro.avgRating || b.pro.rating || 0;
      if (aRating !== bRating) return bRating - aRating;

      const aJobs = a.pro.completedJobs || 0;
      const bJobs = b.pro.completedJobs || 0;
      if (aJobs !== bJobs) return bJobs - aJobs;

      return a.distanceMiles - b.distanceMiles;
    });
}

async function getLeadAssignmentState(leadId) {
  const assignments = await LeadAssignment.find({ leadId }).sort({ assignedAt: 1 });

  return {
    assignments,
    acceptedAssignment: assignments.find((assignment) => assignment.status === 'accepted') || null,
    pendingPremiumAssignment: assignments.find(
      (assignment) =>
        assignment.assignmentType === 'premium_exclusive' &&
        assignment.status === 'pending' &&
        assignment.exclusiveUntil &&
        assignment.exclusiveUntil > new Date()
    ) || null,
    regularAssignments: assignments.filter((assignment) => assignment.assignmentType === 'regular_broadcast')
  };
}

async function updateLeadAssignmentStatus(leadId, status, currentLeadAssignmentId = null, exclusiveUntil = null) {
  await JobRequest.findByIdAndUpdate(leadId, {
    leadAssignmentStatus: status,
    currentLeadAssignmentId,
    exclusiveUntil
  });
}

async function markProAssignmentStatus(proId, status) {
  await Pro.findByIdAndUpdate(proId, { leadAssignmentStatus: status });
}

async function pickNextPremiumCandidate(lead, premiumCandidates, attemptedProIds = []) {
  for (const candidate of premiumCandidates) {
    if (attemptedProIds.includes(candidate.pro._id.toString())) {
      continue;
    }

    const hasActiveExclusiveLead = await LeadAssignment.exists({
      proId: candidate.pro._id,
      assignmentType: 'premium_exclusive',
      status: 'pending',
      exclusiveUntil: { $gt: new Date() }
    });

    if (!hasActiveExclusiveLead) {
      return candidate;
    }
  }

  return null;
}

async function assignPremiumLead(lead, premiumCandidate) {
  const assignedAt = new Date();
  const exclusiveUntil = new Date(assignedAt.getTime() + PREMIUM_WINDOW_MS);

  const assignment = await LeadAssignment.create({
    leadId: lead._id,
    proId: premiumCandidate.pro._id,
    assignmentType: 'premium_exclusive',
    status: 'pending',
    assignedAt,
    exclusiveUntil,
    distanceMiles: Math.round(premiumCandidate.distanceMiles * 10) / 10
  });

  await Promise.all([
    updateLeadAssignmentStatus(lead._id, 'assigned', assignment._id, exclusiveUntil),
    markProAssignmentStatus(premiumCandidate.pro._id, 'assigned'),
    sendDirectLeadMessage(premiumCandidate.pro, PREMIUM_NEW_LEAD_MESSAGE)
  ]);

  return assignment;
}

async function broadcastRegularLead(lead, regularCandidates) {
  if (!regularCandidates.length) {
    await updateLeadAssignmentStatus(lead._id, 'released', null, null);
    return { type: 'none', assignments: [] };
  }

  const assignments = await LeadAssignment.insertMany(
    regularCandidates.map(({ pro, distanceMiles }) => ({
      leadId: lead._id,
      proId: pro._id,
      assignmentType: 'regular_broadcast',
      status: 'pending',
      assignedAt: new Date(),
      distanceMiles: Math.round(distanceMiles * 10) / 10
    })),
    { ordered: false }
  ).catch(async (error) => {
    if (error?.writeErrors?.length) {
      return LeadAssignment.find({
        leadId: lead._id,
        assignmentType: 'regular_broadcast'
      });
    }

    throw error;
  });

  await updateLeadAssignmentStatus(lead._id, 'released', null, null);
  await Promise.all([
    ...regularCandidates.map(({ pro }) => markProAssignmentStatus(pro._id, 'released')),
    ...regularCandidates.map(({ pro }) => sendDirectLeadMessage(pro, REGULAR_NEW_LEAD_MESSAGE))
  ]);

  return { type: 'regular_broadcast', assignments };
}

async function routeLead(leadId) {
  if (mongoose.connection.readyState !== 1) {
    return { ok: false, skipped: true, reason: 'database not connected' };
  }

  const lead = await JobRequest.findById(leadId);
  if (!lead || lead.status !== 'pending') {
    return { ok: false, skipped: true, reason: 'lead unavailable' };
  }

  const state = await getLeadAssignmentState(lead._id);
  if (state.acceptedAssignment || state.pendingPremiumAssignment || state.regularAssignments.length) {
    return { ok: true, skipped: true, reason: 'lead already routed' };
  }

  const matchedPros = await getMatchingProsForLead(lead);
  const attemptedPremiumProIds = state.assignments
    .filter((assignment) => assignment.assignmentType === 'premium_exclusive')
    .map((assignment) => assignment.proId.toString());

  const premiumCandidates = matchedPros.filter(({ pro }) => isPremiumPro(pro));
  const regularCandidates = matchedPros.filter(({ pro }) => !isPremiumPro(pro));
  const nextPremium = await pickNextPremiumCandidate(lead, premiumCandidates, attemptedPremiumProIds);

  if (nextPremium) {
    const assignment = await assignPremiumLead(lead, nextPremium);
    return {
      ok: true,
      type: 'premium_exclusive',
      assignmentId: assignment._id,
      proId: assignment.proId,
      exclusiveUntil: assignment.exclusiveUntil
    };
  }

  const regularResult = await broadcastRegularLead(lead, regularCandidates);
  return {
    ok: true,
    type: regularResult.type,
    regularProsNotified: regularCandidates.length
  };
}

async function expirePremiumAssignment(assignment) {
  assignment.status = 'expired';
  assignment.respondedAt = new Date();
  await assignment.save();

  const pro = await Pro.findById(assignment.proId).select('_id phone country whatsappOptIn');
  if (pro) {
    await Promise.all([
      markProAssignmentStatus(pro._id, 'expired'),
      sendDirectLeadMessage(pro, PREMIUM_EXPIRED_MESSAGE)
    ]);
  }

  await updateLeadAssignmentStatus(assignment.leadId, 'expired', null, null);
}

async function processExpiredPremiumAssignments() {
  if (mongoose.connection.readyState !== 1) {
    return { processed: 0 };
  }

  const expiredAssignments = await LeadAssignment.find({
    assignmentType: 'premium_exclusive',
    status: 'pending',
    exclusiveUntil: { $lte: new Date() }
  });

  for (const assignment of expiredAssignments) {
    await expirePremiumAssignment(assignment);
    await routeLead(assignment.leadId);
  }

  return { processed: expiredAssignments.length };
}

async function releaseLeadToRegularPros(leadId) {
  const lead = await JobRequest.findById(leadId);
  if (!lead) {
    return { ok: false, reason: 'lead not found' };
  }

  const matchedPros = await getMatchingProsForLead(lead);
  const regularCandidates = matchedPros.filter(({ pro }) => !isPremiumPro(pro));
  return broadcastRegularLead(lead, regularCandidates);
}

async function acceptLead(leadId, proId) {
  await processExpiredPremiumAssignments();

  const lead = await JobRequest.findById(leadId);
  if (!lead) {
    return { ok: false, status: 404, error: 'Lead not found' };
  }

  const state = await getLeadAssignmentState(lead._id);
  if (state.acceptedAssignment) {
    return { ok: false, status: 409, error: 'Lead already accepted' };
  }

  const assignment = await LeadAssignment.findOne({
    leadId: lead._id,
    proId,
    status: 'pending',
    $or: [
      { assignmentType: 'regular_broadcast' },
      { assignmentType: 'premium_exclusive', exclusiveUntil: { $gt: new Date() } }
    ]
  });

  if (!assignment) {
    return { ok: false, status: 403, error: 'Lead is not available for this pro' };
  }

  assignment.status = 'accepted';
  assignment.respondedAt = new Date();
  await assignment.save();

  await LeadAssignment.updateMany(
    {
      leadId: lead._id,
      _id: { $ne: assignment._id },
      status: 'pending'
    },
    {
      status: 'released',
      respondedAt: new Date()
    }
  );

  await Promise.all([
    JobRequest.findByIdAndUpdate(lead._id, {
      status: 'assigned',
      assignedTo: proId,
      assignedProId: proId,
      assignedAt: new Date(),
      leadAssignmentStatus: 'accepted',
      currentLeadAssignmentId: assignment._id,
      exclusiveUntil: null
    }),
    markProAssignmentStatus(proId, 'accepted')
  ]);

  if (lead.phone) {
    try {
      await sendSms(lead.phone, HOMEOWNER_ACCEPTED_MESSAGE);
    } catch (error) {
      console.error(`❌ Homeowner acceptance SMS failed for lead ${lead._id}:`, error.message);
    }
  }

  return { ok: true, assignment };
}

async function declineLead(leadId, proId) {
  const assignment = await LeadAssignment.findOne({
    leadId,
    proId,
    status: 'pending'
  });

  if (!assignment) {
    return { ok: false, status: 404, error: 'Assignment not found' };
  }

  assignment.status = 'declined';
  assignment.respondedAt = new Date();
  await assignment.save();
  await markProAssignmentStatus(proId, 'available');

  if (assignment.assignmentType === 'premium_exclusive') {
    await updateLeadAssignmentStatus(leadId, 'expired', null, null);
    await routeLead(leadId);
  }

  return { ok: true, assignment };
}

module.exports = {
  DEFAULT_RADIUS_MILES,
  normalizeTrade,
  routeLead,
  acceptLead,
  declineLead,
  releaseLeadToRegularPros,
  processExpiredPremiumAssignments,
  REGULAR_NEW_LEAD_MESSAGE
};
