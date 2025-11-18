# Expo Owner Account Configuration

## Important: Paid Account Configuration

This project is configured to **always** build under the **`fixlo-app`** Expo account.

### Why This Matters

- **Paid Account**: `fixlo-app` is the paid Expo account for iOS/Android builds
- **Prevents Free-Plan Quota Issues**: Using the paid account ensures unlimited builds without hitting free-plan quotas
- **Required for Production**: All production builds for the App Store and Play Store must use this account

### Configuration Files

1. **app.config.js**
   - Contains `owner: "fixlo-app"` in the `expo` object
   - This ensures all Expo services (updates, builds, etc.) use the correct account

2. **eas.json**
   - Contains `"owner": "fixlo-app"` at the root level
   - This ensures EAS Build explicitly uses the paid account for all build profiles

### Critical: Do Not Change

❌ **DO NOT** change the `owner` field to any other value
❌ **DO NOT** remove the `owner` field from either configuration file
✅ **ALWAYS** keep `owner: "fixlo-app"` in both files

### Validation

To verify the configuration is correct, run:

```bash
cd mobile
node validate-expo-config.mjs
```

This will check that:
- Owner is set to "fixlo-app" in both files
- No duplicate owner fields exist
- All build profiles are intact
- Bundle identifiers and package names are preserved

### Building the App

With the correct owner configuration, you can now run builds without quota issues:

```bash
# iOS build
npx eas build --platform ios --profile production

# Android build
npx eas build --platform android --profile production

# Both platforms
npx eas build --platform all --profile production
```

### Troubleshooting

If you encounter any issues related to the Expo account:

1. Ensure you're logged in to the correct Expo account: `npx eas whoami`
2. Verify the owner field is set correctly in both config files
3. Run the validation script to check for configuration issues
4. Check that the EAS project ID matches: `f13247bf-8aca-495f-9b71-e94d1cc480a5`

---

**Last Updated**: 2025-11-18
**Account Owner**: fixlo-app
**EAS Project ID**: f13247bf-8aca-495f-9b71-e94d1cc480a5
