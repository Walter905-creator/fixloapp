# 🚀 Build 26 - Quick Deploy Card

## One-Line Deploy
```bash
./deploy-ios-build-26.sh
```

## What You Get
- ✅ Automated clean install
- ✅ EAS production iOS build
- ✅ Build ID captured automatically
- ✅ Submitted to App Store Connect
- ✅ Deployment report generated

## Time Required
⏱️ **20-30 minutes total**

## Files Generated
```
mobile/
├── build-26-id.txt              # Your Build ID
└── build-26-deployment-report.txt   # Full report
```

## Success Looks Like
```
✅ Build ID: 12345678-abcd-1234-5678-123456789abc
✅ Submission Status: Successfully submitted
✅ Build 26 is now submitted to Apple
```

## Pre-Deploy Check (Optional)
```bash
./verify-build-26-ready.sh
```

## Manual Commands (If Needed)
```bash
# From mobile directory:
cd mobile

# Step 1: Clean install
rm -rf node_modules && npm install

# Step 2: Build
eas build --platform ios --profile production --non-interactive

# Step 3: Get Build ID
eas build:list --platform ios --limit 5

# Step 4: Submit (replace <BUILD_ID>)
eas submit --platform ios --id <BUILD_ID> --non-interactive
```

## Troubleshooting

**"Build taking long"** → Normal, wait 15-25 minutes

**"EXPO_TOKEN not set"** → Continue, you'll login interactively

**"Build ID not found"** → Check https://expo.dev/accounts/fixlo-app/projects/fixloapp/builds

## Next Steps After Deploy
1. Check App Store Connect (5-15 min processing)
2. TestFlight ready (15-30 min total)
3. Internal test
4. Submit for review

## Help
- **Quick Start**: BUILD_26_README.md
- **Full Guide**: mobile/BUILD_26_DEPLOYMENT_GUIDE.md
- **Troubleshooting**: See comprehensive guides

---
**Build**: 26 | **Version**: 1.0.26 | **Status**: ✅ Ready
