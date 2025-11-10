/**
 * Messages Routes
 * API endpoints for direct messaging between users
 */

const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');

// Simple in-memory storage for demo (replace with MongoDB in production)
const conversations = new Map();
const messages = new Map();

/**
 * Get all conversations for the authenticated user
 */
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const userConversations = [];

    // Find conversations involving this user
    for (const [convId, conv] of conversations.entries()) {
      if (conv.participants.includes(userId)) {
        const otherUserId = conv.participants.find(id => id !== userId);
        const convMessages = messages.get(convId) || [];
        const lastMessage = convMessages[convMessages.length - 1];
        const unreadCount = convMessages.filter(
          m => m.senderId !== userId && !m.read
        ).length;

        userConversations.push({
          _id: convId,
          otherUser: {
            _id: otherUserId,
            name: conv.participantNames[otherUserId] || 'Unknown User',
          },
          lastMessage,
          unreadCount,
          updatedAt: conv.updatedAt,
        });
      }
    }

    // Sort by most recent
    userConversations.sort((a, b) => 
      new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    res.json({ conversations: userConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/**
 * Start a new conversation
 */
router.post('/conversations', requireAuth, async (req, res) => {
  try {
    const { recipientId, initialMessage } = req.body;
    const userId = req.userId;

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID is required' });
    }

    // Check if conversation already exists
    let existingConvId = null;
    for (const [convId, conv] of conversations.entries()) {
      if (
        conv.participants.includes(userId) &&
        conv.participants.includes(recipientId)
      ) {
        existingConvId = convId;
        break;
      }
    }

    const conversationId = existingConvId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (!existingConvId) {
      conversations.set(conversationId, {
        _id: conversationId,
        participants: [userId, recipientId],
        participantNames: {
          [userId]: req.userName || 'User',
          [recipientId]: 'Recipient',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      messages.set(conversationId, []);
    }

    // Send initial message if provided
    if (initialMessage) {
      const message = {
        _id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId,
        senderId: userId,
        text: initialMessage,
        read: false,
        createdAt: new Date().toISOString(),
      };

      const convMessages = messages.get(conversationId);
      convMessages.push(message);
      
      // Update conversation timestamp
      const conv = conversations.get(conversationId);
      conv.updatedAt = new Date().toISOString();

      // Emit socket event for real-time delivery
      if (req.app.get('io')) {
        req.app.get('io').emit('message:new', message);
      }
    }

    res.json({
      _id: conversationId,
      participants: [userId, recipientId],
    });
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({ error: 'Failed to start conversation' });
  }
});

/**
 * Get messages for a conversation
 */
router.get('/messages/:conversationId', requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is part of this conversation
    const conversation = conversations.get(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const convMessages = messages.get(conversationId) || [];
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedMessages = convMessages.slice(startIndex, endIndex);

    res.json({
      messages: paginatedMessages,
      total: convMessages.length,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * Send a message
 */
router.post('/messages', requireAuth, async (req, res) => {
  try {
    const { conversationId, recipientId, text, attachments = [] } = req.body;
    const userId = req.userId;

    if (!conversationId || !text) {
      return res.status(400).json({ error: 'Conversation ID and text are required' });
    }

    // Verify conversation exists
    const conversation = conversations.get(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create message
    const message = {
      _id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      senderId: userId,
      text,
      attachments,
      read: false,
      createdAt: new Date().toISOString(),
    };

    // Add to messages
    const convMessages = messages.get(conversationId);
    convMessages.push(message);

    // Update conversation timestamp
    conversation.updatedAt = new Date().toISOString();

    // Emit socket event for real-time delivery
    if (req.app.get('io')) {
      req.app.get('io').emit('message:new', message);
    }

    res.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * Mark message as read
 */
router.post('/messages/:messageId/read', requireAuth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    // Find the message
    let found = false;
    let conversationId = null;

    for (const [convId, convMessages] of messages.entries()) {
      const message = convMessages.find(m => m._id === messageId);
      if (message) {
        // Verify user is recipient
        if (message.senderId !== userId) {
          message.read = true;
          message.readAt = new Date().toISOString();
          found = true;
          conversationId = convId;

          // Emit socket event
          if (req.app.get('io')) {
            req.app.get('io').emit('message:read', {
              conversationId,
              messageId,
            });
          }
        }
        break;
      }
    }

    if (!found) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

module.exports = router;
