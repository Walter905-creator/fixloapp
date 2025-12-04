# iOS Build 27 Deployment Guide

## ⚠️ Critical Issue: Build 26 Built from Wrong Directory

Build 26 was incorrectly built from the **root directory** instead of the proper mobile app directory. The root folder contains a basic demo configuration (app.json, eas.json) that was used instead of the real Fixlo mobile app.

## ✅ Correct Configuration

**Correct Mobile App Location:**
```
/home/runner/work/fixloapp/fixloapp/mobile/
```

**Updated Configuration for Build 27:**
- Version: 1.0.27
- iOS Build Number: 27
- Android Version Code: 27
- All changes committed to: mobile/app.config.js and mobile/package.json

## 📁 Root Directory Files to Ignore

The following files in the root directory are for a basic demo app and should NOT be used for EAS builds:
- `/home/runner/work/fixloapp/fixloapp/app.json` - Basic Expo config (NOT the real app)
- `/home/runner/work/fixloapp/fixloapp/eas.json` - Generic EAS config (NOT the real app config)

## ✅ Correct Files for Build 27

EAS must use these files from the mobile directory:
- `/home/runner/work/fixloapp/fixloapp/mobile/app.config.js` ✓ (Updated to 1.0.27, build 27)
- `/home/runner/work/fixloapp/fixloapp/mobile/eas.json` ✓ (Contains proper owner, profiles, and submit config)
- `/home/runner/work/fixloapp/fixloapp/mobile/package.json` ✓ (Updated to 1.0.27)

## 🚀 Deployment Steps for Build 27

### Prerequisites
- EXPO_TOKEN environment variable must be set
- Node.js 20.11.1 or compatible version
- EAS CLI installed (eas-cli@latest)

### Step 1: Navigate to Mobile Directory
```bash
cd /home/runner/work/fixloapp/fixloapp/mobile
```

### Step 2: Verify Configuration
```bash
# Verify version is 1.0.27 and buildNumber is 27
grep -E "version|buildNumber" app.config.js
```

Expected output:
```
version: "1.0.27",
buildNumber: "27",
```

### Step 3: Clean Install Dependencies
```bash
rm -rf node_modules
npm install
```

### Step 4: Build iOS Build 27
```bash
# From /mobile directory
npx eas-cli@latest build --platform ios --profile production --non-interactive
```

This command will:
- Use the mobile/app.config.js configuration
- Build version 1.0.27 with build number 27
- Use the production profile from mobile/eas.json
- Build under the "fixlo-app" Expo account

### Step 5: Extract Build ID
```bash
# List recent builds to get the Build ID
npx eas-cli@latest build:list --platform ios --limit 5 --non-interactive
```

Look for the most recent build and note the Build ID (36-character UUID format).

### Step 6: Submit to App Store Connect
```bash
# Replace <BUILD_ID> with the actual Build ID from step 5
npx eas-cli@latest submit --platform ios --id <BUILD_ID> --non-interactive
```

## 🔍 Verification Checklist

Before building, verify:
- [ ] Current directory is `/home/runner/work/fixloapp/fixloapp/mobile`
- [ ] app.config.js shows version "1.0.27" and buildNumber "27"
- [ ] package.json shows version "1.0.27"
- [ ] node_modules is freshly installed
- [ ] EXPO_TOKEN is set in environment
- [ ] EAS CLI is installed and accessible

After building, verify:
- [ ] Build was created under "fixlo-app" account
- [ ] Build shows as version 1.0.27, build 27
- [ ] Build ID is captured
- [ ] Submission to App Store Connect succeeds

## 📊 Expected Build Output

When the build starts, you should see:
```
✔ Using remote iOS credentials (Expo server)
✔ Using Expo account: fixlo-app
✔ Project: fixloapp
✔ Bundle identifier: com.fixloapp.mobile
✔ Version: 1.0.27 (27)
```

## 🎯 Final Deployment Summary Template

After successful deployment, document:

```
═══════════════════════════════════════════════
FIXLO BUILD 27 - DEPLOYMENT SUMMARY
═══════════════════════════════════════════════

Build Information:
------------------
Build Number: 27
Version: 1.0.27
Platform: iOS
Profile: production
Build Directory: /home/runner/work/fixloapp/fixloapp/mobile ✓

Build Details:
--------------
Build ID: [36-character UUID]
Expo Account: fixlo-app
Bundle ID: com.fixloapp.mobile
Runtime Version: 1.0.27

Submission Status:
------------------
Status: [submitted/processing/in review]
Submitted to: App Store Connect
Submission Time: [timestamp]

Directory Verification:
-----------------------
✓ Built from /mobile directory (CORRECT)
✗ NOT built from root directory
✓ Used mobile/app.config.js
✓ Used mobile/eas.json

Warnings/Errors:
----------------
[None expected - list any that occurred]

Next Steps:
-----------
1. Monitor App Store Connect for processing status
2. Check TestFlight availability
3. Prepare for Apple review process
```

## 🚨 Common Issues and Solutions

### Issue: Build from wrong directory
**Solution:** Always ensure you're in `/home/runner/work/fixloapp/fixloapp/mobile` before running any EAS commands.

### Issue: EXPO_TOKEN not set
**Solution:** 
- In GitHub Actions: Use `EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}`
- In CI/CD: Set EXPO_TOKEN as environment variable
- Locally: Run `eas login` first

### Issue: Wrong version/build number
**Solution:** Verify mobile/app.config.js has been updated to 1.0.27 and build 27.

## 📝 Notes

- Build 26 was incorrectly built from root directory
- Build 27 corrects this by using the proper mobile directory
- All future builds must be run from `/mobile` directory
- Root directory app.json and eas.json should be ignored for mobile builds
