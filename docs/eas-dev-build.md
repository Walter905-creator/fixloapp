# EAS Development Builds (Fixlo)

## One-time Setup

### 1. Install EAS CLI
```bash
npm i -g eas-cli
```

### 2. Login to EAS
Navigate to the mobile app directory and login:
```bash
cd fixlo-app
npm run eas:login
```

### 3. Initialize Project on EAS
This command will create your project on Expo's servers and automatically write the `projectId` to your app.config.js:
```bash
npm run eas:init
```
**Note**: This will update `extra.eas.projectId` in your app.config.js automatically.

## Development Workflow

### Run Metro Bundler
Start the Metro bundler for development:
```bash
cd fixlo-app
npm start
```
This will show a QR code that you can scan with your dev client app.

## Building Development Clients

### iOS Simulator Build
```bash
cd fixlo-app
npm run eas:build:dev:ios
```
- Builds for iOS Simulator only (faster, no provisioning needed)
- Downloads as a `.tar.gz` file from EAS
- Automatically installs in your Simulator when you extract it

### Android APK Build
```bash
cd fixlo-app
npm run eas:build:dev:android
```
- Builds an APK file (easy to install on emulators and devices)
- Downloads directly from EAS build page
- Can be installed via drag-and-drop on emulator or ADB on device

## Installing & Running Dev Builds

### Android
1. Wait for the build to complete on EAS
2. Download the APK from the EAS build page
3. Install on your emulator:
   - Drag and drop the APK onto the emulator window, or
   - Use `adb install path/to/app.apk`
4. Launch the "Fixlo" app from your device/emulator
5. It will show a screen to connect to Metro
6. Scan the QR code from `npm start` or paste the development URL

### iOS Simulator
1. Wait for the build to complete on EAS
2. Download the `.tar.gz` file from the EAS build page
3. Extract it (it should auto-install in your Simulator)
4. Or manually: Drag the extracted `.app` file onto the Simulator
5. Launch the "Fixlo" app from your Simulator
6. It will show a screen to connect to Metro
7. Scan the QR code from `npm start` or paste the development URL

## Building for Physical iOS Devices

### Register Your Device(s)
```bash
cd fixlo-app
eas device:create
```
Follow the prompts to register your iOS device(s). This will add the device UDID to your provisioning profile.

### Update EAS Configuration
Edit `fixlo-app/eas.json` and change the iOS simulator setting in the development profile:
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false  // Change this from true to false
      }
    }
  }
}
```

### Rebuild for Device
```bash
npm run eas:build:dev:ios
```
This will create an IPA file that can be installed on your registered device(s).

## Preview & Production Builds

### Preview Builds (Internal Testing)
```bash
# iOS
npm run eas:build:preview:ios

# Android
npm run eas:build:preview:android
```

### Production Builds (App Store/Play Store)
```bash
# iOS
npm run eas:build:prod:ios

# Android
npm run eas:build:prod:android
```

## Troubleshooting

### "Module not found" errors for native libraries
If you add a library that requires native code:
1. Run `npx expo prebuild` to generate the native projects
2. Commit the changes (if using EAS, or run locally)
3. Rebuild your dev client: `npm run eas:build:dev:ios` or `npm run eas:build:dev:android`

### iOS Installation Fails
- Ensure your device is registered: `eas device:list`
- Verify provisioning profile is correct
- Check that you're using `"simulator": false` for physical devices

### Can't Connect to Metro
- Make sure `npm start` is running
- Check that your device/emulator is on the same network
- Try entering the Metro URL manually instead of scanning QR code
- The URL format is: `exp://YOUR_IP:8081` or `exp://localhost:8081` for emulator

### "Expo Go" vs "Dev Client" Confusion
Development builds create a **custom dev client** app with your native dependencies.
- ❌ Don't use the Expo Go app from the App Store
- ✅ Use the dev client app you built with EAS (it will be named "Fixlo")

### Build Fails on EAS
- Check the build logs on the EAS website
- Verify all required credentials are set up (certificates, provisioning profiles)
- Ensure your app.config.js is valid and has correct bundle identifiers

## Quick Reference Commands

```bash
# Navigate to mobile app
cd fixlo-app

# One-time setup
npm i -g eas-cli
npm run eas:login
npm run eas:init

# Development
npm start                           # Start Metro bundler

# Build dev clients
npm run eas:build:dev:ios          # iOS Simulator
npm run eas:build:dev:android      # Android APK

# Build for stores (preview/production)
npm run eas:build:preview:ios      # iOS preview
npm run eas:build:preview:android  # Android preview
npm run eas:build:prod:ios         # iOS production
npm run eas:build:prod:android     # Android production

# Device management (iOS)
eas device:create                  # Register iOS device
eas device:list                    # List registered devices
```

## GitHub Actions CI/CD

You can also trigger EAS builds from GitHub Actions. See the [GitHub EAS Builds Guide](./github-eas-builds.md) for setup instructions.

### Quick Setup
1. Create an Expo token: `eas token:create`
2. Add token to GitHub repo secrets as `EXPO_TOKEN`
3. Trigger builds from **Actions** → **EAS Build** → **Run workflow**

## Additional Resources

- [GitHub EAS Builds Guide](./github-eas-builds.md) - CI/CD setup for automated builds
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS CLI Reference](https://docs.expo.dev/eas/cli/)
