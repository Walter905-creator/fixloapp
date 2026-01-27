/**
 * Lead Creation Service
 * Handles creation of job leads with various sources and metadata
 */

const JobRequest = require('../models/JobRequest');
const { geocodeAddress } = require('../utils/geocode');

/**
 * Create a lead from AI diagnosis
 * @param {Object} params - Lead parameters
 * @param {string} params.userId - User ID (optional)
 * @param {string} params.name - Customer name
 * @param {string} params.email - Customer email
 * @param {string} params.phone - Customer phone (E.164 format)
 * @param {string} params.address - Customer address
 * @param {string} params.city - City
 * @param {string} params.state - State
 * @param {string} params.zip - Zip code
 * @param {string} params.trade - Trade/service type
 * @param {string} params.description - Issue description
 * @param {Object} params.aiDiagnosis - AI diagnosis object
 * @param {Array<string>} params.images - Array of image URLs
 * @param {string} params.priority - Lead priority (LOW, MEDIUM, HIGH)
 * @returns {Promise<Object>} Created lead
 */
async function createAIDiagnosedLead({
  userId,
  name,
  email,
  phone,
  address,
  city,
  state,
  zip,
  trade,
  description,
  aiDiagnosis,
  images = [],
  priority = 'HIGH'
}) {
  try {
    console.log('📝 Creating AI-diagnosed lead');

    // Validate required fields
    if (!name || !phone || !trade || !description) {
      throw new Error('Name, phone, trade, and description are required');
    }

    // Geocode the address
    let coordinates = [-98.5795, 39.8283]; // Default to center of US
    let formattedAddress = address || 'Location not specified';

    try {
      if (address && typeof geocodeAddress === 'function') {
        const geocodeResult = await geocodeAddress(address);
        coordinates = [geocodeResult.lng, geocodeResult.lat];
        formattedAddress = geocodeResult.formatted;
        console.log('✅ Address geocoded:', formattedAddress);
      }
    } catch (geocodeError) {
      console.warn('⚠️ Geocoding failed, using default coordinates:', geocodeError.message);
    }

    // Normalize trade for consistency
    const normalizedTrade = trade.charAt(0).toUpperCase() + trade.slice(1).toLowerCase();

    // Ensure email has a fallback
    const safeEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? email.toLowerCase()
      : `no-reply+${Date.now()}@fixloapp.com`;

    // Create the lead
    const leadData = {
      name: name.trim(),
      email: safeEmail,
      phone: phone.trim(),
      address: formattedAddress,
      city: city?.trim() || '',
      state: state?.trim() || '',
      zip: zip?.trim() || '',
      trade: normalizedTrade,
      description: description.trim(),
      location: {
        type: 'Point',
        coordinates: coordinates
      },
      status: 'pending',
      // AI diagnosis metadata
      source: 'AI_DIAGNOSED',
      priority: priority,
      aiQualified: true,
      aiDiagnosis: {
        issue: aiDiagnosis.issue,
        difficulty: aiDiagnosis.difficulty,
        riskLevel: aiDiagnosis.riskLevel,
        diyAllowed: aiDiagnosis.diyAllowed,
        steps: aiDiagnosis.steps || [],
        stopConditions: aiDiagnosis.stopConditions || []
      },
      aiImages: images
    };

    // Add optional userId if provided
    if (userId) {
      leadData.customerId = userId;
    }

    const lead = await JobRequest.create(leadData);

    console.log('✅ AI-diagnosed lead created:', lead._id);

    return lead;
  } catch (error) {
    console.error('❌ Failed to create AI-diagnosed lead:', error.message);
    throw error;
  }
}

/**
 * Create a manual lead (existing pattern)
 * @param {Object} params - Lead parameters
 * @returns {Promise<Object>} Created lead
 */
async function createManualLead(params) {
  // This function maintains compatibility with existing lead creation
  // Can be used to refactor existing code in the future
  return JobRequest.create({
    ...params,
    source: 'MANUAL',
    aiQualified: false
  });
}

module.exports = {
  createAIDiagnosedLead,
  createManualLead
};
