/**
 * Privacy Audit Logger Middleware
 * Logs all privacy-related actions for compliance and audit purposes
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const privacyLogFile = path.join(logsDir, 'privacy-audit.log');

/**
 * Log a privacy-related action
 * @param {string} action - The privacy action (e.g., 'DATA_ACCESS', 'DATA_EXPORT', 'DATA_DELETION')
 * @param {string} email - User email
 * @param {string} userType - Type of user (pro or homeowner)
 * @param {string} ipAddress - IP address of the request
 * @param {object} details - Additional details about the action
 */
const logPrivacyAction = (action, email, userType, ipAddress, details = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    email,
    userType,
    ipAddress,
    details,
    environment: process.env.NODE_ENV || 'development'
  };

  const logLine = JSON.stringify(logEntry) + '\n';

  // Append to log file
  fs.appendFile(privacyLogFile, logLine, (err) => {
    if (err) {
      console.error('Failed to write to privacy audit log:', err);
    }
  });

  // Also log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔒 Privacy Audit:', logEntry);
  }
};

/**
 * Middleware to log privacy-related requests
 */
const privacyAuditLogger = (req, res, next) => {
  // Only log privacy-related routes
  if (!req.path.startsWith('/api/privacy')) {
    return next();
  }

  // Get client IP (considering proxy)
  const ipAddress = req.ip || 
                    req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                    req.connection.remoteAddress;

  // Log the action after the response is sent
  const originalSend = res.send;
  res.send = function(data) {
    // Only log if the request was successful (2xx status)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const action = req.path.split('/').pop()?.toUpperCase() || 'UNKNOWN';
      const email = req.body?.email || 'unknown';
      const userType = req.body?.userType || 'unknown';
      
      logPrivacyAction(action, email, userType, ipAddress, {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        userAgent: req.headers['user-agent']
      });
    }

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Get privacy audit logs (for admin use)
 * @param {number} limit - Number of recent logs to retrieve
 * @returns {Promise<Array>} Array of log entries
 */
const getPrivacyAuditLogs = (limit = 100) => {
  return new Promise((resolve, reject) => {
    fs.readFile(privacyLogFile, 'utf8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          // File doesn't exist yet
          return resolve([]);
        }
        return reject(err);
      }

      const lines = data.trim().split('\n').filter(line => line);
      const logs = lines
        .slice(-limit) // Get last N lines
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (e) {
            console.error('Failed to parse log line:', line);
            return null;
          }
        })
        .filter(log => log !== null)
        .reverse(); // Most recent first

      resolve(logs);
    });
  });
};

/**
 * Clear old privacy audit logs (for data retention compliance)
 * Keeps logs from the last N days
 * @param {number} retentionDays - Number of days to retain logs
 */
const cleanupOldPrivacyLogs = (retentionDays = 365) => {
  return new Promise((resolve, reject) => {
    fs.readFile(privacyLogFile, 'utf8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          return resolve({ deleted: 0, kept: 0 });
        }
        return reject(err);
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const lines = data.trim().split('\n').filter(line => line);
      let keptCount = 0;
      let deletedCount = 0;

      const keptLines = lines.filter(line => {
        try {
          const log = JSON.parse(line);
          const logDate = new Date(log.timestamp);
          
          if (logDate >= cutoffDate) {
            keptCount++;
            return true;
          } else {
            deletedCount++;
            return false;
          }
        } catch (e) {
          // Keep unparseable lines
          keptCount++;
          return true;
        }
      });

      // Write back the filtered logs
      const newContent = keptLines.join('\n') + (keptLines.length > 0 ? '\n' : '');
      
      fs.writeFile(privacyLogFile, newContent, (err) => {
        if (err) {
          return reject(err);
        }
        resolve({ deleted: deletedCount, kept: keptCount });
      });
    });
  });
};

module.exports = {
  privacyAuditLogger,
  logPrivacyAction,
  getPrivacyAuditLogs,
  cleanupOldPrivacyLogs
};
