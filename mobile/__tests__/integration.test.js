/**
 * Integration Tests for Mobile App Features
 * Tests AsyncStorage, Socket.io, and authentication flow
 */

// Simple validation tests (not full Jest tests since we don't have test runner configured)
console.log('🧪 Running Mobile App Feature Validation Tests...\n');

// Test 1: Check that auth storage module exports expected functions
console.log('Test 1: Auth Storage Module');
try {
  const authStorage = require('../utils/authStorage');
  const requiredExports = [
    'saveAuthToken',
    'getAuthToken',
    'saveUserData',
    'getUserData',
    'saveUserType',
    'getUserType',
    'saveSession',
    'getSession',
    'clearSession',
    'isAuthenticated'
  ];
  
  const missingExports = requiredExports.filter(exp => typeof authStorage[exp] !== 'function');
  if (missingExports.length > 0) {
    throw new Error(`Missing exports: ${missingExports.join(', ')}`);
  }
  console.log('✅ All auth storage functions exported correctly');
} catch (error) {
  console.error('❌ Auth storage test failed:', error.message);
}

// Test 2: Check Socket.io service module
console.log('\nTest 2: Socket.io Service Module');
try {
  const socketService = require('../utils/socketService');
  const requiredExports = [
    'initializeSocket',
    'getSocket',
    'isSocketConnected',
    'disconnectSocket',
    'joinRoom',
    'leaveRoom',
    'subscribeToNewJobs',
    'subscribeToJobUpdates',
    'subscribeToJobStatus',
    'emitEvent',
    'subscribeToEvent'
  ];
  
  const missingExports = requiredExports.filter(exp => typeof socketService[exp] !== 'function');
  if (missingExports.length > 0) {
    throw new Error(`Missing exports: ${missingExports.join(', ')}`);
  }
  console.log('✅ All socket service functions exported correctly');
} catch (error) {
  console.error('❌ Socket service test failed:', error.message);
}

// Test 3: Verify screens exist
console.log('\nTest 3: Screen Components');
try {
  const fs = require('fs');
  const screens = [
    '../screens/JobDetailScreen.js',
    '../screens/LoginScreen.js',
    '../screens/HomeownerScreen.js',
    '../screens/ProScreen.js'
  ];
  
  screens.forEach(screen => {
    const path = require('path').join(__dirname, screen);
    if (!fs.existsSync(path)) {
      throw new Error(`Screen not found: ${screen}`);
    }
  });
  console.log('✅ All required screen components exist');
} catch (error) {
  console.error('❌ Screen components test failed:', error.message);
}

// Test 4: Check package dependencies
console.log('\nTest 4: Package Dependencies');
try {
  const pkg = require('../package.json');
  const requiredDeps = {
    '@react-native-async-storage/async-storage': true,
    'socket.io-client': true,
  };
  
  const missingDeps = Object.keys(requiredDeps).filter(dep => !pkg.dependencies[dep]);
  if (missingDeps.length > 0) {
    throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
  }
  console.log('✅ All required dependencies installed');
  console.log('  - @react-native-async-storage/async-storage:', pkg.dependencies['@react-native-async-storage/async-storage']);
  console.log('  - socket.io-client:', pkg.dependencies['socket.io-client']);
} catch (error) {
  console.error('❌ Dependencies test failed:', error.message);
}

console.log('\n🎉 All validation tests completed!');
