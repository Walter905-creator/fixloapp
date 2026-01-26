const mongoose = require('mongoose');

/**
 * Scheduler State Model
 * Persists scheduler execution state for serverless environments
 * Enables distributed execution locking and state tracking
 */
const schedulerStateSchema = new mongoose.Schema({
  // Singleton identifier - only one document should exist
  _id: {
    type: String,
    default: 'scheduler_state',
    required: true
  },
  
  // Execution tracking
  lastRunAt: {
    type: Date,
    comment: 'When scheduler last executed successfully'
  },
  
  lastRunDuration: {
    type: Number,
    comment: 'Duration of last run in milliseconds'
  },
  
  lastRunStatus: {
    type: String,
    enum: ['success', 'failure', 'running'],
    comment: 'Status of last execution'
  },
  
  lastRunError: {
    type: String,
    comment: 'Error message if last run failed'
  },
  
  // Execution lock (prevents concurrent execution)
  executionLock: {
    type: Boolean,
    default: false,
    comment: 'Lock to prevent concurrent executions'
  },
  
  lockAcquiredAt: {
    type: Date,
    comment: 'When execution lock was acquired'
  },
  
  lockExpiry: {
    type: Date,
    comment: 'When execution lock expires (stale lock recovery)'
  },
  
  lockedBy: {
    type: String,
    comment: 'Instance ID that acquired the lock'
  },
  
  // Statistics
  totalExecutions: {
    type: Number,
    default: 0,
    comment: 'Total number of executions'
  },
  
  totalSuccesses: {
    type: Number,
    default: 0,
    comment: 'Total successful executions'
  },
  
  totalFailures: {
    type: Number,
    default: 0,
    comment: 'Total failed executions'
  },
  
  totalPostsProcessed: {
    type: Number,
    default: 0,
    comment: 'Total posts processed across all executions'
  },
  
  totalPostsPublished: {
    type: Number,
    default: 0,
    comment: 'Total posts successfully published'
  },
  
  // Next scheduled post info (for status endpoint)
  nextScheduledPost: {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ScheduledPost'
    },
    scheduledFor: Date,
    platform: String
  }
}, {
  timestamps: true
});

// Ensure only one document exists
schedulerStateSchema.index({ _id: 1 }, { unique: true });

/**
 * Acquire execution lock
 * @param {string} instanceId - Unique identifier for this instance
 * @param {number} lockDurationMs - How long lock should be held (default: 5 minutes)
 * @returns {Promise<boolean>} - True if lock acquired
 */
schedulerStateSchema.statics.acquireLock = async function(instanceId, lockDurationMs = 300000) {
  const now = new Date();
  const expiry = new Date(now.getTime() + lockDurationMs);
  
  try {
    // Try to acquire lock atomically
    // Only succeeds if:
    // - No lock exists (executionLock: false)
    // - OR lock has expired (lockExpiry < now)
    const result = await this.findOneAndUpdate(
      {
        _id: 'scheduler_state',
        $or: [
          { executionLock: false },
          { lockExpiry: { $lt: now } }
        ]
      },
      {
        $set: {
          executionLock: true,
          lockAcquiredAt: now,
          lockExpiry: expiry,
          lockedBy: instanceId,
          lastRunStatus: 'running'
        }
      },
      {
        upsert: true,
        new: true
      }
    );
    
    return result !== null;
  } catch (error) {
    console.error('[SchedulerState] Failed to acquire lock:', error.message);
    return false;
  }
};

/**
 * Release execution lock
 * @param {string} instanceId - Must match the instance that acquired the lock
 */
schedulerStateSchema.statics.releaseLock = async function(instanceId) {
  try {
    await this.findOneAndUpdate(
      {
        _id: 'scheduler_state',
        lockedBy: instanceId
      },
      {
        $set: {
          executionLock: false,
          lockExpiry: null,
          lockedBy: null
        }
      }
    );
    return true;
  } catch (error) {
    console.error('[SchedulerState] Failed to release lock:', error.message);
    return false;
  }
};

/**
 * Update execution statistics
 * @param {Object} stats - Execution statistics
 */
schedulerStateSchema.statics.updateStats = async function(stats) {
  const {
    duration,
    status,
    error,
    postsProcessed,
    postsPublished,
    nextScheduledPost
  } = stats;
  
  try {
    const update = {
      lastRunAt: new Date(),
      lastRunDuration: duration,
      lastRunStatus: status,
      lastRunError: error || null,
      executionLock: false,
      lockExpiry: null,
      lockedBy: null,
      $inc: {
        totalExecutions: 1,
        totalSuccesses: status === 'success' ? 1 : 0,
        totalFailures: status === 'failure' ? 1 : 0,
        totalPostsProcessed: postsProcessed || 0,
        totalPostsPublished: postsPublished || 0
      }
    };
    
    if (nextScheduledPost) {
      update.nextScheduledPost = nextScheduledPost;
    }
    
    await this.findOneAndUpdate(
      { _id: 'scheduler_state' },
      update,
      { upsert: true }
    );
    
    return true;
  } catch (error) {
    console.error('[SchedulerState] Failed to update stats:', error.message);
    return false;
  }
};

/**
 * Get current state
 */
schedulerStateSchema.statics.getState = async function() {
  try {
    let state = await this.findById('scheduler_state').lean();
    
    if (!state) {
      // Create initial state
      state = await this.create({
        _id: 'scheduler_state',
        totalExecutions: 0,
        totalSuccesses: 0,
        totalFailures: 0,
        totalPostsProcessed: 0,
        totalPostsPublished: 0
      });
    }
    
    return state;
  } catch (error) {
    console.error('[SchedulerState] Failed to get state:', error.message);
    return null;
  }
};

module.exports = mongoose.model('SchedulerState', schedulerStateSchema);
