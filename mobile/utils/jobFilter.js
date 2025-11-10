/**
 * Job Filter Utility
 * Handles filtering jobs by trade, location, and distance
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const FILTER_PREFERENCES_KEY = '@fixlo_job_filter_preferences';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in miles
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Get user's current location
 */
export async function getCurrentLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('⚠️ Location permission not granted');
      return null;
    }
    
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('❌ Error getting location:', error);
    return null;
  }
}

/**
 * Filter jobs based on criteria
 * @param {Array} jobs - Array of job objects
 * @param {Object} filters - Filter criteria
 * @param {Array} filters.trades - Selected trades
 * @param {number} filters.maxDistance - Maximum distance in miles
 * @param {Object} filters.userLocation - User's location {latitude, longitude}
 * @param {string} filters.city - City filter
 * @param {string} filters.state - State filter
 * @param {string} filters.zipCode - ZIP code filter
 * @returns {Array} Filtered jobs
 */
export function filterJobs(jobs, filters) {
  if (!jobs || jobs.length === 0) {
    return [];
  }
  
  let filtered = [...jobs];
  
  // Filter by trade
  if (filters.trades && filters.trades.length > 0) {
    filtered = filtered.filter(job => 
      filters.trades.some(trade => 
        job.trade?.toLowerCase().includes(trade.toLowerCase())
      )
    );
  }
  
  // Filter by city
  if (filters.city) {
    filtered = filtered.filter(job => 
      job.city?.toLowerCase().includes(filters.city.toLowerCase())
    );
  }
  
  // Filter by state
  if (filters.state) {
    filtered = filtered.filter(job => 
      job.state?.toLowerCase() === filters.state.toLowerCase()
    );
  }
  
  // Filter by ZIP code
  if (filters.zipCode) {
    filtered = filtered.filter(job => 
      job.zipCode?.includes(filters.zipCode)
    );
  }
  
  // Filter by distance
  if (filters.maxDistance && filters.userLocation) {
    filtered = filtered.filter(job => {
      if (!job.latitude || !job.longitude) {
        return false; // Exclude jobs without coordinates
      }
      
      const distance = calculateDistance(
        filters.userLocation.latitude,
        filters.userLocation.longitude,
        job.latitude,
        job.longitude
      );
      
      return distance <= filters.maxDistance;
    });
    
    // Sort by distance (closest first)
    filtered.sort((a, b) => {
      const distA = calculateDistance(
        filters.userLocation.latitude,
        filters.userLocation.longitude,
        a.latitude,
        a.longitude
      );
      const distB = calculateDistance(
        filters.userLocation.latitude,
        filters.userLocation.longitude,
        b.latitude,
        b.longitude
      );
      return distA - distB;
    });
  }
  
  return filtered;
}

/**
 * Save filter preferences
 */
export async function saveFilterPreferences(preferences) {
  try {
    await AsyncStorage.setItem(FILTER_PREFERENCES_KEY, JSON.stringify(preferences));
    console.log('✅ Filter preferences saved');
    return true;
  } catch (error) {
    console.error('❌ Error saving filter preferences:', error);
    return false;
  }
}

/**
 * Load filter preferences
 */
export async function loadFilterPreferences() {
  try {
    const data = await AsyncStorage.getItem(FILTER_PREFERENCES_KEY);
    if (data) {
      const preferences = JSON.parse(data);
      console.log('✅ Filter preferences loaded');
      return preferences;
    }
    return null;
  } catch (error) {
    console.error('❌ Error loading filter preferences:', error);
    return null;
  }
}

/**
 * Clear filter preferences
 */
export async function clearFilterPreferences() {
  try {
    await AsyncStorage.removeItem(FILTER_PREFERENCES_KEY);
    console.log('✅ Filter preferences cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing filter preferences:', error);
    return false;
  }
}

/**
 * Common trade categories
 */
export const TRADE_CATEGORIES = [
  'General Contractor',
  'Plumbing',
  'Electrical',
  'HVAC',
  'Roofing',
  'Carpentry',
  'Painting',
  'Flooring',
  'Landscaping',
  'Masonry',
  'Drywall',
  'Tile Work',
  'Concrete',
  'Fencing',
  'Windows & Doors',
  'Handyman',
  'Other',
];

/**
 * Distance options for filtering
 */
export const DISTANCE_OPTIONS = [
  { label: '5 miles', value: 5 },
  { label: '10 miles', value: 10 },
  { label: '25 miles', value: 25 },
  { label: '50 miles', value: 50 },
  { label: '100 miles', value: 100 },
  { label: 'Any distance', value: null },
];

export default {
  calculateDistance,
  getCurrentLocation,
  filterJobs,
  saveFilterPreferences,
  loadFilterPreferences,
  clearFilterPreferences,
  TRADE_CATEGORIES,
  DISTANCE_OPTIONS,
};
