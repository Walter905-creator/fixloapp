const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
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

function requireUser(req, res, next) {
  const user = getAuthedUser(req);
  if (!user?.id || !mongoose.Types.ObjectId.isValid(user.id)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = user;
  return next();
}

function isOwner(appointment, user) {
  const userId = String(user.id);
  return String(appointment.homeownerId) === userId || String(appointment.proId || '') === userId;
}

function buildStatusTimestamps(updates) {
  const nextUpdates = { ...updates };
  if (nextUpdates.status === 'confirmed' && !nextUpdates.confirmedAt) {
    nextUpdates.confirmedAt = new Date();
  }
  if (nextUpdates.status === 'completed' && !nextUpdates.completedAt) {
    nextUpdates.completedAt = new Date();
  }
  if (nextUpdates.status === 'cancelled' && !nextUpdates.cancelledAt) {
    nextUpdates.cancelledAt = new Date();
  }
  return nextUpdates;
}

router.use(requireDatabase);
router.use(requireUser);

router.get('/calendar/appointments', async (req, res) => {
  try {
    if (!['homeowner', 'pro'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Calendar access requires homeowner or pro role' });
    }

    const query = req.user.role === 'homeowner'
      ? { homeownerId: req.user.id }
      : { proId: req.user.id };

    const VALID_STATUSES = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
    if (req.query.status) {
      const s = String(req.query.status);
      if (!VALID_STATUSES.includes(s)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      query.status = s;
    }

    if (req.query.start || req.query.end) {
      query.scheduledAt = {};
      if (req.query.start) {
        const start = new Date(req.query.start);
        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({ error: 'Invalid start date' });
        }
        query.scheduledAt.$gte = start;
      }
      if (req.query.end) {
        const end = new Date(req.query.end);
        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({ error: 'Invalid end date' });
        }
        query.scheduledAt.$lte = end;
      }
    }

    const appointments = await Appointment.find(query)
      .populate('homeownerId', 'name email phone')
      .populate('proId', 'name businessName email phone trade')
      .populate('jobId', 'trade status name email phone address')
      .sort({ scheduledAt: 1 })
      .lean();

    return res.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.post('/calendar/appointments', async (req, res) => {
  try {
    if (!['homeowner', 'pro'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Calendar access requires homeowner or pro role' });
    }

    const {
      homeownerId,
      proId,
      jobId,
      title,
      description,
      scheduledAt,
      endAt,
      type,
      location,
      notes
    } = req.body || {};

    if (!title || !scheduledAt) {
      return res.status(400).json({ error: 'title and scheduledAt are required' });
    }

    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ error: 'Invalid scheduledAt value' });
    }

    const resolvedHomeownerId = req.user.role === 'homeowner' ? req.user.id : homeownerId;
    const resolvedProId = req.user.role === 'pro' ? req.user.id : proId;
    if (!resolvedHomeownerId || !mongoose.Types.ObjectId.isValid(resolvedHomeownerId)) {
      return res.status(400).json({ error: 'Valid homeownerId is required' });
    }

    if (resolvedProId && !mongoose.Types.ObjectId.isValid(resolvedProId)) {
      return res.status(400).json({ error: 'Invalid proId' });
    }
    if (jobId && !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ error: 'Invalid jobId' });
    }
    if (endAt && Number.isNaN(new Date(endAt).getTime())) {
      return res.status(400).json({ error: 'Invalid endAt value' });
    }

    const appointment = await Appointment.create({
      homeownerId: resolvedHomeownerId,
      proId: resolvedProId || undefined,
      jobId: jobId || undefined,
      title,
      description,
      scheduledAt: scheduledDate,
      endAt: endAt ? new Date(endAt) : undefined,
      type,
      location,
      notes
    });

    if (jobId) {
      await ProjectTimeline.create({
        jobId,
        homeownerId: appointment.homeownerId,
        proId: appointment.proId,
        event: 'appointment_scheduled',
        title: 'Appointment scheduled',
        description: title,
        metadata: {
          appointmentId: appointment._id,
          type: appointment.type,
          scheduledAt: appointment.scheduledAt,
          endAt: appointment.endAt,
          location: appointment.location
        },
        createdBy: req.user.id
      });
    }

    const createdAppointment = await Appointment.findById(appointment._id)
      .populate('homeownerId', 'name email phone')
      .populate('proId', 'name businessName email phone trade')
      .populate('jobId', 'trade status name email phone address')
      .lean();

    return res.status(201).json(createdAppointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({ error: 'Failed to create appointment' });
  }
});

router.get('/calendar/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid appointment id' });
    }

    const appointment = await Appointment.findById(id)
      .populate('homeownerId', 'name email phone')
      .populate('proId', 'name businessName email phone trade')
      .populate('jobId', 'trade status name email phone address')
      .lean();

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (!isOwner(appointment, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

router.put('/calendar/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid appointment id' });
    }

    const existingAppointment = await Appointment.findById(id).lean();
    if (!existingAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (!isOwner(existingAppointment, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const allowedFields = ['title', 'description', 'scheduledAt', 'endAt', 'status', 'type', 'location', 'notes', 'proId', 'jobId', 'cancelReason'];
    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
        updates[field] = req.body[field];
      }
    }

    if (updates.proId && !mongoose.Types.ObjectId.isValid(updates.proId)) {
      return res.status(400).json({ error: 'Invalid proId' });
    }
    if (updates.jobId && !mongoose.Types.ObjectId.isValid(updates.jobId)) {
      return res.status(400).json({ error: 'Invalid jobId' });
    }
    if (updates.scheduledAt && Number.isNaN(new Date(updates.scheduledAt).getTime())) {
      return res.status(400).json({ error: 'Invalid scheduledAt value' });
    }
    if (updates.endAt && Number.isNaN(new Date(updates.endAt).getTime())) {
      return res.status(400).json({ error: 'Invalid endAt value' });
    }

    if (updates.scheduledAt) updates.scheduledAt = new Date(updates.scheduledAt);
    if (updates.endAt) updates.endAt = new Date(updates.endAt);

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { $set: buildStatusTimestamps(updates) },
      { new: true }
    )
      .populate('homeownerId', 'name email phone')
      .populate('proId', 'name businessName email phone trade')
      .populate('jobId', 'trade status name email phone address')
      .lean();

    return res.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return res.status(500).json({ error: 'Failed to update appointment' });
  }
});

router.delete('/calendar/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid appointment id' });
    }

    const existingAppointment = await Appointment.findById(id).lean();
    if (!existingAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (!isOwner(existingAppointment, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Appointment.findByIdAndUpdate(id, {
      $set: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: req.body?.cancelReason || existingAppointment.cancelReason || ''
      }
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

module.exports = router;
