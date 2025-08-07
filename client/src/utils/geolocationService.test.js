/**
 * Test suite for Geolocation Service
 * Tests various scenarios including error handling and caching
 */

import geolocationService from '../utils/geolocationService';

describe('GeolocationService', () => {
  beforeEach(() => {
    // Clear cache before each test
    geolocationService.clearCache();
    
    // Mock console methods to reduce noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    console.log.mockRestore();
    console.warn.mockRestore();
    console.error.mockRestore();
  });

  describe('Browser Support Detection', () => {
    test('should detect geolocation support correctly', () => {
      // Mock geolocation support
      const mockGeolocation = {
        getCurrentPosition: jest.fn()
      };
      
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true
      });

      expect(geolocationService.isGeolocationSupported()).toBe(true);
    });

    test('should detect when geolocation is not supported', () => {
      // Completely remove navigator.geolocation
      delete global.navigator.geolocation;
      expect(geolocationService.isGeolocationSupported()).toBe(false);
    });

    test('should detect secure context correctly', () => {
      // Mock HTTPS
      Object.defineProperty(global, 'location', {
        value: { protocol: 'https:', hostname: 'example.com' },
        configurable: true
      });
      expect(geolocationService.isSecureContext()).toBe(true);

      // Mock HTTP with localhost (should still be secure)
      Object.defineProperty(global, 'location', {
        value: { protocol: 'http:', hostname: 'localhost' },
        configurable: true
      });
      expect(geolocationService.isSecureContext()).toBe(true);

      // Mock HTTP with non-localhost (not secure)
      Object.defineProperty(global, 'location', {
        value: { protocol: 'http:', hostname: 'example.com' },
        configurable: true
      });
      expect(geolocationService.isSecureContext()).toBe(false);
    });
  });

  describe('Permission Checking', () => {
    test('should return unsupported when geolocation is not available', async () => {
      delete global.navigator.geolocation;
      const status = await geolocationService.checkPermissionStatus();
      expect(status).toBe('unsupported');
    });

    test('should return permission status when permissions API is available', async () => {
      // Mock geolocation support
      const mockGeolocation = {
        getCurrentPosition: jest.fn()
      };
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true
      });

      // Mock permissions API
      const mockPermissions = {
        query: jest.fn().mockResolvedValue({ state: 'granted' })
      };
      Object.defineProperty(global.navigator, 'permissions', {
        value: mockPermissions,
        configurable: true
      });

      const status = await geolocationService.checkPermissionStatus();
      expect(status).toBe('granted');
      expect(mockPermissions.query).toHaveBeenCalledWith({ name: 'geolocation' });
    });

    test('should return prompt when permissions API is not available', async () => {
      // Mock geolocation support
      const mockGeolocation = {
        getCurrentPosition: jest.fn()
      };
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true
      });

      // Remove permissions API
      delete global.navigator.permissions;

      const status = await geolocationService.checkPermissionStatus();
      expect(status).toBe('prompt');
    });

    test('should return false for shouldRequestLocation when denied', async () => {
      // Mock permissions API returning denied
      const mockPermissions = {
        query: jest.fn().mockResolvedValue({ state: 'denied' })
      };
      Object.defineProperty(global.navigator, 'permissions', {
        value: mockPermissions,
        configurable: true
      });

      const shouldRequest = await geolocationService.shouldRequestLocation();
      expect(shouldRequest).toBe(false);
    });

    test('should return true for shouldRequestLocation when granted', async () => {
      // Mock permissions API returning granted
      const mockPermissions = {
        query: jest.fn().mockResolvedValue({ state: 'granted' })
      };
      Object.defineProperty(global.navigator, 'permissions', {
        value: mockPermissions,
        configurable: true
      });

      const shouldRequest = await geolocationService.shouldRequestLocation();
      expect(shouldRequest).toBe(true);
    });
  });

  describe('Coordinate Validation', () => {
    test('should validate valid coordinates', () => {
      expect(geolocationService.validateCoordinates([-74.006, 40.7128])).toBe(true);
      expect(geolocationService.validateCoordinates([0, 0])).toBe(true);
      expect(geolocationService.validateCoordinates([-180, -90])).toBe(true);
      expect(geolocationService.validateCoordinates([180, 90])).toBe(true);
    });

    test('should reject invalid coordinates', () => {
      expect(geolocationService.validateCoordinates([-181, 40])).toBe(false);
      expect(geolocationService.validateCoordinates([74, 91])).toBe(false);
      expect(geolocationService.validateCoordinates([74])).toBe(false);
      expect(geolocationService.validateCoordinates('invalid')).toBe(false);
      expect(geolocationService.validateCoordinates(null)).toBe(false);
    });
  });

  describe('Distance Calculation', () => {
    test('should calculate distance between two points correctly', () => {
      // Distance between NYC and Philadelphia (approximately 80 miles)
      const nyc = [-74.006, 40.7128];
      const philly = [-75.1652, 39.9526];
      
      const distance = geolocationService.calculateDistance(nyc, philly);
      expect(distance).toBeCloseTo(80, -1); // Within 10 miles accuracy
    });

    test('should return 0 for same coordinates', () => {
      const coords = [-74.006, 40.7128];
      const distance = geolocationService.calculateDistance(coords, coords);
      expect(distance).toBeCloseTo(0, 2);
    });
  });

  describe('Error Message Generation', () => {
    test('should return appropriate error messages', () => {
      const tests = [
        { error: 'PERMISSION_DENIED', expected: 'Location access was denied' },
        { error: 'TIMEOUT', expected: 'Location request timed out' },
        { error: 'UNKNOWN_ERROR', expected: 'An error occurred while getting your location' },
        { error: 'INVALID_ERROR', expected: 'An error occurred while getting your location' }
      ];

      tests.forEach(({ error, expected }) => {
        const message = geolocationService.getErrorMessage({ message: error });
        expect(message).toContain(expected);
      });
    });
  });

  describe('Caching Functionality', () => {
    test('should cache and retrieve results correctly', () => {
      const testData = { test: 'data' };
      const cacheKey = 'test_key';
      
      geolocationService.setCacheResult(cacheKey, testData);
      const cached = geolocationService.getCachedResult(cacheKey);
      
      expect(cached).toEqual(testData);
    });

    test('should return null for expired cache entries', (done) => {
      const testData = { test: 'data' };
      const cacheKey = 'test_key';
      
      // Temporarily reduce cache timeout for testing
      const originalTimeout = geolocationService.cacheTimeout;
      geolocationService.cacheTimeout = 100; // 100ms
      
      geolocationService.setCacheResult(cacheKey, testData);
      
      setTimeout(() => {
        const cached = geolocationService.getCachedResult(cacheKey);
        expect(cached).toBeNull();
        
        // Restore original timeout
        geolocationService.cacheTimeout = originalTimeout;
        done();
      }, 150);
    });

    test('should clear cache correctly', () => {
      geolocationService.setCacheResult('key1', { data: 1 });
      geolocationService.setCacheResult('key2', { data: 2 });
      
      expect(geolocationService.getCachedResult('key1')).toBeTruthy();
      expect(geolocationService.getCachedResult('key2')).toBeTruthy();
      
      geolocationService.clearCache();
      
      expect(geolocationService.getCachedResult('key1')).toBeNull();
      expect(geolocationService.getCachedResult('key2')).toBeNull();
    });

    test('should provide accurate cache statistics', () => {
      geolocationService.clearCache();
      
      geolocationService.setCacheResult('key1', { data: 1 });
      geolocationService.setCacheResult('key2', { data: 2 });
      
      const stats = geolocationService.getCacheStats();
      
      expect(stats.totalEntries).toBe(2);
      expect(stats.validEntries).toBe(2);
      expect(stats.expiredEntries).toBe(0);
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limiting', async () => {
      const startTime = Date.now();
      
      // Set a shorter delay for testing
      const originalDelay = geolocationService.apiCallDelay;
      geolocationService.apiCallDelay = 100; // 100ms
      
      await geolocationService.enforceRateLimit();
      await geolocationService.enforceRateLimit();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should have waited at least the rate limit delay
      expect(duration).toBeGreaterThanOrEqual(90); // Allow for timing variations
      
      // Restore original delay
      geolocationService.apiCallDelay = originalDelay;
    });
  });

  describe('getCurrentPosition', () => {
    test('should reject when geolocation is not supported', async () => {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        configurable: true
      });
      
      await expect(geolocationService.getCurrentPosition()).rejects.toThrow('GEOLOCATION_NOT_SUPPORTED');
    });

    test('should resolve with position data when successful', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10
        },
        timestamp: Date.now()
      };

      const mockGeolocation = {
        getCurrentPosition: jest.fn((success) => {
          success(mockPosition);
        })
      };

      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true
      });

      const result = await geolocationService.getCurrentPosition();
      
      expect(result.latitude).toBe(40.7128);
      expect(result.longitude).toBe(-74.006);
      expect(result.accuracy).toBe(10);
    });

    test('should handle geolocation errors correctly', async () => {
      const mockError = {
        code: 1, // PERMISSION_DENIED
        message: 'User denied geolocation'
      };

      const mockGeolocation = {
        getCurrentPosition: jest.fn((success, error) => {
          error(mockError);
        })
      };

      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true
      });

      await expect(geolocationService.getCurrentPosition()).rejects.toThrow('PERMISSION_DENIED');
    });
  });

  describe('Geocoding Functions', () => {
    beforeEach(() => {
      // Mock fetch for geocoding tests
      global.fetch = jest.fn();
    });

    afterEach(() => {
      global.fetch.mockRestore();
    });

    test('should handle successful reverse geocoding', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          display_name: 'Test Address, Test City, Test State',
          address: {
            house_number: '123',
            road: 'Test Street',
            city: 'Test City',
            state: 'Test State',
            postcode: '12345'
          },
          lon: '-74.006',
          lat: '40.7128',
          importance: 0.8
        })
      };

      global.fetch.mockResolvedValue(mockResponse);

      const result = await geolocationService.reverseGeocode(40.7128, -74.006);
      
      expect(result.formattedAddress).toBe('Test Address, Test City, Test State');
      expect(result.coordinates).toEqual([-74.006, 40.7128]);
      expect(result.confidence).toBe(0.8);
    });

    test('should handle geocoding API errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await expect(geolocationService.reverseGeocode(40.7128, -74.006))
        .rejects.toThrow('Network error');
    });

    test('should handle successful forward geocoding', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([{
          display_name: 'Test Address, Test City, Test State',
          address: {
            house_number: '123',
            road: 'Test Street',
            city: 'Test City',
            state: 'Test State',
            postcode: '12345'
          },
          lon: '-74.006',
          lat: '40.7128',
          importance: 0.8,
          boundingbox: ['40.7', '40.72', '-74.01', '-74.0']
        }])
      };

      global.fetch.mockResolvedValue(mockResponse);

      const result = await geolocationService.geocodeAddress('123 Test Street, Test City, Test State');
      
      expect(result.formattedAddress).toBe('Test Address, Test City, Test State');
      expect(result.coordinates).toEqual([-74.006, 40.7128]);
      expect(result.boundingBox).toEqual(['40.7', '40.72', '-74.01', '-74.0']);
    });

    test('should use cached results for repeated requests', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          display_name: 'Test Address',
          address: { city: 'Test City' },
          lon: '-74.006',
          lat: '40.7128',
          importance: 0.8
        })
      };

      global.fetch.mockResolvedValue(mockResponse);

      // First call should hit the API
      await geolocationService.reverseGeocode(40.7128, -74.006);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await geolocationService.reverseGeocode(40.7128, -74.006);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still only 1 call
    });
  });
});

// Note: The GeolocationService class is exported as default from the main file
// This test file validates its functionality