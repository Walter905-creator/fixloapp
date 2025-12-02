# 🚀 iOS Build 26 Deployment Guide

## Overview

This guide documents the automated deployment process for Fixlo iOS Build 26 to App Store Connect, following the merge of PR #522.

## Quick Start

### Automated Deployment (Recommended)

```bash
cd /workspaces/fixloapp/mobile
./scripts/deploy-ios-build-26.sh
```

This single command will:
1. ✅ Clean install dependencies
2. ✅ Build iOS with EAS (production profile)
3. ✅ Capture the build ID
4. ✅ Submit to App Store Connect
5. ✅ Generate deployment report

### Manual Deployment

If you prefer to run each step manually:

#### Step 1: Clean Install
```bash
cd /workspaces/fixloapp/mobile
rm -rf node_modules
npm install
```

#### Step 2: Build iOS
```bash
eas build --platform ios --profile production --non-interactive
```

⏱️ **Expected Duration**: 15-25 minutes

#### Step 3: Get Build ID
```bash
eas build:list --platform ios --limit 5
```

Copy the Build ID from the most recent build.

#### Step 4: Submit to App Store
```bash
eas submit --platform ios --id <BUILD_ID> --non-interactive
```

Replace `<BUILD_ID>` with the ID from Step 3.

⏱️ **Expected Duration**: 2-5 minutes

## Prerequisites

### Required

- **Node.js**: v18 or higher
- **npm**: Latest version
- **EAS CLI**: Installed via npx (automatic)
- **Expo Account**: `fixlo-app` (paid account)
- **Apple Developer Account**: Access to App Store Connect

### Environment Variables

#### For GitHub Actions (Automated)
```bash
EXPO_TOKEN=<your_expo_token>
```

#### For Local Development (Interactive)
EAS will prompt for authentication if `EXPO_TOKEN` is not set.

## Build Configuration

### Current Settings

- **App Version**: 1.0.26
- **iOS Build Number**: 26
- **Android Version Code**: 26
- **Bundle Identifier**: com.fixloapp.mobile
- **Expo Owner**: fixlo-app
- **Project ID**: f13247bf-8aca-495f-9b71-e94d1cc480a5

### Configuration File

All settings are defined in `/mobile/app.config.js`:

```javascript
{
  version: "1.0.26",
  ios: {
    buildNumber: "26",
    bundleIdentifier: "com.fixloapp.mobile"
  },
  android: {
    versionCode: 26
  }
}
```

## Deployment Output

### Generated Files

After successful deployment, you'll find:

```
mobile/
├── build-26-id.txt                    # Build ID for reference
└── build-26-deployment-report.txt     # Complete deployment summary
```

### Example Output

```
═══════════════════════════════════════════════════════════
              FIXLO BUILD 26 - DEPLOYMENT COMPLETE          
═══════════════════════════════════════════════════════════

✅ Build ID: 12345678-abcd-1234-5678-123456789abc
✅ Submission Status: Successfully submitted to App Store Connect
ℹ️  Expected Status: Waiting for Review

✓ Build 26 is now submitted to Apple
✓ Version 1.0.26 ready for TestFlight distribution

Next Steps:
  1. Check App Store Connect for processing status
  2. Monitor for Apple review feedback
  3. TestFlight will be available once processing completes
```

## Troubleshooting

### Issue: "Build failed to start"

**Solution**: Check EAS build status
```bash
eas build:list --platform ios --limit 10
```

### Issue: "Submission requires authentication"

**Solution**: Set EXPO_TOKEN or authenticate interactively
```bash
npx eas-cli login
```

### Issue: "Build ID not captured"

**Solution**: Manually find build ID
1. Visit https://expo.dev/accounts/fixlo-app/projects/fixloapp/builds
2. Find the latest iOS build
3. Copy the Build ID
4. Submit manually:
   ```bash
   eas submit --platform ios --id <BUILD_ID> --non-interactive
   ```

### Issue: "Build taking too long"

**Expected Behavior**: iOS builds typically take 15-25 minutes. This is normal.

**Check Status**:
```bash
eas build:list --platform ios --limit 5
```

## Verification

### Pre-Deployment Checklist

Before running the deployment:

- [ ] PR #522 is merged to main branch
- [ ] `app.config.js` shows version "1.0.26"
- [ ] `app.config.js` shows iOS build number "26"
- [ ] All required app icons are present in `mobile/assets/`
- [ ] EXPO_TOKEN is set (for CI) or ready to authenticate (local)

### Post-Deployment Checklist

After successful deployment:

- [ ] Build ID saved to `build-26-id.txt`
- [ ] Deployment report generated
- [ ] App Store Connect shows new build processing
- [ ] TestFlight internal testing group notified (once processing completes)

## App Store Connect

### Expected Timeline

1. **Submission**: Immediate (via script)
2. **Processing**: 5-15 minutes (Apple servers)
3. **TestFlight Available**: 15-30 minutes after processing
4. **Review Submission**: Manual (after TestFlight testing)
5. **Apple Review**: 24-48 hours typical
6. **App Store Release**: Manual approval after review

### Monitoring Progress

**App Store Connect Portal**:
https://appstoreconnect.apple.com/apps/6737866851/testflight/ios

**Build Status Indicators**:
- 🔄 Processing - Apple is processing the binary
- ✅ Ready to Submit - Available for review submission
- 🔍 Waiting for Review - Submitted to Apple review team
- 📱 In Review - Apple is actively reviewing
- ✅ Ready for Sale - Approved and ready to release

## GitHub Actions Integration

This deployment can also be triggered via GitHub Actions:

### Workflow File
`.github/workflows/eas-build.yml`

### Trigger Build
1. Go to Actions tab
2. Select "EAS Build" workflow
3. Click "Run workflow"
4. Choose:
   - Platform: `ios`
   - Profile: `production`
   - Branch: `main`

### Required Secrets

Set in repository settings:
- `EXPO_TOKEN`: Your Expo authentication token

## Build 26 Features

This build includes all features from PR #522:

### Core Features
- ✅ Trade selection dropdown (12 trade types)
- ✅ SMS consent checkbox with full compliance
- ✅ Required validation for Pro users
- ✅ Backend integration for consent storage
- ✅ Improved UI/UX for mobile screens

### Files Updated
- `/mobile/screens/SignupScreen.js` - Primary signup UI
- `/mobile/screens/ProSignupScreen.js` - Pro subscription flow
- `/mobile/utils/paymentService.js` - Payment integration
- `/mobile/App.js` - Cache invalidation marker
- `/server/routes/auth.js` - Backend consent storage

## Support & Resources

### EAS Documentation
- Build: https://docs.expo.dev/build/introduction/
- Submit: https://docs.expo.dev/submit/introduction/

### Project Resources
- Build Dashboard: https://expo.dev/accounts/fixlo-app/projects/fixloapp/builds
- App Store Connect: https://appstoreconnect.apple.com

### Internal Documentation
- `BUILD_26_QUICK_REFERENCE.md` - Quick reference for Build 26
- `BUILD_26_FINAL_SUMMARY.md` - Complete technical details
- `APP_STORE_SUBMISSION_GUIDE.md` - Full submission guide

## Emergency Rollback

If issues are discovered after submission:

1. **Stop Review** (if in review):
   - Go to App Store Connect
   - Click "Stop Review"

2. **Fix Issues**:
   - Create hotfix branch
   - Apply fixes
   - Increment build number to 27

3. **Rebuild**:
   ```bash
   # Update build number in app.config.js to 27
   ./scripts/deploy-ios-build-27.sh
   ```

## Success Criteria

Deployment is successful when:

1. ✅ EAS build completes without errors
2. ✅ Build ID is captured and saved
3. ✅ Submission to App Store Connect succeeds
4. ✅ Build appears in App Store Connect dashboard
5. ✅ TestFlight shows build as "Processing" or "Ready to Test"
6. ✅ Deployment report generated successfully

## Contact

For deployment issues or questions:
- Check EAS logs: `eas build:view <BUILD_ID>`
- Review build documentation in `/mobile/`
- Contact Expo support: https://expo.dev/support

---

**Last Updated**: December 2, 2025  
**Build Version**: 26  
**App Version**: 1.0.26  
**Status**: ✅ Ready for Deployment
