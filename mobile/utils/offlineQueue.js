/**
 * Offline Queue Manager
 * Handles queueing of actions when offline and processes them when back online
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import apiClient from './apiClient';

const QUEUE_KEY = '@fixlo_offline_queue';
const MAX_QUEUE_SIZE = 100;
const MAX_RETRY_ATTEMPTS = 3;

class OfflineQueueManager {
  constructor() {
    this.queue = [];
    this.isOnline = true;
    this.isProcessing = false;
    this.listeners = [];
  }

  /**
   * Initialize the offline queue manager
   */
  async initialize() {
    // Load queue from storage
    await this.loadQueue();
    
    // Set up network state listener
    this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;
      
      console.log('📶 Network state changed:', this.isOnline ? 'Online' : 'Offline');
      
      // Process queue when coming back online
      if (wasOffline && this.isOnline) {
        console.log('🔄 Back online, processing queued actions...');
        this.processQueue();
      }
      
      // Notify listeners
      this.notifyListeners();
    });
    
    console.log('✅ Offline queue manager initialized');
  }

  /**
   * Add a listener for queue/network state changes
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners of state change
   */
  notifyListeners() {
    const state = {
      isOnline: this.isOnline,
      queueSize: this.queue.length,
      isProcessing: this.isProcessing,
    };
    this.listeners.forEach(callback => callback(state));
  }

  /**
   * Load queue from storage
   */
  async loadQueue() {
    try {
      const queueData = await AsyncStorage.getItem(QUEUE_KEY);
      if (queueData) {
        this.queue = JSON.parse(queueData);
        console.log(`📥 Loaded ${this.queue.length} queued actions from storage`);
      }
    } catch (error) {
      console.error('❌ Error loading queue:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to storage
   */
  async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
      console.log(`💾 Saved ${this.queue.length} actions to queue`);
    } catch (error) {
      console.error('❌ Error saving queue:', error);
    }
  }

  /**
   * Add action to queue
   * @param {Object} action - Action to queue
   * @param {string} action.type - Action type (e.g., 'CREATE_JOB', 'SEND_MESSAGE')
   * @param {string} action.endpoint - API endpoint
   * @param {string} action.method - HTTP method
   * @param {Object} action.data - Request data
   * @param {Object} action.meta - Additional metadata
   */
  async addToQueue(action) {
    // Don't queue if online and queue is empty (execute immediately)
    if (this.isOnline && this.queue.length === 0) {
      console.log('📡 Online - executing action immediately');
      try {
        return await this.executeAction(action);
      } catch (error) {
        console.log('⚠️ Failed to execute, adding to queue');
        // If fails, add to queue for retry
      }
    }

    // Add to queue
    const queuedAction = {
      ...action,
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(queuedAction);
    
    // Limit queue size
    if (this.queue.length > MAX_QUEUE_SIZE) {
      this.queue.shift(); // Remove oldest
      console.log('⚠️ Queue size limit reached, removed oldest action');
    }
    
    await this.saveQueue();
    this.notifyListeners();
    
    console.log(`📥 Action queued: ${action.type} (${this.queue.length} in queue)`);
    
    return { queued: true, id: queuedAction.id };
  }

  /**
   * Execute a single action
   */
  async executeAction(action) {
    const { endpoint, method = 'POST', data } = action;
    
    console.log(`🚀 Executing: ${action.type} - ${method} ${endpoint}`);
    
    const response = await apiClient({
      url: endpoint,
      method,
      data,
    });
    
    return response.data;
  }

  /**
   * Process all queued actions
   */
  async processQueue() {
    if (this.isProcessing || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    this.notifyListeners();
    
    console.log(`🔄 Processing ${this.queue.length} queued actions...`);
    
    const failedActions = [];
    
    while (this.queue.length > 0) {
      const action = this.queue[0];
      
      try {
        await this.executeAction(action);
        console.log(`✅ Action executed: ${action.type}`);
        this.queue.shift(); // Remove from queue
      } catch (error) {
        console.error(`❌ Action failed: ${action.type}`, error.message);
        
        action.retryCount++;
        
        if (action.retryCount >= MAX_RETRY_ATTEMPTS) {
          console.log(`⚠️ Max retries reached for ${action.type}, removing from queue`);
          this.queue.shift();
          failedActions.push(action);
        } else {
          console.log(`🔄 Will retry ${action.type} (attempt ${action.retryCount}/${MAX_RETRY_ATTEMPTS})`);
          // Move to end of queue for retry
          this.queue.shift();
          this.queue.push(action);
          break; // Stop processing for now
        }
      }
    }
    
    await this.saveQueue();
    this.isProcessing = false;
    this.notifyListeners();
    
    console.log(`✅ Queue processing complete. ${this.queue.length} remaining, ${failedActions.length} failed permanently`);
  }

  /**
   * Clear all queued actions
   */
  async clearQueue() {
    this.queue = [];
    await this.saveQueue();
    this.notifyListeners();
    console.log('🗑️ Queue cleared');
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      queueSize: this.queue.length,
      isProcessing: this.isProcessing,
      queue: this.queue,
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
    }
    this.listeners = [];
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueueManager();

export default offlineQueue;
