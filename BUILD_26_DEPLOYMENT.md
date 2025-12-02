# 🚀 Build 26 Deployment - Quick Start

## Automated iOS Build & Submission

Following PR #522 merge, Build 26 is ready for App Store deployment.

### One-Command Deployment

From repository root:
```bash
./deploy-ios-build-26.sh
```

Or from mobile directory:
```bash
cd mobile
./scripts/deploy-ios-build-26.sh
```

## What This Does

The deployment script performs these steps automatically:

1. **Clean Install** - Removes `node_modules` and reinstalls dependencies
2. **EAS Build** - Builds iOS app with production profile (Build 26)
3. **Capture Build ID** - Extracts and saves the build identifier
4. **Submit to App Store** - Submits to App Store Connect
5. **Status Report** - Generates deployment summary

## Build Details

- **Version**: 1.0.26
- **iOS Build Number**: 26
- **Bundle ID**: com.fixloapp.mobile
- **Target**: App Store Connect

## Expected Duration

- Clean install: 1-2 minutes
- iOS build: 15-25 minutes
- App Store submission: 2-5 minutes
- **Total**: ~20-30 minutes

## Prerequisites

### Required
- Node.js 18+
- npm latest
- EAS CLI (installed automatically via npx)
- Expo account access (fixlo-app)

### Environment (Optional)
```bash
export EXPO_TOKEN=<your_token>  # For non-interactive auth
```

If `EXPO_TOKEN` is not set, EAS will prompt for interactive login.

## Output Files

After successful deployment:

```
mobile/
├── build-26-id.txt                    # Build ID
└── build-26-deployment-report.txt     # Full report
```

## Monitoring Progress

### During Build
```bash
# Check build status
cd mobile
npx eas-cli build:list --platform ios --limit 5
```

### After Submission
- **EAS Dashboard**: https://expo.dev/accounts/fixlo-app/projects/fixloapp/builds
- **App Store Connect**: https://appstoreconnect.apple.com/apps/6737866851

## Post-Deployment

### Immediate Next Steps
1. ✅ Verify build appears in App Store Connect
2. ✅ Wait for TestFlight processing (5-15 minutes)
3. ✅ Test on TestFlight internal group
4. ✅ Submit for App Review (manual step in App Store Connect)

### Timeline
- **Processing**: 5-15 minutes
- **TestFlight Ready**: 15-30 minutes after submission
- **Apple Review**: 24-48 hours (after manual submission for review)

## Troubleshooting

### Build fails to start
```bash
cd mobile
npx eas-cli build:list --platform ios --limit 10
# Check for errors in recent builds
```

### Can't capture Build ID
1. Visit https://expo.dev/accounts/fixlo-app/projects/fixloapp/builds
2. Find latest iOS build
3. Note the Build ID
4. Submit manually:
   ```bash
   cd mobile
   npx eas-cli submit --platform ios --id <BUILD_ID> --non-interactive
   ```

### Authentication required
```bash
cd mobile
npx eas-cli login
# Then re-run deployment script
```

## Manual Steps (If Needed)

If the automated script fails at any step:

### Step 1: Clean Install
```bash
cd mobile
rm -rf node_modules
npm install
```

### Step 2: Build
```bash
npx eas-cli build --platform ios --profile production --non-interactive
```

### Step 3: Get Build ID
```bash
npx eas-cli build:list --platform ios --limit 5
```

### Step 4: Submit
```bash
npx eas-cli submit --platform ios --id <BUILD_ID> --non-interactive
```

## Build 26 Features

This build includes all updates from PR #522:

✅ Trade selection dropdown (12 trade types)  
✅ SMS consent checkbox (full compliance)  
✅ Required validation for Pro users  
✅ Backend integration for consent storage  
✅ Improved mobile UI/UX

## Success Indicators

Deployment is successful when you see:

```
✅ Build ID: <uuid>
✅ Submission Status: Successfully submitted to App Store Connect
✅ Build 26 is now submitted to Apple
✅ Version 1.0.26 ready for TestFlight distribution
```

## Additional Resources

- **Full Guide**: `/mobile/BUILD_26_DEPLOYMENT_GUIDE.md`
- **Technical Details**: `/mobile/BUILD_26_FINAL_SUMMARY.md`
- **Quick Reference**: `/mobile/BUILD_26_QUICK_REFERENCE.md`
- **EAS Workflow**: `/.github/workflows/eas-build.yml`

## Support

### Documentation
- EAS Build: https://docs.expo.dev/build/introduction/
- EAS Submit: https://docs.expo.dev/submit/introduction/

### Dashboards
- Expo: https://expo.dev/accounts/fixlo-app/projects/fixloapp
- App Store: https://appstoreconnect.apple.com

---

**Status**: ✅ Ready for Deployment  
**Last Updated**: December 2, 2025  
**Build**: 26  
**Version**: 1.0.26
