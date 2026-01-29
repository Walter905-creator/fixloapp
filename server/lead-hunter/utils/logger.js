// Structured Logger for Lead Hunter
// Consistent with SEO agent logging style

const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '../../logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Formats a timestamp for logging
 * @returns {string} Formatted timestamp
 */
function timestamp() {
  return new Date().toISOString();
}

/**
 * Gets log file path for the given mode
 * @param {string} mode - The mode (observer, guarded, tuning)
 * @returns {string} Log file path
 */
function getLogFilePath(mode) {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(LOGS_DIR, `lead-hunter-${mode}-${date}.log`);
}

/**
 * Writes a log entry to file
 * @param {string} mode - The mode
 * @param {string} message - Log message
 */
function writeLog(mode, message) {
  const logFile = getLogFilePath(mode);
  const entry = `[${timestamp()}] ${message}\n`;
  
  try {
    fs.appendFileSync(logFile, entry);
  } catch (error) {
    console.error('⚠️ Failed to write log:', error.message);
  }
}

/**
 * Logs opportunities to a structured JSON file
 * @param {Array} opportunities - Array of opportunity objects
 * @param {string} mode - The mode that generated opportunities
 */
function logOpportunities(opportunities, mode = 'observer') {
  const date = new Date().toISOString().split('T')[0];
  const filename = `lead-hunter-opportunities-${date}.json`;
  const filepath = path.join(LOGS_DIR, filename);
  
  try {
    const data = {
      timestamp: timestamp(),
      mode,
      count: opportunities.length,
      opportunities,
    };
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`💾 Opportunities logged to ${filename}`);
    writeLog(mode, `Logged ${opportunities.length} opportunities to ${filename}`);
    
  } catch (error) {
    console.error('❌ Failed to log opportunities:', error.message);
    writeLog(mode, `Failed to log opportunities: ${error.message}`);
  }
}

/**
 * Logs tuning recommendations to a structured JSON file
 * @param {Array} recommendations - Array of recommendation objects
 */
function logTuningRecommendations(recommendations) {
  const date = new Date().toISOString().split('T')[0];
  const filename = `lead-hunter-tuning-${date}.json`;
  const filepath = path.join(LOGS_DIR, filename);
  
  try {
    const data = {
      timestamp: timestamp(),
      count: recommendations.length,
      recommendations,
    };
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`💾 Tuning recommendations logged to ${filename}`);
    writeLog('tuning', `Logged ${recommendations.length} recommendations to ${filename}`);
    
  } catch (error) {
    console.error('❌ Failed to log tuning recommendations:', error.message);
    writeLog('tuning', `Failed to log recommendations: ${error.message}`);
  }
}

/**
 * Reads opportunities from the most recent log file
 * @returns {Array} Array of opportunity objects
 */
function readRecentOpportunities() {
  const date = new Date().toISOString().split('T')[0];
  const filename = `lead-hunter-opportunities-${date}.json`;
  const filepath = path.join(LOGS_DIR, filename);
  
  try {
    if (!fs.existsSync(filepath)) {
      console.log(`ℹ️ No opportunities file found for today (${filename})`);
      return [];
    }
    
    const content = fs.readFileSync(filepath, 'utf-8');
    const data = JSON.parse(content);
    return data.opportunities || [];
    
  } catch (error) {
    console.error('❌ Failed to read opportunities:', error.message);
    return [];
  }
}

/**
 * Console log with structured format
 */
const log = {
  info: (mode, message) => {
    console.log(`ℹ️ [${mode}] ${message}`);
    writeLog(mode, `INFO: ${message}`);
  },
  
  success: (mode, message) => {
    console.log(`✅ [${mode}] ${message}`);
    writeLog(mode, `SUCCESS: ${message}`);
  },
  
  warning: (mode, message) => {
    console.log(`⚠️ [${mode}] ${message}`);
    writeLog(mode, `WARNING: ${message}`);
  },
  
  error: (mode, message, error) => {
    console.error(`❌ [${mode}] ${message}`);
    if (error) {
      console.error(error);
      writeLog(mode, `ERROR: ${message} - ${error.message || error}`);
    } else {
      writeLog(mode, `ERROR: ${message}`);
    }
  },
};

module.exports = {
  log,
  logOpportunities,
  logTuningRecommendations,
  readRecentOpportunities,
  writeLog,
};
