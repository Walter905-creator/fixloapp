# Geolocation Service Documentation

## Overview

The enhanced Geolocation Service provides a robust, consistent interface for handling location-based functionality across the Fixlo application. It addresses various issues with the previous implementation and provides better error handling, caching, and user experience.

## Key Improvements

### 🚀 Before vs After

**Before:**
- Inconsistent timeout values (5s, 10s, 15s)
- Direct external API calls without rate limiting
- No caching mechanism
- Inconsistent error handling
- Mixed user experience patterns

**After:**
- Standardized 10-second timeout across all operations
- Built-in rate limiting (1 second between API calls)
- 5-minute caching for geocoding results
- Consistent error handling with user-friendly messages
- Unified API interface

## Features

### 🔍 Browser Support Detection
```javascript
import geolocationService from '../utils/geolocationService';

// Check if geolocation is supported
if (geolocationService.isGeolocationSupported()) {
    // Geolocation is available
}

// Check if running on secure context (HTTPS)
if (geolocationService.isSecureContext()) {
    // HTTPS or localhost - geolocation will work reliably
}
```

### 📍 Get Current Position
```javascript
try {
    const position = await geolocationService.getCurrentPosition();
    console.log(`Lat: ${position.latitude}, Lon: ${position.longitude}`);
    console.log(`Accuracy: ±${position.accuracy} meters`);
} catch (error) {
    const userMessage = geolocationService.getErrorMessage(error);
    alert(userMessage); // User-friendly error message
}
```

### 🗺️ Geocoding (Address ↔ Coordinates)
```javascript
// Forward geocoding (address to coordinates)
try {
    const result = await geolocationService.geocodeAddress('10001');
    console.log('Coordinates:', result.coordinates);
    console.log('Full address:', result.formattedAddress);
    console.log('Confidence:', result.confidence);
} catch (error) {
    console.error('Geocoding failed:', error.message);
}

// Reverse geocoding (coordinates to address)
try {
    const result = await geolocationService.reverseGeocode(40.7128, -74.006);
    console.log('Address:', result.formattedAddress);
    console.log('Address details:', result.address);
} catch (error) {
    console.error('Reverse geocoding failed:', error.message);
}
```

### 🎯 Complete Location with Address
```javascript
try {
    const location = await geolocationService.getCurrentLocationWithAddress();
    console.log('Position:', location.position);
    console.log('Address:', location.address);
    console.log('Coordinates:', location.coordinates); // [lon, lat] format
    console.log('Accuracy:', location.accuracy);
} catch (error) {
    const userMessage = geolocationService.getErrorMessage(error);
    // Handle error appropriately
}
```

### 📊 Distance Calculation
```javascript
const nyc = [-74.006, 40.7128];
const philly = [-75.1652, 39.9526];

const distance = geolocationService.calculateDistance(nyc, philly);
console.log(`Distance: ${distance.toFixed(1)} miles`);
```

### 🗃️ Cache Management
```javascript
// Get cache statistics
const stats = geolocationService.getCacheStats();
console.log(`Cache entries: ${stats.validEntries}/${stats.totalEntries}`);

// Clear cache if needed
geolocationService.clearCache();
```

## Configuration

The service uses these default settings:

```javascript
{
  timeout: 10000,           // 10 seconds
  maximumAge: 5 * 60 * 1000, // 5 minutes
  enableHighAccuracy: true,
  userAgent: 'Fixlo-App/1.0 (https://www.fixloapp.com)',
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  apiCallDelay: 1000        // 1 second between API calls
}
```

## Error Handling

The service provides consistent error handling with user-friendly messages:

| Error Code | User Message |
|------------|--------------|
| `GEOLOCATION_NOT_SUPPORTED` | "Your browser doesn't support location services. Please enter your address manually." |
| `PERMISSION_DENIED` | "Location access was denied. Please enter your address manually or enable location permissions." |
| `POSITION_UNAVAILABLE` | "Your location is currently unavailable. Please enter your address manually." |
| `TIMEOUT` | "Location request timed out. Please enter your address manually." |
| `UNKNOWN_ERROR` | "An error occurred while getting your location. Please enter your address manually." |

## React Component Integration

### Service Request Modal (Updated)
```javascript
import geolocationService from '../utils/geolocationService';

const getCurrentLocation = async () => {
  setGettingLocation(true);
  setLocationError(null);
  
  try {
    const result = await geolocationService.getCurrentLocationWithAddress();
    const address = result.addressDetails;
    const formattedAddress = `${address.house_number || ''} ${address.road || ''}, ${address.city || address.town || ''}, ${address.state || ''} ${address.postcode || ''}`.trim();
    
    setForm({ ...form, address: formattedAddress });
  } catch (error) {
    const message = geolocationService.getErrorMessage(error);
    setLocationError(message);
    alert(message);
  } finally {
    setGettingLocation(false);
  }
};
```

### Dynamic Landing Page (Updated)
```javascript
import geolocationService from '../utils/geolocationService';

useEffect(() => {
  if (!city && geolocationService.isGeolocationSupported()) {
    const detectLocation = async () => {
      try {
        const result = await geolocationService.getCurrentLocationWithAddress();
        const locationName = result.addressDetails.city || 
                            result.addressDetails.town || 
                            'your area';
        setDetectedCity(locationName);
      } catch (error) {
        console.log('Location detection failed (non-critical):', error.message);
        // Keep default "your area" - this is not critical for landing page
      }
    };

    detectLocation();
  }
}, [city]);
```

## Testing

Run the comprehensive test suite:
```bash
cd client
npm test -- --testPathPattern=geolocationService.test.js
```

### Manual Testing
Open `/client/public/test-geolocation.html` in a browser to manually test all functionality:

1. Browser support detection
2. Current position retrieval
3. Address geocoding
4. Cache management
5. Error handling

## Server-Side Improvements

The server-side geocoding service has also been enhanced:

### Enhanced Features
- **Retry logic** with exponential backoff (up to 3 attempts)
- **Rate limiting** (1 second between API calls)
- **Caching** with automatic cleanup
- **Improved fallback** coordinates based on ZIP code patterns
- **Better error handling** and logging

### Cache Statistics API
```javascript
// Get server-side cache stats
const stats = geocodingService.getCacheStats();
console.log('Server cache:', stats);

// Clean expired entries
const removed = geocodingService.cleanExpiredCache();
console.log(`Removed ${removed} expired entries`);
```

## Performance Benefits

### Reduced API Calls
- **Client-side caching**: Repeated location requests use cached results
- **Rate limiting**: Prevents API abuse and rate limit violations
- **Server-side caching**: Geocoding results cached for 5 minutes

### Improved User Experience
- **Consistent timeouts**: All operations use 10-second timeout
- **Better error messages**: User-friendly error descriptions
- **Loading states**: Clear feedback during location operations
- **Fallback handling**: Graceful degradation when location unavailable

### Reliability Improvements
- **Retry logic**: Server-side geocoding retries failed requests
- **Fallback coordinates**: Default locations based on ZIP code patterns
- **HTTPS detection**: Warns users about non-secure contexts
- **Coordinate validation**: Prevents invalid coordinate data

## Migration Guide

### From Old Implementation
1. Replace direct `navigator.geolocation` calls with `geolocationService.getCurrentPosition()`
2. Replace direct Nominatim API calls with `geolocationService.geocodeAddress()` or `geolocationService.reverseGeocode()`
3. Update error handling to use `geolocationService.getErrorMessage()`
4. Remove manual timeout and retry logic (now handled automatically)

### Example Migration
```javascript
// OLD CODE ❌
navigator.geolocation.getCurrentPosition(
  async (position) => {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?...`);
    // Manual error handling, no caching, inconsistent timeout
  },
  (error) => {
    // Manual error message creation
  },
  { timeout: 5000 } // Inconsistent timeout
);

// NEW CODE ✅
try {
  const result = await geolocationService.getCurrentLocationWithAddress();
  // Automatic caching, consistent timeout, better error handling
  setAddress(result.address);
} catch (error) {
  const message = geolocationService.getErrorMessage(error);
  alert(message);
}
```

## Browser Compatibility

| Browser | Geolocation Support | HTTPS Requirement |
|---------|-------------------|-------------------|
| Chrome 50+ | ✅ | ✅ (HTTP blocked) |
| Firefox 55+ | ✅ | ⚠️ (HTTP deprecated) |
| Safari 10+ | ✅ | ✅ (HTTP blocked) |
| Edge 12+ | ✅ | ✅ (HTTP blocked) |

**Note**: Modern browsers require HTTPS for geolocation APIs. The service detects this and provides appropriate warnings.

## Troubleshooting

### Common Issues

1. **"Location request timed out"**
   - User is in an area with poor GPS signal
   - Solution: Fallback to manual address entry

2. **"Location access denied"**
   - User denied permission
   - Solution: Show manual address input with explanation

3. **"Geolocation not supported"**
   - Old browser or disabled feature
   - Solution: Hide location button, show manual input only

4. **Geocoding fails**
   - API rate limits or network issues
   - Solution: Use fallback coordinates or ask for manual input

### Debug Mode
Enable debug logging by opening browser dev tools - the service logs all operations with detailed information.

## Future Enhancements

- [ ] Add alternative geocoding services for fallback
- [ ] Implement offline support with cached results
- [ ] Add location accuracy confidence scoring
- [ ] Support for multiple coordinate systems
- [ ] Background location tracking for repeated visits