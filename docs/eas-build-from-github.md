# EAS Build from GitHub Actions

This document describes how to build the Fixlo Expo mobile app using Expo Application Services (EAS) directly from GitHub Actions.

## What This Workflow Does

The **EAS Build** workflow automates building iOS and Android versions of the Fixlo mobile app using EAS Build. It:

- ✅ Runs from the `mobile/` directory
- ✅ Supports manual builds with configurable platform, profile, and branch
- ✅ Can optionally auto-build on pushes to `main` (disabled by default)
- ✅ Uses secure `EXPO_TOKEN` authentication
- ✅ Runs non-interactively in GitHub Actions
- ✅ Provides build status and links to expo.dev

## Prerequisites

Before you can use this workflow, you need:

1. An Expo account (sign up at https://expo.dev)
2. The Expo app linked to EAS project `c557b673-3e59-434b-a5e2-f6154d4fbfc8` (@fixloapp/mobile)
3. An `EXPO_TOKEN` added to GitHub repository secrets

**⚠️ Important Configuration Requirements:**

The project configuration must match the EAS project to avoid build errors:
- **Slug**: Must be set to `"mobile"` (not "fixlo-app" or other values)
- **Owner**: Must be set to `"fixloapp"` (the Expo account owner)
- **Project ID**: Must be `"c557b673-3e59-434b-a5e2-f6154d4fbfc8"`

These values are configured in `mobile/app.config.js`:

```javascript
export default {
  expo: {
    name: "Fixlo",
    slug: "mobile",        // Must match EAS project slug
    owner: "fixloapp",     // Must match Expo account owner
    // ... other config ...
    extra: {
      eas: {
        projectId: "c557b673-3e59-434b-a5e2-f6154d4fbfc8"
      }
    }
  }
};
```

If these values don't match, you'll see an error like:
```
Slug for project identified by extra.eas.projectId (mobile) does not match the slug field (fixlo-app)
```

## Creating and Adding EXPO_TOKEN

### Step 1: Install EAS CLI

```bash
npm i -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

Enter your Expo credentials when prompted.

### Step 3: Create a Token

```bash
eas token:create
```

This will generate a personal access token. Copy the token value - you'll need it in the next step.

### Step 4: Add Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `EXPO_TOKEN`
5. Value: Paste the token from Step 3
6. Click **Add secret**

## Running the Workflow

### Manual Build (workflow_dispatch)

1. Go to your GitHub repository
2. Navigate to **Actions** tab
3. Select **EAS Build** from the workflow list
4. Click **Run workflow** button
5. Configure your build:
   - **Platform**: `ios` or `android`
   - **Profile**: `development`, `preview`, or `production`
   - **Branch**: Branch to build from (default: `main`)
6. Click **Run workflow**

### Example Build Configurations

**Development Build (for testing)**
- Platform: `android`
- Profile: `development`
- Branch: `main`

**Preview Build (for internal distribution)**
- Platform: `ios`
- Profile: `preview`
- Branch: `main`

**Production Build (for app stores)**
- Platform: `android`
- Profile: `production`
- Branch: `main`

## Enabling Auto-Build on Main

To automatically build on every push to `main`:

1. Open `.github/workflows/eas-build.yml`
2. Find the commented push trigger:
   ```yaml
   # Uncomment to auto-build on main pushes:
   # push:
   #   branches: [ main ]
   ```
3. Uncomment the `push` section:
   ```yaml
   # Uncomment to auto-build on main pushes:
   push:
     branches: [ main ]
   ```
4. Commit and push the change

**Note**: Auto-builds will use default values (you may need to modify the workflow to specify defaults for platform/profile when triggered by push).

## Monitoring Builds

### In GitHub Actions

1. Go to **Actions** tab in your repository
2. Click on the running workflow
3. Monitor the job steps and logs

### On Expo.dev

1. Go to https://expo.dev
2. Navigate to your project
3. Click on **Builds** in the sidebar
4. View build status, logs, and download artifacts

## Build Profiles

The workflow supports three build profiles defined in `mobile/eas.json`:

### Development
- **Purpose**: Testing and debugging
- **Android**: Generates APK (not AAB)
- **iOS**: Builds for simulator
- **Distribution**: Internal only

### Preview
- **Purpose**: Internal testing and QA
- **Distribution**: Internal
- **Suitable for**: TestFlight (iOS) or internal distribution (Android)

### Production
- **Purpose**: App store releases
- **Auto-increment**: Version numbers automatically increment
- **Suitable for**: Google Play Store and Apple App Store

## After the Build

### Development Build

**Android APK:**
1. Download the APK from expo.dev
2. Install on physical device or emulator
3. For installation: `adb install app.apk`

**iOS Simulator:**
1. Download the `.tar.gz` file from expo.dev
2. Extract and drag to iOS Simulator
3. Or use: `tar -xvzf app.tar.gz && xcrun simctl install booted app.app`

### Preview/Production Build

**Android:**
- Download AAB from expo.dev
- Upload to Google Play Console

**iOS:**
- Download from expo.dev
- Submit to App Store Connect
- Or use: `eas submit -p ios --latest`

## Troubleshooting

### "EXPO_TOKEN not found"

Make sure you've added the `EXPO_TOKEN` secret to GitHub (see "Creating and Adding EXPO_TOKEN" above).

### "Could not find an Expo app"

Ensure your Expo app has an `app.json` or `app.config.*` file in the root or in a subdirectory.

### "projectId not found"

Run `eas init` locally in your Expo app directory to link it to an EAS project.

### Build Fails

1. Check the GitHub Actions logs for specific error messages
2. Verify your `eas.json` configuration is valid
3. Ensure all required assets and dependencies are committed
4. Check expo.dev build logs for detailed error information

## Additional Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Build Configuration](https://docs.expo.dev/build/eas-json/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Quick Links

- **Expo Project**: https://expo.dev/accounts/[your-account]/projects/fixlo-app
- **GitHub Actions**: https://github.com/Walter905-creator/fixloapp/actions
- **EAS Build Dashboard**: https://expo.dev/accounts/[your-account]/projects/fixlo-app/builds

---

*For questions or issues with this workflow, please open an issue in the repository.*
