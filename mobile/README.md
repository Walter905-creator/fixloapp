# Fixlo Mobile App

React Native mobile application for Fixlo, built with Expo.

## 🎉 Recent Updates (November 2025)

**Major fixes implemented** - All critical issues resolved:
- ✅ Fixed startup crashes with ErrorBoundary
- ✅ Enhanced error handling with detailed logging
- ✅ Homeowner Dashboard now loads real job requests from API
- ✅ Improved stability with comprehensive error handling

See [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) for full details.

## Quick Start

### Prerequisites
- Node.js 18 or higher
- [EAS CLI](https://docs.expo.dev/build/setup/) (`npm install -g eas-cli`)
- iOS Simulator (Mac only) or Android Emulator

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

### Development

```bash
# Run on iOS Simulator
npm run ios

# Run on Android Emulator
npm run android

# Start Metro bundler
npm start
```

## EAS Development Builds

For custom native code and a better development experience, use EAS development builds.

### One-Time Setup

```bash
# Login to Expo
npm run eas:login

# Initialize project (writes projectId to app.config.js)
npm run eas:init
```

### Build Dev Clients

```bash
# iOS Simulator
npm run eas:build:dev:ios

# Android APK
npm run eas:build:dev:android
```

### Preview Builds (Internal Testing)

```bash
# iOS
npm run eas:build:preview:ios

# Android
npm run eas:build:preview:android
```

### Production Builds (App Stores)

```bash
# iOS
npm run eas:build:prod:ios

# Android
npm run eas:build:prod:android
```

## Documentation

- **[EAS Dev Build Setup](../docs/eas-dev-build.md)** - Complete EAS setup guide
- **[GitHub Actions Builds](../docs/github-eas-builds.md)** - CI/CD setup for automated builds

## Project Structure

```
fixlo-app/
├── App.js              # Main app entry (includes ErrorBoundary)
├── app.config.js       # Expo configuration
├── eas.json            # EAS build profiles
├── assets/             # Images, fonts, etc.
├── config/             # Configuration modules
│   └── api.js          # Centralized API configuration
├── screens/            # App screens
│   ├── SignupScreen.js       # Enhanced error handling
│   ├── LoginScreen.js        # Enhanced error handling
│   ├── HomeownerScreen.js    # Real API integration
│   ├── ProScreen.js
│   ├── ProSignupScreen.js
│   └── HomeownerJobRequestScreen.js
├── utils/              # Utility functions
├── test-api-config.js  # API configuration tests
└── test-integration.sh # Integration test suite
```

## Configuration

### Environment Variables

Create a `.env` file in the fixlo-app directory:

```env
EXPO_PUBLIC_API_URL=https://fixloapp.onrender.com
```

**Note**: The app includes a fallback to `https://fixloapp.onrender.com` if the environment variable is not set. See `config/api.js` for details.

### App Configuration

Key settings in `app.config.js`:
- **Scheme**: `fixlo` (for deep linking)
- **iOS Bundle ID**: `com.fixlo.app`
- **Android Package**: `com.fixlo.app`
- **EAS Project ID**: Set automatically by `eas init`

## Native Modules

If you add a library that requires native code:

```bash
# Prebuild native projects
npx expo prebuild

# Rebuild dev clients
npm run eas:build:dev:ios
npm run eas:build:dev:android
```

## Troubleshooting

### Run Tests

Before debugging issues, run the test suite:

```bash
# Test API configuration
node test-api-config.js

# Run integration tests
./test-integration.sh
```

### Can't connect to Metro bundler
- Ensure `npm start` is running
- Check device/emulator is on same network
- Try entering Metro URL manually: `exp://YOUR_IP:8081`

### Build fails on EAS
- Check build logs on [EAS Dashboard](https://expo.dev/)
- Verify credentials (certificates, provisioning profiles)
- Ensure `app.config.js` and `eas.json` are valid

### Development vs Expo Go
- Development builds create a **custom dev client** with your native dependencies
- ❌ Don't use Expo Go app from App Store
- ✅ Use the dev client built with EAS (named "Fixlo")

### App Crashes or Errors
- Check console logs for detailed error information
- ErrorBoundary will catch crashes and show recovery screen
- Verify API connectivity: `curl https://fixloapp.onrender.com/api/health`
- Review error handling documentation in `FIXES_IMPLEMENTATION_SUMMARY.md`

## Additional Documentation

### Recent Fixes & Implementation
- **[IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)** - Complete summary of recent fixes
- **[FIXES_IMPLEMENTATION_SUMMARY.md](./FIXES_IMPLEMENTATION_SUMMARY.md)** - Technical implementation details

### Original Documentation
- **[EAS Dev Build Setup](../docs/eas-dev-build.md)** - Complete EAS setup guide (if exists)
- **[GitHub Actions Builds](../docs/github-eas-builds.md)** - CI/CD setup for automated builds (if exists)

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Expo Router](https://docs.expo.dev/router/introduction/) (if using file-based routing)
