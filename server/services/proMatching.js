/**
 * Professional Matching Service
 * Handles matching homeowners with qualified professionals based on various criteria
 */

const Pro = require('../models/Pro');

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} Distance in miles
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Match professionals based on criteria
 * @param {Object} params - Matching parameters
 * @param {string} params.trade - Trade skill required
 * @param {Array<number>} params.coordinates - [longitude, latitude]
 * @param {number} params.maxDistance - Max distance in miles (default: 30)
 * @param {boolean} params.prioritizeAIPlus - Prioritize AI+ subscribers (default: false)
 * @returns {Promise<Array<Object>>} Array of matched pros with distance and scoring
 */
async function matchPros({ trade, coordinates, maxDistance = 30, prioritizeAIPlus = false }) {
  try {
    if (!trade || !coordinates || coordinates.length !== 2) {
      throw new Error('Trade and valid coordinates are required for matching');
    }

    const [longitude, latitude] = coordinates;
    const maxDistanceMeters = maxDistance * 1609.34; // Convert miles to meters

    console.log(`🔍 Matching pros: trade=${trade}, location=[${longitude}, ${latitude}], maxDistance=${maxDistance}mi`);

    // Query pros with geospatial filtering
    const pros = await Pro.find({
      trade: trade.toLowerCase().trim(),
      isActive: true,
      wantsNotifications: true,
      subscriptionStatus: { $ne: 'paused' },
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistanceMeters
        }
      }
    })
      .select('_id name email phone location rating avgRating reviewCount completedJobs subscriptionTier isVerified')
      .limit(100); // Safety cap

    console.log(`✅ Found ${pros.length} pros within ${maxDistance} miles`);

    // Calculate distance and internal scoring for each pro
    const prosWithMetadata = pros.map(pro => {
      const proLng = pro.location.coordinates[0];
      const proLat = pro.location.coordinates[1];
      const distance = calculateDistance(latitude, longitude, proLat, proLng);

      // Internal scoring (NOT exposed to client)
      // Factors: subscription tier, rating, completed jobs, verification status, distance
      let score = 0;

      // Subscription tier scoring
      if (pro.subscriptionTier === 'ai_plus') {
        score += 100;
      } else if (pro.subscriptionTier === 'pro') {
        score += 50;
      } else {
        score += 10;
      }

      // Rating scoring (0-50 points)
      const rating = pro.avgRating || pro.rating || 0;
      score += rating * 10;

      // Experience scoring (0-30 points)
      const jobsCompleted = Math.min(pro.completedJobs || 0, 30);
      score += jobsCompleted;

      // Verification bonus (20 points)
      if (pro.isVerified) {
        score += 20;
      }

      // Distance penalty (closer is better, max -30 points)
      score -= Math.min(distance, 30);

      return {
        pro,
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        score,
        rating: rating
      };
    });

    // Sort by score (highest first)
    prosWithMetadata.sort((a, b) => b.score - a.score);

    // If prioritizeAIPlus is true, ensure AI+ subscribers are at the top
    if (prioritizeAIPlus) {
      prosWithMetadata.sort((a, b) => {
        const tierOrder = { ai_plus: 3, pro: 2, free: 1 };
        const tierA = tierOrder[a.pro.subscriptionTier] || 0;
        const tierB = tierOrder[b.pro.subscriptionTier] || 0;
        
        if (tierA !== tierB) {
          return tierB - tierA; // Higher tier first
        }
        
        return b.score - a.score; // Then by score
      });
    }

    console.log(`🎯 Matched and scored ${prosWithMetadata.length} professionals`);

    return prosWithMetadata;
  } catch (error) {
    console.error('❌ Pro matching error:', error.message);
    throw error;
  }
}

/**
 * Format matched pros for client response (safe data only)
 * @param {Array<Object>} matchedPros - Array of matched pros with metadata
 * @param {number} limit - Max number of pros to return
 * @returns {Array<Object>} Client-safe pro data
 */
function formatProsForClient(matchedPros, limit = 10) {
  return matchedPros.slice(0, limit).map(({ pro, distance, rating }) => ({
    id: pro._id.toString(),
    name: pro.name,
    distance: distance,
    rating: rating,
    reviewCount: pro.reviewCount || 0,
    completedJobs: pro.completedJobs || 0,
    isVerified: pro.isVerified || false,
    // Availability can be calculated based on business logic
    availability: 'Available' // Placeholder - can be enhanced with real availability logic
  }));
}

module.exports = {
  matchPros,
  formatProsForClient,
  calculateDistance
};
