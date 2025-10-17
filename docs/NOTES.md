# Fixlo Mobile App - Important Notes

## Native Modules & Development Builds

### Stripe React Native

If you plan to use `@stripe/stripe-react-native` for native payment processing in the mobile app:

1. **Development builds are REQUIRED** - The Stripe SDK contains native code that cannot run in Expo Go
2. **Installation steps**:
   ```bash
   cd mobile
   npx expo install @stripe/stripe-react-native
   ```

3. **After adding Stripe** (or any native module):
   - Run `npx expo prebuild` to generate native iOS/Android projects
   - Commit the changes if needed
   - Rebuild your development clients:
     ```bash
     npm run eas:build:dev:ios
     npm run eas:build:dev:android
     ```
   - Install the new dev client builds on your devices/emulators

4. **Configuration**: 
   - The `stripePublishableKey` is already configured in `app.config.js` under `extra`
   - Update the placeholder value `"pk_live_REPLACE"` with your actual Stripe publishable key
   - Access it in your code via: `Constants.expoConfig.extra.stripePublishableKey`

### Other Native Modules

The same process applies to any library that requires native code:
- `expo-camera`
- `expo-location`
- `expo-secure-store`
- `react-native-maps`
- Third-party SDKs with native dependencies

**Always rebuild your dev clients** after adding native dependencies to ensure they're included in your app.

## Push Notifications

### Current Setup
The app already has `expo-notifications` configured in `app.config.js` with basic settings:
```javascript
plugins: [
  [
    "expo-notifications",
    {
      icon: "./assets/notification-icon.png",
      color: "#ffffff",
      sounds: ["./assets/notification-sound.wav"]
    }
  ]
]
```

### Future Enhancement: FCM & APNs

When ready to enable full push notification support, you'll need to:

#### Android (Firebase Cloud Messaging)
1. Create a Firebase project at https://console.firebase.google.com
2. Download `google-services.json`
3. Add to your app.config.js:
   ```javascript
   android: {
     // ... existing config
     googleServicesFile: "./google-services.json"
   }
   ```

#### iOS (Apple Push Notification Service)
1. Enable Push Notifications in your Apple Developer account
2. Create APNs keys
3. Configure in EAS:
   ```bash
   eas credentials
   ```

#### Testing Push Notifications
- Use the Expo Push Notification Tool: https://expo.dev/notifications
- Or integrate with your backend to send notifications via Expo's push service

### Important Notes
- Push notifications **require a development build** - they don't work in Expo Go
- After configuring FCM/APNs, rebuild your apps:
  ```bash
  npm run eas:build:dev:ios
  npm run eas:build:dev:android
  ```
- Test on physical devices (notifications don't work on iOS Simulator)

## Config Plugins

### What are Config Plugins?
Config plugins in `app.config.js` modify native iOS/Android projects during the build process. They're used by libraries that need native configuration.

### When to Use `expo prebuild`
Run `npx expo prebuild` when:
- Adding a library with a config plugin
- Modifying native configuration in app.config.js
- Debugging native build issues

### EAS Build vs Local Development
- **EAS Build**: Runs `expo prebuild` automatically in the cloud
- **Local Development**: You may need to run `npx expo prebuild` manually to generate native projects

## Environment Variables

### Current Configuration
The app uses environment variables via `.env` file:
```bash
EXPO_PUBLIC_API_URL=https://fixloapp.onrender.com
```

### Accessing in Code
```javascript
import Constants from 'expo-constants';

// From .env file (EXPO_PUBLIC_ prefix)
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

// From app.config.js extra
const apiUrl = Constants.expoConfig.extra.apiUrl;
const stripeKey = Constants.expoConfig.extra.stripePublishableKey;
```

### Build-time vs Runtime
- Variables prefixed with `EXPO_PUBLIC_` are embedded at build time
- They're accessible via `process.env.EXPO_PUBLIC_*`
- Changes require rebuilding the app

## Troubleshooting Common Issues

### "Unable to resolve module"
- The module might require native code
- Solution: Add it with `npx expo install <package>` and rebuild dev client

### "No matching client found"
- You're trying to use Expo Go instead of your dev client
- Solution: Use the "Fixlo" app you built with EAS, not Expo Go

### Changes Not Appearing
- Metro bundler cache issue
- Solution: Stop Metro, run `npx expo start --clear`, and reconnect

### Build Fails with Config Plugin Error
- A plugin might be misconfigured in app.config.js
- Check the plugin documentation for correct configuration
- Verify all required assets exist (icons, sounds, etc.)

## Best Practices

1. **Keep dev clients updated**: Rebuild when adding native dependencies
2. **Use EAS for builds**: Don't try to build locally unless necessary
3. **Test on real devices**: Some features (notifications, camera) need physical devices
4. **Environment management**: Keep separate .env files for development/staging/production
5. **Version control**: Don't commit `.env` files with secrets, use `.env.example` instead

## Resources

- [Expo Config Documentation](https://docs.expo.dev/workflow/configuration/)
- [Config Plugins](https://docs.expo.dev/config-plugins/introduction/)
- [Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Stripe React Native](https://docs.page/stripe/stripe-react-native)
- [Expo Notifications](https://docs.expo.dev/push-notifications/overview/)
