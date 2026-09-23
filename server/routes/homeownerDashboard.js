const express = require('express');
const jwt = require('jsonwebtoken');
const Homeowner = require('../models/Homeowner');
const JobRequest = require('../models/JobRequest');
const Notification = require('../models/Notification');
const Appointment = require('../models/Appointment');
const Document = require('../models/Document');
const ProjectTimeline = require('../models/ProjectTimeline');
const { requireDatabase } = require('../config/database');

const router = express.Router();

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
}

function clientBaseUrl() {
  return process.env.CLIENT_URL || process.env.YOUR_DOMAIN || 'https://www.fixloapp.com';
}

async function getOwnedJob(homeowner, jobId) {
  const ownership = [];
  if (homeowner.email) ownership.push({ email: homeowner.email.toLowerCase() });
  if (homeowner.phone) ownership.push({ phone: homeowner.phone });
  ownership.push({ customerId: String(homeowner._id) });

  return JobRequest.findOne({
    _id: jobId,
    $or: ownership
  });
}

function normalizeId(value) {
  return value ? String(value) : null;
}

function getAuthedUser(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token || !process.env.JWT_SECRET) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return {
      id: normalizeId(decoded.id || decoded.proId),
      role: decoded.role || null,
      email: decoded.email || '',
      isAdmin: decoded.isAdmin === true
    };
  } catch {
    return null;
  }
}

router.use(requireDatabase);


router.post('/homeowner/jobs/:jobId/confirm-booking', async (req, res) => {
  try {
    const user = getAuthedUser(req);
    if (!user?.id) return res.status(401).json({ error: 'Unauthorized' });
    if (user.role !== 'homeowner') return res.status(403).json({ error: 'Homeowner access required' });
    if (!stripe) return res.status(503).json({ error: 'Payment system is temporarily unavailable' });

    const homeowner = await Homeowner.findById(user.id).lean();
    if (!homeowner) return res.status(404).json({ error: 'Homeowner not found' });

    const job = await getOwnedJob(homeowner, req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Project not found' });
    if (!job.assignedTo && !job.assignedProId) {
      return res.status(400).json({ error: 'A professional must be assigned before booking can be confirmed.' });
    }
    if (job.clockInTime) {
      return res.status(409).json({ error: 'This job has already started.' });
    }
    if (job.paymentAuthConsent && job.stripeCustomerId && job.stripePaymentMethodId) {
      return res.json({ success: true, alreadyConfirmed: true });
    }

    let customerId = job.stripeCustomerId || '';
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: job.email || homeowner.email || undefined,
        name: job.name || homeowner.name || undefined,
        metadata: {
          homeownerId: String(homeowner._id),
          jobId: String(job._id),
          source: 'fixlo-free-quote-confirm-booking'
        }
      });
      customerId = customer.id;
      job.stripeCustomerId = customerId;
      await job.save();
    }

    const base = clientBaseUrl();
    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: customerId,
      payment_method_types: ['card'],
      success_url: `${base}/homeowner/dashboard?booking=success&job_id=${job._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/homeowner/dashboard?booking=cancelled&job_id=${job._id}`,
      metadata: {
        kind: 'homeowner_job_payment_authorization',
        homeownerId: String(homeowner._id),
        jobId: String(job._id),
        hourlyRate: String(job.hourlyRate || 75)
      }
    });

    return res.json({ success: true, checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Error creating homeowner booking confirmation:', error);
    return res.status(500).json({ error: 'Unable to start secure booking confirmation.' });
  }
});

router.post('/homeowner/jobs/:jobId/confirm-booking/verify', async (req, res) => {
  try {
    const user = getAuthedUser(req);
    if (!user?.id) return res.status(401).json({ error: 'Unauthorized' });
    if (user.role !== 'homeowner') return res.status(403).json({ error: 'Homeowner access required' });
    if (!stripe) return res.status(503).json({ error: 'Payment system is temporarily unavailable' });

    const homeowner = await Homeowner.findById(user.id).lean();
    if (!homeowner) return res.status(404).json({ error: 'Homeowner not found' });

    const job = await getOwnedJob(homeowner, req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Project not found' });

    const sessionId = String(req.body?.sessionId || '').trim();
    if (!sessionId) return res.status(400).json({ error: 'Missing checkout session.' });

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['setup_intent', 'setup_intent.payment_method']
    });

    if (
      session.mode !== 'setup' ||
      session.status !== 'complete' ||
      session.metadata?.kind !== 'homeowner_job_payment_authorization' ||
      String(session.metadata?.jobId || '') !== String(job._id)
    ) {
      return res.status(400).json({ error: 'Booking confirmation could not be verified.' });
    }

    const setupIntent = session.setup_intent;
    const paymentMethod = setupIntent?.payment_method;
    const paymentMethodId = typeof paymentMethod === 'string' ? paymentMethod : paymentMethod?.id;
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

    if (!paymentMethodId || !customerId) {
      return res.status(400).json({ error: 'No saved payment method was returned by Stripe.' });
    }

    job.stripeCustomerId = customerId;
    job.stripePaymentMethodId = paymentMethodId;
    job.paymentAuthConsent = true;
    job.paymentAuthConsentAt = new Date();
    job.hourlyRate = Number(job.hourlyRate || 75);
    if (job.status === 'pending') job.status = 'assigned';
    await job.save();

    return res.json({
      success: true,
      confirmed: true,
      jobId: job._id,
      hourlyRate: job.hourlyRate
    });
  } catch (error) {
    console.error('Error verifying homeowner booking confirmation:', error);
    return res.status(500).json({ error: 'Unable to verify booking confirmation.' });
  }
});

router.get('/homeowner', async (req, res) => {
  try {
    const user = getAuthedUser(req);
    if (!user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (user.role !== 'homeowner') {
      return res.status(403).json({ error: 'Homeowner access required' });
    }

    const homeowner = await Homeowner.findById(user.id)
      .select('-password -passwordResetTokenHash -passwordResetExpires')
      .lean();

    if (!homeowner) {
      return res.status(404).json({ error: 'Homeowner not found' });
    }

    const jobOr = [];
    if (homeowner.email) jobOr.push({ email: homeowner.email.toLowerCase() });
    if (homeowner.phone) jobOr.push({ phone: homeowner.phone });
    jobOr.push({ customerId: String(homeowner._id) });

    const jobs = await JobRequest.find({ $or: jobOr })
      .populate('assignedTo', 'name businessName trade email phone')
      .sort({ createdAt: -1 })
      .lean();

    const now = new Date();
    const next30Days = new Date(now);
    next30Days.setDate(next30Days.getDate() + 30);
    const jobIds = jobs.map((job) => job._id);

    const [notifications, upcomingAppointments, recentDocuments, activity, unreadNotifications, totalDocuments] = await Promise.all([
      Notification.find({
        userId: homeowner._id,
        read: false,
        isDeleted: { $ne: true }
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Appointment.find({
        homeownerId: homeowner._id,
        scheduledAt: { $gte: now, $lte: next30Days },
        status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
      })
        .populate('proId', 'name businessName trade phone email')
        .populate('jobId', 'trade status name address')
        .sort({ scheduledAt: 1 })
        .lean(),
      Document.find({
        ownerId: homeowner._id,
        isDeleted: { $ne: true }
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      jobIds.length
        ? ProjectTimeline.find({ jobId: { $in: jobIds } })
          .sort({ createdAt: -1 })
          .limit(25)
          .lean()
        : Promise.resolve([]),
      Notification.countDocuments({
        userId: homeowner._id,
        read: false,
        isDeleted: { $ne: true }
      }),
      Document.countDocuments({
        ownerId: homeowner._id,
        isDeleted: { $ne: true }
      })
    ]);

    const completedJobs = jobs.filter((job) => job.status === 'completed').length;
    const pendingJobs = jobs.filter((job) => job.status === 'pending').length;
    const activeJobs = jobs.filter((job) => !['pending', 'completed', 'cancelled'].includes(job.status)).length;

    return res.json({
      user: {
        id: homeowner._id,
        name: homeowner.name,
        email: homeowner.email,
        phone: homeowner.phone
      },
      summary: {
        totalJobs: jobs.length,
        activeJobs,
        completedJobs,
        pendingJobs,
        upcomingAppointments: upcomingAppointments.length,
        unreadNotifications,
        documents: totalDocuments
      },
      jobs: jobs.map((job) => ({
        ...job,
        assignedProName: job.assignedTo
          ? job.assignedTo.businessName || job.assignedTo.name || null
          : null
      })),
      appointments: upcomingAppointments,
      notifications,
      documents: recentDocuments,
      activity
    });
  } catch (error) {
    console.error('Error building homeowner dashboard:', error);
    return res.status(500).json({ error: 'Failed to fetch homeowner dashboard' });
  }
});

module.exports = router;

