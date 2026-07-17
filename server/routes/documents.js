const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Document = require('../models/Document');
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

function parseLimit(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 20;
  return Math.min(parsed, 100);
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.filter(Boolean).map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (typeof tags === 'string') {
    return tags.split(',').map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
}

function accessQuery(userId) {
  return {
    $or: [
      { ownerId: userId },
      { sharedWith: userId }
    ],
    isDeleted: { $ne: true }
  };
}

router.use(requireDatabase);
router.use(requireUser);

router.get('/documents', async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = parseLimit(req.query.limit);
    const query = accessQuery(req.user.id);

    if (req.query.type) {
      query.type = req.query.type;
    }

    if (req.query.jobId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.jobId)) {
        return res.status(400).json({ error: 'Invalid jobId' });
      }
      query.jobId = req.query.jobId;
    }

    const [documents, total] = await Promise.all([
      Document.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Document.countDocuments(query)
    ]);

    return res.json({ documents, total, page, limit });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

router.post('/documents', async (req, res) => {
  try {
    if (!['homeowner', 'pro'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only homeowners and pros can create documents' });
    }

    const {
      name,
      type,
      cloudinaryUrl,
      cloudinaryPublicId,
      cloudinaryFormat,
      fileSize,
      mimeType,
      jobId,
      description,
      tags,
      sharedWith
    } = req.body || {};

    if (!name || !type || !cloudinaryUrl || !cloudinaryPublicId) {
      return res.status(400).json({ error: 'name, type, cloudinaryUrl, and cloudinaryPublicId are required' });
    }

    if (jobId && !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ error: 'Invalid jobId' });
    }

    const normalizedSharedWith = Array.isArray(sharedWith)
      ? sharedWith.filter((id) => mongoose.Types.ObjectId.isValid(id))
      : [];

    const document = await Document.create({
      ownerId: req.user.id,
      ownerRole: req.user.role,
      jobId: jobId || undefined,
      name,
      type,
      cloudinaryUrl,
      cloudinaryPublicId,
      cloudinaryFormat,
      fileSize,
      mimeType,
      description,
      tags: normalizeTags(tags),
      sharedWith: normalizedSharedWith
    });

    return res.status(201).json(document.toObject());
  } catch (error) {
    console.error('Error creating document:', error);
    return res.status(500).json({ error: 'Failed to create document' });
  }
});

router.get('/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid document id' });
    }

    const document = await Document.findOne({
      _id: id,
      ...accessQuery(req.user.id)
    }).lean();

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    return res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    return res.status(500).json({ error: 'Failed to fetch document' });
  }
});

router.put('/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid document id' });
    }

    const updates = {};
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'name')) updates.name = req.body.name;
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'description')) updates.description = req.body.description;
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'tags')) updates.tags = normalizeTags(req.body.tags);

    const document = await Document.findOneAndUpdate(
      {
        _id: id,
        ownerId: req.user.id,
        isDeleted: { $ne: true }
      },
      { $set: updates },
      { new: true, lean: true }
    );

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    return res.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    return res.status(500).json({ error: 'Failed to update document' });
  }
});

router.delete('/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid document id' });
    }

    const document = await Document.findOneAndUpdate(
      {
        _id: id,
        ownerId: req.user.id,
        isDeleted: { $ne: true }
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date()
        }
      },
      { new: true, lean: true }
    );

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;

