// utils/checkr.js
// Checkr Background Check Service Utilities
// Provides helper functions for integrating Checkr API into Pro signup flow

const axios = require('axios');

/**
 * Get Checkr API configuration from environment variables
 * @returns {Object|null} Configuration object with apiKey and baseUrl, or null if not configured
 */
function getCheckrConfig() {
  const apiKey = process.env.CHECKR_API_KEY;
  const baseUrl = 'https://api.checkr.com/v1';
  
  if (!apiKey) {
    console.warn('⚠️ CHECKR_API_KEY not configured');
    return null;
  }
  
  return { apiKey, baseUrl };
}

/**
 * Check if Checkr is configured and enabled
 * @returns {boolean} True if Checkr is available
 */
function isCheckrEnabled() {
  return !!getCheckrConfig();
}

/**
 * Parse a full name into first and last name
 * @param {string} name - Full name to parse
 * @returns {Object} Object with firstName and lastName
 */
function parseFullName(name) {
  const nameParts = name.trim().split(' ');
  const firstName = nameParts[0] || name;
  const lastName = nameParts.slice(1).join(' ') || nameParts[0];
  return { firstName, lastName };
}

/**
 * Format date of birth for Checkr API (YYYY-MM-DD)
 * @param {Date|string} dob - Date of birth
 * @returns {string} Formatted date string
 */
function formatDobForCheckr(dob) {
  return new Date(dob).toISOString().split('T')[0];
}

/**
 * Make authenticated request to Checkr API
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} endpoint - API endpoint path
 * @param {Object} data - Request body data (optional)
 * @returns {Promise<Object>} API response data
 */
async function checkrApiRequest(method, endpoint, data = null) {
  const config = getCheckrConfig();
  
  if (!config) {
    throw new Error('Checkr API not configured');
  }
  
  const url = `${config.baseUrl}${endpoint}`;
  const auth = Buffer.from(`${config.apiKey}:`).toString('base64');
  
  const options = {
    method,
    url,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  };
  
  if (data) {
    options.data = data;
  }
  
  console.log(`📡 Checkr API ${method} ${endpoint}`);
  
  try {
    const response = await axios(options);
    console.log(`✅ Checkr API response: ${response.status}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Checkr API error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, JSON.stringify(error.response.data));
    }
    throw error;
  }
}

/**
 * Create a Checkr candidate and send background check invitation
 * This is a convenience function for use in signup flows
 * 
 * @param {Object} proData - Pro data object
 * @param {string} proData.email - Pro's email address
 * @param {string} proData.phone - Pro's phone number
 * @param {string} proData.firstName - Pro's first name
 * @param {string} proData.lastName - Pro's last name
 * @param {string} proData.dob - Date of birth (YYYY-MM-DD format)
 * @param {string} proData.ssn - Social Security Number (for background check)
 * @param {string} proData.zipcode - ZIP code for address verification
 * @returns {Promise<Object>} Object containing candidateId, invitationId, and invitationUrl
 */
async function createCandidateAndInvitation(proData) {
  const { email, phone, firstName, lastName, dob, ssn, zipcode } = proData;
  
  // Validate required fields
  if (!email || !phone || !firstName || !lastName || !dob || !ssn || !zipcode) {
    throw new Error('Missing required fields for Checkr candidate creation');
  }
  
  console.log(`📋 Creating Checkr candidate for ${email}`);
  
  // Step 1: Create Checkr candidate
  const candidateData = {
    email: email.toLowerCase(),
    phone: phone,
    first_name: firstName,
    last_name: lastName,
    dob: dob, // Format: YYYY-MM-DD
    ssn: ssn,
    zipcode: zipcode,
  };
  
  const candidate = await checkrApiRequest('POST', '/candidates', candidateData);
  
  console.log(`✅ Checkr candidate created: ${candidate.id}`);
  
  // Step 2: Create background check invitation using "tasker_standard" package
  const invitationData = {
    candidate_id: candidate.id,
    package: 'tasker_standard', // Standard background check package for gig workers
  };
  
  const invitation = await checkrApiRequest('POST', '/invitations', invitationData);
  
  console.log(`✅ Checkr invitation created: ${invitation.id}`);
  
  return {
    candidateId: candidate.id,
    invitationId: invitation.id,
    invitationUrl: invitation.invitation_url,
    status: invitation.status || 'pending',
  };
}

/**
 * Retrieve report details from Checkr API
 * @param {string} reportId - Checkr report ID
 * @returns {Promise<Object>} Report data
 */
async function getReport(reportId) {
  if (!reportId) {
    throw new Error('Report ID is required');
  }
  
  console.log(`📋 Fetching Checkr report: ${reportId}`);
  
  const report = await checkrApiRequest('GET', `/reports/${reportId}`);
  
  console.log(`✅ Report retrieved: ${reportId}, status: ${report.status}`);
  
  return report;
}

/**
 * Retrieve candidate details from Checkr API
 * @param {string} candidateId - Checkr candidate ID
 * @returns {Promise<Object>} Candidate data
 */
async function getCandidate(candidateId) {
  if (!candidateId) {
    throw new Error('Candidate ID is required');
  }
  
  console.log(`📋 Fetching Checkr candidate: ${candidateId}`);
  
  const candidate = await checkrApiRequest('GET', `/candidates/${candidateId}`);
  
  console.log(`✅ Candidate retrieved: ${candidateId}`);
  
  return candidate;
}

module.exports = {
  isCheckrEnabled,
  getCheckrConfig,
  checkrApiRequest,
  createCandidateAndInvitation,
  getReport,
  getCandidate,
  parseFullName,
  formatDobForCheckr,
};
