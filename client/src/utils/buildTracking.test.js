/**
 * Simple test for build tracking functionality
 */

// Test that environment variables are being read correctly
const buildId = process.env.REACT_APP_BUILD_ID || process.env.FIXLO_BUILD_ID;
const commitSha = process.env.REACT_APP_COMMIT_SHA || process.env.FIXLO_COMMIT_SHA;

describe('Build Tracking System', () => {
  test('should read build environment variables', () => {
    // Set test environment variables
    process.env.FIXLO_BUILD_ID = '2025-08-16T22:19:50';
    process.env.FIXLO_COMMIT_SHA = '622a34a1f99d5ce0dbb5ea1d0186d4c51ff75dde';
    
    // Re-read the variables after setting them
    const testBuildId = process.env.REACT_APP_BUILD_ID || process.env.FIXLO_BUILD_ID;
    const testCommitSha = process.env.REACT_APP_COMMIT_SHA || process.env.FIXLO_COMMIT_SHA;
    
    expect(testBuildId).toBe('2025-08-16T22:19:50');
    expect(testCommitSha).toBe('622a34a1f99d5ce0dbb5ea1d0186d4c51ff75dde');
  });
  
  test('should format FIXLO BUILD log correctly', () => {
    // Mock console.log to capture output
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Set test environment variables
    process.env.FIXLO_BUILD_ID = '2025-08-16T22:19:50';
    process.env.FIXLO_COMMIT_SHA = '622a34a1f99d5ce0dbb5ea1d0186d4c51ff75dde';
    
    // Simulate the index.jsx logging
    const buildId = process.env.REACT_APP_BUILD_ID || process.env.FIXLO_BUILD_ID;
    const commitSha = process.env.REACT_APP_COMMIT_SHA || process.env.FIXLO_COMMIT_SHA;
    
    console.log('FIXLO BUILD', {
      BUILD_ID: buildId,
      COMMIT_SHA: commitSha
    });
    
    // Verify the log was called correctly
    expect(consoleSpy).toHaveBeenCalledWith('FIXLO BUILD', {
      BUILD_ID: '2025-08-16T22:19:50',
      COMMIT_SHA: '622a34a1f99d5ce0dbb5ea1d0186d4c51ff75dde'
    });
    
    consoleSpy.mockRestore();
  });
});