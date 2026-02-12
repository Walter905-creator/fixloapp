/**
 * MongoDB Connection Utilities
 * 
 * Shared utilities for MongoDB connection diagnostics and logging
 */

/**
 * Sanitize MongoDB URI by masking the password
 * @param {string} uri - MongoDB connection URI
 * @returns {string} Sanitized URI with password masked
 */
function sanitizeMongoURI(uri) {
  if (!uri) return '[No URI provided]';
  
  try {
    if (uri.includes('://') && uri.includes('@')) {
      // Split at protocol
      const protocolIndex = uri.indexOf('://');
      const protocol = uri.substring(0, protocolIndex);
      const afterProtocol = uri.substring(protocolIndex + 3);
      
      // Find the last @ which separates credentials from host
      const lastAtIndex = afterProtocol.lastIndexOf('@');
      if (lastAtIndex === -1) return uri; // No credentials
      
      const credentials = afterProtocol.substring(0, lastAtIndex);
      const hostAndDb = afterProtocol.substring(lastAtIndex);
      
      // Mask password in credentials
      if (credentials.includes(':')) {
        const colonIndex = credentials.indexOf(':');
        const username = credentials.substring(0, colonIndex);
        return `${protocol}://${username}:****${hostAndDb}`;
      }
    }
    return uri; // Return as-is if no credentials found
  } catch (e) {
    return '[URI parsing failed]';
  }
}

/**
 * Parse MongoDB connection URI components
 * @param {string} uri - MongoDB connection URI
 * @returns {Object} Parsed components (username, host, database) or error
 */
function parseMongoURI(uri) {
  if (!uri) {
    return { error: 'No URI provided' };
  }
  
  try {
    // Replace MongoDB protocol with http:// for URL parsing
    // Use regex with start anchor to avoid replacing within hostname
    const httpUri = uri.replace(/^mongodb\+srv:\/\//, 'http://').replace(/^mongodb:\/\//, 'http://');
    const urlObj = new URL(httpUri);
    
    return {
      username: urlObj.username || 'none',
      host: urlObj.hostname || 'none',
      database: urlObj.pathname.substring(1).split('?')[0] || 'none'
    };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Remove database name from MongoDB URI for connection testing
 * @param {string} uri - MongoDB connection URI
 * @returns {string} URI without database name
 */
function removeMongoDBName(uri) {
  if (!uri) return uri;
  
  try {
    // Parse URI to check if it has a database
    const parsed = parseMongoURI(uri);
    if (parsed.error || parsed.database === 'none') {
      // No database to remove, return as-is
      return uri;
    }
    
    // Remove the database name (path segment between @ and ?)
    // Match the pattern: /database_name followed by ? or end of string
    return uri.replace(/\/[^/?]+(\?|$)/, '/$1');
  } catch (e) {
    return uri; // Return original on error
  }
}

module.exports = {
  sanitizeMongoURI,
  parseMongoURI,
  removeMongoDBName
};
