// Jest setup for React Native Testing Library
// Note: @testing-library/react-native v12.4+ includes matchers by default

// Set up global test environment
global.__DEV__ = true;

// Mock Expo winter runtime
global.__ExpoImportMetaRegistry = {
  get: jest.fn(),
  set: jest.fn(),
};

// Mock structuredClone for Expo 54
global.structuredClone = jest.fn((val) => JSON.parse(JSON.stringify(val)));

// Mock Expo modules
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExponentPushToken[test-token]' })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

// Mock InAppPurchases (referenced in ProSignupScreen but not imported)
global.InAppPurchases = {
  connectAsync: jest.fn(() => Promise.resolve()),
  disconnectAsync: jest.fn(() => Promise.resolve()),
  getProductsAsync: jest.fn(() => Promise.resolve({ results: [], responseCode: 0 })),
  purchaseItemAsync: jest.fn(() => Promise.resolve()),
  finishTransactionAsync: jest.fn(() => Promise.resolve()),
  setPurchaseListener: jest.fn(() => ({ remove: jest.fn() })),
  IAPResponseCode: {
    OK: 0,
    USER_CANCELED: 1,
    ERROR: 2,
  },
};

// Mock axios
jest.mock('axios', () => ({
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
  post: jest.fn(),
  get: jest.fn(),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      replace: jest.fn(),
      goBack: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

// Mock React Native Image
jest.mock('react-native/Libraries/Image/Image', () => 'Image');

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
