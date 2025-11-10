/**
 * Messaging Service
 * Handles real-time messaging between users
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket, isSocketConnected } from './socketService';
import apiClient from './apiClient';

const MESSAGES_CACHE_KEY = '@fixlo_messages_cache';

class MessagingService {
  constructor() {
    this.listeners = [];
    this.messagesCache = {};
  }

  /**
   * Initialize messaging service
   */
  async initialize() {
    await this.loadMessagesCache();
    this.setupSocketListeners();
    console.log('✅ Messaging service initialized');
  }

  /**
   * Load messages from cache
   */
  async loadMessagesCache() {
    try {
      const data = await AsyncStorage.getItem(MESSAGES_CACHE_KEY);
      if (data) {
        this.messagesCache = JSON.parse(data);
        console.log('✅ Messages cache loaded');
      }
    } catch (error) {
      console.error('❌ Error loading messages cache:', error);
    }
  }

  /**
   * Save messages to cache
   */
  async saveMessagesCache() {
    try {
      await AsyncStorage.setItem(MESSAGES_CACHE_KEY, JSON.stringify(this.messagesCache));
    } catch (error) {
      console.error('❌ Error saving messages cache:', error);
    }
  }

  /**
   * Setup socket listeners for real-time messages
   */
  setupSocketListeners() {
    const socket = getSocket();
    if (!socket) {
      console.warn('⚠️ Socket not available for messaging');
      return;
    }

    // Listen for new messages
    socket.on('message:new', (message) => {
      console.log('📨 New message received:', message);
      this.handleNewMessage(message);
    });

    // Listen for message updates
    socket.on('message:updated', (message) => {
      console.log('📝 Message updated:', message);
      this.handleMessageUpdate(message);
    });

    // Listen for message read status
    socket.on('message:read', (data) => {
      console.log('✅ Message marked as read:', data);
      this.handleMessageRead(data);
    });

    console.log('✅ Socket listeners configured for messaging');
  }

  /**
   * Handle new message received
   */
  handleNewMessage(message) {
    const conversationId = message.conversationId;
    
    if (!this.messagesCache[conversationId]) {
      this.messagesCache[conversationId] = [];
    }
    
    this.messagesCache[conversationId].push(message);
    this.saveMessagesCache();
    this.notifyListeners('new_message', message);
  }

  /**
   * Handle message update
   */
  handleMessageUpdate(message) {
    const conversationId = message.conversationId;
    
    if (this.messagesCache[conversationId]) {
      const index = this.messagesCache[conversationId].findIndex(
        m => m._id === message._id
      );
      
      if (index !== -1) {
        this.messagesCache[conversationId][index] = message;
        this.saveMessagesCache();
        this.notifyListeners('message_updated', message);
      }
    }
  }

  /**
   * Handle message read status
   */
  handleMessageRead(data) {
    const { conversationId, messageId } = data;
    
    if (this.messagesCache[conversationId]) {
      const message = this.messagesCache[conversationId].find(
        m => m._id === messageId
      );
      
      if (message) {
        message.read = true;
        message.readAt = new Date().toISOString();
        this.saveMessagesCache();
        this.notifyListeners('message_read', data);
      }
    }
  }

  /**
   * Send a message
   */
  async sendMessage(conversationId, recipientId, text, attachments = []) {
    try {
      const response = await apiClient.post('/api/messages', {
        conversationId,
        recipientId,
        text,
        attachments,
      });

      const message = response.data;
      
      // Add to cache
      if (!this.messagesCache[conversationId]) {
        this.messagesCache[conversationId] = [];
      }
      this.messagesCache[conversationId].push(message);
      await this.saveMessagesCache();

      // Send via socket for real-time delivery
      const socket = getSocket();
      if (socket && isSocketConnected()) {
        socket.emit('message:send', message);
      }

      console.log('✅ Message sent:', message._id);
      return message;
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }

  /**
   * Fetch conversation messages
   */
  async fetchConversationMessages(conversationId, page = 1, limit = 50) {
    try {
      const response = await apiClient.get(`/api/messages/${conversationId}`, {
        params: { page, limit },
      });

      const messages = response.data.messages;
      
      // Update cache
      this.messagesCache[conversationId] = messages;
      await this.saveMessagesCache();

      console.log(`✅ Fetched ${messages.length} messages for conversation ${conversationId}`);
      return messages;
      
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      // Return cached messages if available
      return this.messagesCache[conversationId] || [];
    }
  }

  /**
   * Fetch all conversations for user
   */
  async fetchConversations() {
    try {
      const response = await apiClient.get('/api/conversations');
      const conversations = response.data.conversations;
      
      console.log(`✅ Fetched ${conversations.length} conversations`);
      return conversations;
      
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      return [];
    }
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(conversationId, messageId) {
    try {
      await apiClient.post(`/api/messages/${messageId}/read`);

      // Update local cache
      if (this.messagesCache[conversationId]) {
        const message = this.messagesCache[conversationId].find(
          m => m._id === messageId
        );
        if (message) {
          message.read = true;
          message.readAt = new Date().toISOString();
          await this.saveMessagesCache();
        }
      }

      // Notify via socket
      const socket = getSocket();
      if (socket && isSocketConnected()) {
        socket.emit('message:read', { conversationId, messageId });
      }

      console.log('✅ Message marked as read:', messageId);
      
    } catch (error) {
      console.error('❌ Error marking message as read:', error);
    }
  }

  /**
   * Start a new conversation
   */
  async startConversation(recipientId, initialMessage) {
    try {
      const response = await apiClient.post('/api/conversations', {
        recipientId,
        initialMessage,
      });

      const conversation = response.data;
      console.log('✅ Conversation started:', conversation._id);
      return conversation;
      
    } catch (error) {
      console.error('❌ Error starting conversation:', error);
      throw error;
    }
  }

  /**
   * Add a listener for messaging events
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => callback(event, data));
  }

  /**
   * Get cached messages for a conversation
   */
  getCachedMessages(conversationId) {
    return this.messagesCache[conversationId] || [];
  }

  /**
   * Clear messages cache
   */
  async clearCache() {
    this.messagesCache = {};
    await AsyncStorage.removeItem(MESSAGES_CACHE_KEY);
    console.log('✅ Messages cache cleared');
  }

  /**
   * Cleanup
   */
  destroy() {
    const socket = getSocket();
    if (socket) {
      socket.off('message:new');
      socket.off('message:updated');
      socket.off('message:read');
    }
    this.listeners = [];
  }
}

// Export singleton instance
export const messagingService = new MessagingService();

export default messagingService;
