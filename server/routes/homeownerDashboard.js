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

