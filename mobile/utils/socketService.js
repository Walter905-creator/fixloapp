/**
 * Socket.io Service
 * Handles real-time communication with the backend server
 */

import { io } from 'socket.io-client';
import { getApiUrl } from '../config/api';

let socket = null;
let isConnected = false;

/**
 * Initialize Socket.io connection
 * @returns {Object} Socket instance
 */
export const initializeSocket = () => {
  if (socket) {
    return socket;
  }

  const apiUrl = getApiUrl();

  socket = io(apiUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    isConnected = true;
    if (__DEV__) {

    }
  });

  socket.on('disconnect', (reason) => {
    isConnected = false;
    if (__DEV__) {

    }
  });

  socket.on('connect_error', (error) => {
    if (__DEV__) {
      console.error('❌ Socket.io connection error:', error.message);
    }
  });

  socket.on('reconnect', (attemptNumber) => {
    isConnected = true;
    if (__DEV__) {

    }
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    if (__DEV__) {

    }
  });

  socket.on('reconnect_error', (error) => {
    if (__DEV__) {
      console.error('❌ Socket.io reconnection error:', error.message);
    }
  });

  socket.on('reconnect_failed', () => {
    if (__DEV__) {
      console.error('❌ Socket.io reconnection failed - giving up');
    }
  });

  return socket;
};

/**
 * Get the socket instance
 * @returns {Object|null} Socket instance or null
 */
export const getSocket = () => {
  if (!socket && __DEV__) {
    console.warn('⚠️ Socket not initialized. Call initializeSocket() first.');
  }
  return socket;
};

/**
 * Check if socket is connected
 * @returns {boolean} Connection status
 */
export const isSocketConnected = () => {
  return isConnected && socket?.connected;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnected = false;
  }
};

/**
 * Join a room (for targeted updates)
 * @param {string} room - Room name
 */
export const joinRoom = (room) => {
  if (socket && isConnected) {
    socket.emit('join', room);
    if (__DEV__) {

    }
  }
};

/**
 * Leave a room
 * @param {string} room - Room name
 */
export const leaveRoom = (room) => {
  if (socket && isConnected) {
    socket.emit('leave', room);
    if (__DEV__) {

    }
  }
};

/**
 * Subscribe to new job notifications
 * @param {Function} callback - Callback function to handle new jobs
 * @returns {Function} Unsubscribe function
 */
export const subscribeToNewJobs = (callback) => {
  if (!socket) {
    return () => {};
  }

  const handleNewJob = (job) => {
    if (__DEV__) {

    }
    callback(job);
  };

  socket.on('newJob', handleNewJob);
  socket.on('job:created', handleNewJob);

  // Return unsubscribe function
  return () => {
    socket.off('newJob', handleNewJob);
    socket.off('job:created', handleNewJob);
  };
};

/**
 * Subscribe to job updates
 * @param {Function} callback - Callback function to handle job updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToJobUpdates = (callback) => {
  if (!socket) {
    return () => {};
  }

  const handleJobUpdate = (update) => {
    if (__DEV__) {

    }
    callback(update);
  };

  socket.on('jobUpdate', handleJobUpdate);
  socket.on('job:updated', handleJobUpdate);

  // Return unsubscribe function
  return () => {
    socket.off('jobUpdate', handleJobUpdate);
    socket.off('job:updated', handleJobUpdate);
  };
};

/**
 * Subscribe to job status changes
 * @param {string} jobId - Job ID to monitor
 * @param {Function} callback - Callback function to handle status changes
 * @returns {Function} Unsubscribe function
 */
export const subscribeToJobStatus = (jobId, callback) => {
  if (!socket) {
    return () => {};
  }

  const eventName = `job:${jobId}:status`;
  
  socket.on(eventName, callback);

  // Return unsubscribe function
  return () => {
    socket.off(eventName, callback);
  };
};

/**
 * Emit a custom event
 * @param {string} event - Event name
 * @param {any} data - Data to send
 */
export const emitEvent = (event, data) => {
  if (socket && isConnected) {
    socket.emit(event, data);
    if (__DEV__) {

    }
  }
};

/**
 * Subscribe to a custom event
 * @param {string} event - Event name
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToEvent = (event, callback) => {
  if (!socket) {

    return () => {};
  }

  socket.on(event, callback);

  // Return unsubscribe function
  return () => {
    socket.off(event, callback);
  };
};

export default {
  initializeSocket,
  getSocket,
  isSocketConnected,
  disconnectSocket,
  joinRoom,
  leaveRoom,
  subscribeToNewJobs,
  subscribeToJobUpdates,
  subscribeToJobStatus,
  emitEvent,
  subscribeToEvent,
};
