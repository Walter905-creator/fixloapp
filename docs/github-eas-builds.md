# GitHub Actions EAS Builds

This guide explains how to use GitHub Actions to trigger EAS builds for the Fixlo mobile app.

## Prerequisites

Before using the GitHub Actions workflow, you need to set up an Expo access token in your repository secrets.

### Creating an Expo Access Token

1. **Generate the token** using EAS CLI:
   ```bash
   eas token:create
   ```
   
2. **Copy the generated token** - it will be shown only once!

3. **Add the token to GitHub repository secrets**:
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `EXPO_TOKEN`
   - Value: Paste the token you copied in step 2
   - Click **Add secret**

## Using the Workflow

The EAS Build workflow can be triggered manually from the GitHub Actions tab.

### Steps to Trigger a Build

1. Go to your repository on GitHub
2. Click on the **Actions** tab
3. Select **EAS Build** from the workflows list (left sidebar)
4. Click the **Run workflow** dropdown button (top right)
5. Select your options:
   - **Platform**: Choose `ios` or `android`
   - **Profile**: Choose `development`, `preview`, or `production`
6. Click **Run workflow**

### Build Profiles

- **development**: Creates a development client build
  - iOS: Simulator build (`.tar.gz`)
  - Android: APK file
  - Includes dev client for connecting to Metro bundler

- **preview**: Creates internal distribution builds
  - iOS: IPA file for TestFlight or direct installation
  - Android: APK or AAB file
  - For testing with your team before store submission

- **production**: Creates production builds
  - iOS: IPA file for App Store submission
  - Android: AAB file for Play Store submission
  - Optimized and ready for public release

## Build Status and Results

After triggering a build:

1. The workflow will start the EAS build process
2. Monitor progress in the GitHub Actions run
3. View detailed build logs on the [EAS Dashboard](https://expo.dev/)
4. Download completed builds from the EAS Dashboard

### EAS Dashboard

- **URL**: `https://expo.dev/accounts/[your-account]/projects/fixlo-app/builds`
- **Features**:
  - Real-time build progress
  - Build logs and diagnostics
  - Download links for completed builds
  - Installation instructions for device testing

## Troubleshooting

### "EXPO_TOKEN not found" Error

If you see an error about EXPO_TOKEN not being found:
1. Verify the secret is created in **Settings** → **Secrets and variables** → **Actions**
2. Ensure the secret name is exactly `EXPO_TOKEN` (case-sensitive)
3. Re-run the workflow after adding the secret

### Build Fails on EAS

1. Check the GitHub Actions run logs for immediate errors
2. View detailed logs on the EAS Dashboard
3. Common issues:
   - Invalid credentials (certificates, provisioning profiles)
   - Configuration errors in `app.config.js` or `eas.json`
   - Missing dependencies in `package.json`
   - Native module compatibility issues

### Token Expired

Expo access tokens don't expire by default, but if you need to regenerate:
1. Create a new token: `eas token:create`
2. Update the `EXPO_TOKEN` secret in GitHub with the new value

## Best Practices

1. **Development builds**: Use for active development and testing
   - Trigger manually when you need a new dev client
   - Include latest native dependencies

2. **Preview builds**: Use for team testing and QA
   - Create before major releases
   - Share with testers via EAS installation links

3. **Production builds**: Use for store submissions only
   - Thoroughly test with preview builds first
   - Ensure all credentials are up to date
   - Follow platform-specific submission guidelines

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [GitHub Actions for Expo](https://docs.expo.dev/build/building-on-ci/)
- [EAS CLI Reference](https://docs.expo.dev/eas/cli/)
- [Main EAS Setup Guide](./eas-dev-build.md)
