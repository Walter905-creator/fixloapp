const axios = require('axios');

/**
 * Enhanced Geocoding utility to convert addresses/ZIP codes to coordinates
 * Uses multiple services for reliability with improved error handling and caching
 */
class GeocodingService {
  constructor() {
    this.services = {
      nominatim: 'https://nominatim.openstreetmap.org/search',
      // Add more services as needed for fallback
    };
    
    // Simple in-memory cache for server-side
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.lastApiCall = 0;
    this.apiCallDelay = 1000; // 1 second between API calls
    this.maxRetries = 3;
    
    // Start cache cleanup timer (every 10 minutes)
    this.cacheCleanupInterval = setInterval(() => {
      this.cleanExpiredCache();
    }, 10 * 60 * 1000);
  }

  /**
   * Get cached result if available and not expired
   */
  getCachedResult(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`🎯 Using cached geocoding result for: ${key}`);
      return cached.data;
    }
    return null;
  }

  /**
   * Cache a result with timestamp
   */
  setCacheResult(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Rate limiting for external API calls
   */
  async enforceRateLimit() {
    const timeSinceLastCall = Date.now() - this.lastApiCall;
    if (timeSinceLastCall < this.apiCallDelay) {
      const delay = this.apiCallDelay - timeSinceLastCall;
      console.log(`⏳ Rate limiting: waiting ${delay}ms before geocoding API call`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    this.lastApiCall = Date.now();
  }

  /**
   * Convert address/ZIP code to coordinates using OpenStreetMap Nominatim (free)
   * @param {string} location - Address or ZIP code
   * @returns {Promise<object>} - Geocoding result with coordinates, address, and confidence
   */
  async geocodeLocation(location) {
    const cacheKey = `geocode_${location.toLowerCase().trim()}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) return cached;

    await this.enforceRateLimit();

    let lastError;
    
    // Try multiple times with exponential backoff
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🗺️ Geocoding attempt ${attempt}/${this.maxRetries} for: "${location}"`);
        
        // Use OpenStreetMap Nominatim (free service)
        const response = await axios.get(this.services.nominatim, {
          params: {
            q: location,
            format: 'json',
            limit: 1,
            countrycodes: 'us', // Limit to US for now
            addressdetails: 1
          },
          timeout: 8000, // Increased timeout
          headers: {
            'User-Agent': 'Fixlo-App/1.0 (https://www.fixloapp.com)'
          }
        });

        if (response.data && response.data.length > 0) {
          const result = response.data[0];
          const longitude = parseFloat(result.lon);
          const latitude = parseFloat(result.lat);
          
          // Validate coordinates
          if (isNaN(longitude) || isNaN(latitude)) {
            throw new Error('Invalid coordinates returned from geocoding service');
          }
          
          const geocoded = {
            coordinates: [longitude, latitude],
            address: result.display_name,
            confidence: parseFloat(result.importance) || 0.5,
            addressDetails: result.address || {},
            boundingBox: result.boundingbox || null
          };
          
          console.log(`✅ Geocoded "${location}" to [${longitude}, ${latitude}] (confidence: ${geocoded.confidence})`);
          
          // Cache the successful result
          this.setCacheResult(cacheKey, geocoded);
          
          return geocoded;
        }
        
        throw new Error('No results found for location');
        
      } catch (error) {
        lastError = error;
        console.error(`❌ Geocoding attempt ${attempt} failed for "${location}":`, error.message);
        
        // If not the last attempt, wait before retrying
        if (attempt < this.maxRetries) {
          const backoffDelay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Waiting ${backoffDelay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }
    
    console.error(`❌ All geocoding attempts failed for "${location}". Using fallback.`);
    
    // Fallback to default coordinates (center of US) if geocoding fails
    return this.getDefaultCoordinates(location);
  }

  /**
   * Get default coordinates based on ZIP code patterns or return center of US
   * @param {string} location 
   * @returns {object}
   */
  getDefaultCoordinates(location) {
    // Enhanced ZIP code to region mapping
    const zipToRegion = {
      '0': [-71.0589, 42.3601], // New England (Boston area)
      '1': [-74.0059, 40.7128], // Northeast (NYC area)
      '2': [-77.0369, 38.9072], // Mid-Atlantic (DC area)
      '3': [-84.3880, 33.7490], // Southeast (Atlanta area)
      '4': [-86.7816, 36.1627], // South Central (Nashville area)
      '5': [-87.6298, 41.8781], // Great Lakes (Chicago area)
      '6': [-95.3698, 29.7604], // South Central (Houston area)
      '7': [-96.7970, 32.7767], // South Central (Dallas area)
      '8': [-104.9903, 39.7392], // Mountain (Denver area)
      '9': [-118.2437, 34.0522], // Pacific (LA area)
    };

    // Extract first digit from ZIP code or any number in the string
    const zipMatch = location.match(/\b(\d{5})\b/);
    let firstDigit = null;
    
    if (zipMatch) {
      firstDigit = zipMatch[1].charAt(0);
    } else {
      // Try to find any digit that might indicate a region
      const digitMatch = location.match(/\d/);
      if (digitMatch) {
        firstDigit = digitMatch[0];
      }
    }
    
    const defaultCoords = firstDigit && zipToRegion[firstDigit] 
      ? zipToRegion[firstDigit] 
      : [-98.5795, 39.8283]; // Geographic center of US
    
    console.log(`⚠️ Using default coordinates for "${location}": [${defaultCoords[0]}, ${defaultCoords[1]}]`);
    
    return {
      coordinates: defaultCoords,
      address: `${location}, United States`,
      confidence: 0.1, // Low confidence for fallback
      addressDetails: {
        country: 'United States',
        fallback: true
      },
      boundingBox: null
    };
  }

  /**
   * Calculate distance between two points in miles
   * @param {number[]} coord1 - [longitude, latitude]
   * @param {number[]} coord2 - [longitude, latitude]
   * @returns {number} - Distance in miles
   */
  calculateDistance(coord1, coord2) {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Validate coordinates
   * @param {number[]} coordinates - [longitude, latitude]
   * @returns {boolean}
   */
  validateCoordinates(coordinates) {
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      return false;
    }
    
    const [lon, lat] = coordinates;
    return (
      typeof lon === 'number' && 
      typeof lat === 'number' &&
      !isNaN(lon) && !isNaN(lat) &&
      lon >= -180 && lon <= 180 &&
      lat >= -90 && lat <= 90
    );
  }

  /**
   * Clear cache (useful for testing or maintenance)
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Geocoding cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp < this.cacheTimeout) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      cacheTimeout: this.cacheTimeout
    };
  }

  /**
   * Clean expired cache entries
   */
  cleanExpiredCache() {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.cacheTimeout) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 Removed ${removedCount} expired cache entries`);
    }

    return removedCount;
  }
}

module.exports = new GeocodingService();
