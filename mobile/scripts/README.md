# Version Bumping Automation for Fixlo Mobile App

This directory contains the automated version bumping script for the Fixlo mobile application.

## Overview

The version bump script automatically increments:
- **App version** (patch version: e.g., 1.0.2 → 1.0.3)
- **iOS buildNumber** (e.g., "9" → "10")
- **Android versionCode** (e.g., 9 → 10)

This is required before every EAS build submission to avoid Apple App Store rejections due to duplicate build numbers.

## Usage

### Manual Version Bump

Run the bump script before creating a new build:

```bash
npm run bump
```

This will:
1. Read the current version information from `app.config.js`
2. Increment all version numbers
3. Update both `app.config.js` and `app.config.ts`
4. Automatically commit the changes to git (if available)
5. Display the new version numbers

### Example Output

```
🚀 Starting version bump...

✅ Version bumped: 1.0.2 → 1.0.3
✅ iOS buildNumber: 9 → 10
✅ Android versionCode: 9 → 10

📝 Updated files:
   - app.config.js
   - app.config.ts

✅ Changes committed to git

🎉 Version bump complete!

📦 Next steps:
   npx eas build --platform ios
   npx eas submit --platform ios
```

## Build and Submit Workflow

The recommended workflow for creating and submitting a new build:

```bash
# 1. Bump the version numbers
npm run bump

# 2. Build the app for iOS
npx eas build --platform ios

# 3. Submit to the App Store
npx eas submit --platform ios

# For Android builds
npx eas build --platform android
npx eas submit --platform android
```

## How It Works

The script (`scripts/bumpVersion.js`):

1. **Reads both config files** (`app.config.js` and `app.config.ts`)
2. **Verifies synchronization** between both files
3. **Increments version numbers**:
   - Patch version: Increments the last number (x.y.Z)
   - iOS buildNumber: Increments by 1
   - Android versionCode: Increments by 1
4. **Updates both config files** to maintain synchronization
5. **Commits changes to git** (optional, requires git to be available)

## Configuration Files

The app uses two configuration files that must be kept in sync:

- **app.config.js**: Primary Expo configuration (JavaScript)
- **app.config.ts**: TypeScript version of the configuration

Both files contain the same version information:

```javascript
{
  expo: {
    version: "1.0.2",
    ios: { buildNumber: "9" },
    android: { versionCode: 9 }
  }
}
```

## Testing

Run the automated tests to verify the script functionality:

```bash
node __tests__/bumpVersion.test.js
```

## Troubleshooting

### Version mismatch between config files

If `app.config.js` and `app.config.ts` have different version numbers, the script will show a warning and use the values from `app.config.js`:

```
⚠️  Warning: app.config.js and app.config.ts have different version values!
   JS: 1.0.2 / 9 / 9
   TS: 1.0.1 / 8 / 8
   Proceeding with app.config.js values...
```

### Git commit fails

If git is not available or there are uncommitted changes, the script will still update the version numbers but won't auto-commit. You'll see:

```
💡 Tip: Commit these changes with:
   git add app.config.js app.config.ts
   git commit -m "chore: bump version to 1.0.3"
```

## Script API

The script exports the following functions for testing:

- `incrementPatchVersion(version)`: Increments the patch version
- `readConfigFile(filePath)`: Reads and parses a config file
- `updateConfigFile(...)`: Updates a config file with new version numbers

## Requirements

- Node.js (no additional dependencies required)
- Git (optional, for auto-commit functionality)

## Files

- `scripts/bumpVersion.js`: Main version bump script
- `__tests__/bumpVersion.test.js`: Test suite for the script
