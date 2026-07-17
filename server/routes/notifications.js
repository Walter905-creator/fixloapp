const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { requireDatabase } = require('../config/database');

const router = express.Router();

function normalizeId(value) {
  if (!value) return null;
  return String(value);
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

function parseLimit(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 20;
  return Math.min(parsed, 100);
}

router.use(requireDatabase);
router.use(requireUser);

router.get('/notifications/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      read: false,
      isDeleted: { $ne: true }
    });

    return res.json({ count });
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    return res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

router.put('/notifications/read-all', async (req, res) => {
  try {
    const now = new Date();
    const result = await Notification.updateMany(
      {
        userId: req.user.id,
        read: false,
        isDeleted: { $ne: true }
      },
      {
        $set: {
          read: true,
          readAt: now
        }
      }
    );

    return res.json({
      success: true,
      modifiedCount: result.modifiedCount || 0
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = parseLimit(req.query.limit);
    const query = {
      userId: req.user.id,
      isDeleted: { $ne: true }
    };

    if (req.query.read === 'true') query.read = true;
    if (req.query.read === 'false') query.read = false;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query)
    ]);

    return res.json({
      notifications,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.put('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid notification id' });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        userId: req.user.id,
        isDeleted: { $ne: true }
      },
      {
        $set: {
          read: true,
          readAt: new Date()
        }
      },
      {
        new: true,
        lean: true
      }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ error: 'Failed to update notification' });
  }
});

router.delete('/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid notification id' });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        userId: req.user.id,
        isDeleted: { $ne: true }
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date()
        }
      },
      {
        new: true,
        lean: true
      }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ error: 'Failed to delete notification' });
  }
});

router.post('/notifications', async (req, res) => {
  try {
    if (!(req.user.role === 'admin' || req.user.isAdmin === true)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      userId,
      userRole,
      type,
      title,
      message,
      relatedId,
      relatedType,
      actionUrl
    } = req.body || {};

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Valid userId is required' });
    }

    if (relatedId && !mongoose.Types.ObjectId.isValid(relatedId)) {
      return res.status(400).json({ error: 'Invalid relatedId' });
    }

    if (!title || !message || !type || !userRole) {
      return res.status(400).json({ error: 'userRole, type, title, and message are required' });
    }

    const notification = await Notification.create({
      userId,
      userRole,
      type,
      title,
      message,
      relatedId,
      relatedType,
      actionUrl
    });

    return res.status(201).json(notification.toObject());
  } catch (error) {
    console.error('Error creating notification:', error);
    return res.status(500).json({ error: 'Failed to create notification' });
  }
});

module.exports = router;

