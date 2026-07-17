const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Message = require('../models/Message');
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

function buildConversationId(userA, userB) {
  return [String(userA), String(userB)].sort().join('_');
}

function parseLimit(value, fallback = 50) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, 100);
}

async function getConversationMessages(req, res) {
  try {
    const { conversationId } = req.params;
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = parseLimit(req.query.limit);

    const membership = await Message.findOne({
      conversationId,
      $or: [
        { senderId: req.user.id },
        { receiverId: req.user.id }
      ]
    }).lean();

    if (!membership) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const [messages, total] = await Promise.all([
      Message.find({ conversationId })
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Message.countDocuments({ conversationId })
    ]);

    return res.json({ messages, total, page, limit });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

router.use(requireDatabase);
router.use(requireUser);

router.get('/conversations', async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userObjectId },
            { receiverId: userObjectId }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          updatedAt: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', userObjectId] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { updatedAt: -1 } }
    ]);

    return res.json({
      conversations: conversations.map((conversation) => {
        const lastMessage = conversation.lastMessage;
        const senderId = String(lastMessage.senderId);
        const receiverId = String(lastMessage.receiverId);
        const isSender = senderId === req.user.id;

        return {
          conversationId: conversation._id,
          otherUser: {
            id: isSender ? receiverId : senderId,
            role: isSender ? lastMessage.receiverRole : lastMessage.senderRole
          },
          jobId: lastMessage.jobId || null,
          lastMessage,
          unreadCount: conversation.unreadCount,
          updatedAt: conversation.updatedAt
        };
      })
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/conversations/:conversationId/messages', getConversationMessages);
router.get('/messages/:conversationId', getConversationMessages);

router.post('/conversations', async (req, res) => {
  try {
    const { receiverId, receiverRole, content, jobId } = req.body || {};

    if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ error: 'Valid receiverId is required' });
    }
    if (!receiverRole || !content) {
      return res.status(400).json({ error: 'receiverRole and content are required' });
    }
    if (jobId && !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ error: 'Invalid jobId' });
    }
    if (String(receiverId) === req.user.id) {
      return res.status(400).json({ error: 'Cannot send a message to yourself' });
    }

    const conversationId = buildConversationId(req.user.id, receiverId);
    const message = await Message.create({
      conversationId,
      senderId: req.user.id,
      senderRole: req.user.role,
      receiverId,
      receiverRole,
      jobId: jobId || undefined,
      content
    });

    const payload = message.toObject();
    const io = req.app.get('io');
    if (io) {
      io.emit('message:new', payload);
    }

    return res.status(201).json(payload);
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

router.put('/conversations/:conversationId/read', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const membership = await Message.findOne({
      conversationId,
      $or: [
        { senderId: req.user.id },
        { receiverId: req.user.id }
      ]
    }).lean();

    if (!membership) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const now = new Date();
    const result = await Message.updateMany(
      {
        conversationId,
        receiverId: req.user.id,
        read: false
      },
      {
        $set: {
          read: true,
          readAt: now
        }
      }
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('message:read', {
        conversationId,
        userId: req.user.id,
        modifiedCount: result.modifiedCount || 0
      });
    }

    return res.json({ success: true, modifiedCount: result.modifiedCount || 0 });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    return res.status(500).json({ error: 'Failed to mark conversation as read' });
  }
});

module.exports = router;

