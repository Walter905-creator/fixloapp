/**
 * Unified Geolocation Service for Fixlo App
 * Handles browser geolocation, geocoding, and error management
 * Includes caching, rate limiting, and consistent error handling
 */

class GeolocationService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.lastApiCall = 0;
    this.apiCallDelay = 1000; // 1 second between API calls
    this.maxRetries = 3;
    
    // Standard configuration
    this.config = {
      timeout: 10000, // 10 seconds
      maximumAge: 5 * 60 * 1000, // 5 minutes
      enableHighAccuracy: true,
      userAgent: 'Fixlo-App/1.0 (https://www.fixloapp.com)'
    };
  }

  /**
   * Check if geolocation is supported and available
   */
  isGeolocationSupported() {
    return (
      'geolocation' in navigator &&
      navigator.geolocation &&
      typeof navigator.geolocation.getCurrentPosition === 'function'
    );
  }

  /**
   * Check current geolocation permission status
   * Returns 'granted', 'denied', 'prompt', or 'unsupported'
   */
  async checkPermissionStatus() {
    if (!this.isGeolocationSupported()) {
      return 'unsupported';
    }

    // Check if permissions API is available
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        return permission.state; // 'granted', 'denied', or 'prompt'
      } catch (error) {
        console.log('📍 Permissions API not available, will check on request');
      }
    }

    // Fallback: can't determine without making a request
    return 'prompt';
  }

  /**
   * Check if we should request geolocation (not denied)
   */
  async shouldRequestLocation() {
    const status = await this.checkPermissionStatus();
    return status !== 'denied' && status !== 'unsupported';
  }

  /**
   * Check if we're running on HTTPS (required for geolocation in many browsers)
   */
  isSecureContext() {
    return location.protocol === 'https:' || location.hostname === 'localhost';
  }

  /**
   * Get cached result if available and not expired
   */
  getCachedResult(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`🎯 Using cached geolocation result for: ${key}`);
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
      console.log(`⏳ Rate limiting: waiting ${delay}ms before API call`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    this.lastApiCall = Date.now();
  }

  /**
   * Get current position using browser geolocation API
   */
  async getCurrentPosition(options = {}) {
    if (!this.isGeolocationSupported()) {
      throw new Error('GEOLOCATION_NOT_SUPPORTED');
    }

    if (!this.isSecureContext()) {
      console.warn('⚠️ Geolocation may not work on non-HTTPS connections');
    }

    const config = { ...this.config, ...options };

    return new Promise((resolve, reject) => {
      console.log('📍 Requesting current position...');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const result = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          
          console.log(`✅ Position obtained: ${result.latitude}, ${result.longitude} (±${result.accuracy}m)`);
          resolve(result);
        },
        (error) => {
          console.error('❌ Geolocation error:', error);
          
          let errorMessage;
          switch (error.code) {
            case 1: // PERMISSION_DENIED
              errorMessage = 'PERMISSION_DENIED';
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage = 'POSITION_UNAVAILABLE';
              break;
            case 3: // TIMEOUT
              errorMessage = 'TIMEOUT';
              break;
            default:
              errorMessage = 'UNKNOWN_ERROR';
          }
          
          reject(new Error(errorMessage));
        },
        config
      );
    });
  }

  /**
   * Reverse geocoding - convert coordinates to address
   */
  async reverseGeocode(latitude, longitude, options = {}) {
    const cacheKey = `reverse_${latitude}_${longitude}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) return cached;

    await this.enforceRateLimit();

    try {
      console.log(`🗺️ Reverse geocoding: ${latitude}, ${longitude}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`,
        {
          headers: {
            'User-Agent': this.config.userAgent
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.address) {
        throw new Error('No address data returned');
      }
      
      const result = {
        formattedAddress: data.display_name,
        address: data.address,
        coordinates: [parseFloat(data.lon), parseFloat(data.lat)],
        confidence: parseFloat(data.importance) || 0.5
      };
      
      this.setCacheResult(cacheKey, result);
      console.log(`✅ Reverse geocoding successful: ${result.formattedAddress}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Reverse geocoding failed:', error.message);
      throw error;
    }
  }

  /**
   * Forward geocoding - convert address to coordinates
   */
  async geocodeAddress(address, options = {}) {
    const cacheKey = `forward_${address.toLowerCase().trim()}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) return cached;

    await this.enforceRateLimit();

    try {
      console.log(`🗺️ Geocoding address: ${address}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=us&addressdetails=1`,
        {
          headers: {
            'User-Agent': this.config.userAgent
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error('No results found for address');
      }
      
      const result = data[0];
      const geocoded = {
        formattedAddress: result.display_name,
        address: result.address,
        coordinates: [parseFloat(result.lon), parseFloat(result.lat)],
        confidence: parseFloat(result.importance) || 0.5,
        boundingBox: result.boundingbox
      };
      
      this.setCacheResult(cacheKey, geocoded);
      console.log(`✅ Geocoding successful: ${geocoded.formattedAddress}`);
      
      return geocoded;
      
    } catch (error) {
      console.error('❌ Geocoding failed:', error.message);
      throw error;
    }
  }

  /**
   * Get current location and convert to address
   */
  async getCurrentLocationWithAddress(options = {}) {
    try {
      const position = await this.getCurrentPosition(options);
      const address = await this.reverseGeocode(position.latitude, position.longitude);
      
      return {
        position,
        address: address.formattedAddress,
        addressDetails: address.address,
        coordinates: [position.longitude, position.latitude],
        accuracy: position.accuracy,
        confidence: address.confidence
      };
      
    } catch (error) {
      console.error('❌ Failed to get current location with address:', error.message);
      throw error;
    }
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error) {
    const errorMessages = {
      'GEOLOCATION_NOT_SUPPORTED': 'Your browser doesn\'t support location services. Please enter your address manually.',
      'PERMISSION_DENIED': 'Location access was denied. Please enter your address manually or enable location permissions.',
      'POSITION_UNAVAILABLE': 'Your location is currently unavailable. Please enter your address manually.',
      'TIMEOUT': 'Location request timed out. Please enter your address manually.',
      'UNKNOWN_ERROR': 'An error occurred while getting your location. Please enter your address manually.',
      'HTTPS_REQUIRED': 'Location services require a secure connection. Please enter your address manually.'
    };

    const errorType = error.message || error;
    return errorMessages[errorType] || errorMessages['UNKNOWN_ERROR'];
  }

  /**
   * Validate coordinates
   */
  validateCoordinates(coordinates) {
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      return false;
    }
    
    const [lon, lat] = coordinates;
    return (
      typeof lon === 'number' && 
      typeof lat === 'number' &&
      lon >= -180 && lon <= 180 &&
      lat >= -90 && lat <= 90
    );
  }

  /**
   * Calculate distance between two points (Haversine formula)
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
   * Clear cache (useful for testing or when user wants fresh data)
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Geolocation cache cleared');
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
}

// Create and export singleton instance
const geolocationService = new GeolocationService();
export default geolocationService;