# Build 27 - How to Execute

## ⚡ Quick Start Guide

The Build 27 pipeline is **fully prepared and ready to execute** from the `/mobile` directory. All configuration has been verified, dependencies installed, and scripts prepared.

**Current Status:** ✅ Ready for execution | ⚠️ Requires EXPO_TOKEN

---

## 🎯 RECOMMENDED: Use GitHub Actions Workflow

This is the **easiest and safest** way to execute Build 27 because:
- ✅ EXPO_TOKEN already configured in repository secrets
- ✅ Automatically runs from `/mobile` directory
- ✅ No local setup required
- ✅ Full logging and monitoring

### Steps to Execute via GitHub Actions

1. **Go to the GitHub Repository**
   ```
   https://github.com/Walter905-creator/fixloapp
   ```

2. **Navigate to Actions Tab**
   - Click "Actions" in the top navigation
   - You'll see the workflows list

3. **Select "EAS Build" Workflow**
   - Find and click "EAS Build" in the left sidebar
   - This is the workflow defined in `.github/workflows/eas-build.yml`

4. **Click "Run workflow" Button**
   - Click the "Run workflow" dropdown button (top right)
   - Fill in the parameters:
     - **Use workflow from:** `main` or `copilot/fix-build-27-misconfiguration`
     - **platform:** Select `ios`
     - **profile:** Select `production`
     - **branch:** Enter `main` or current branch name

5. **Click "Run workflow" (Green Button)**
   - The workflow will start immediately
   - You'll see it appear in the workflow runs list

6. **Monitor Progress**
   - Click on the running workflow to see live logs
   - Build typically takes 15-25 minutes
   - You can monitor each step in real-time

### What the Workflow Will Do

The GitHub Actions workflow (`.github/workflows/eas-build.yml`) will:

1. ✅ Checkout the code
2. ✅ Setup Node.js (v18)
3. ✅ Navigate to `/mobile` directory automatically (`working-directory: mobile`)
4. ✅ Validate Expo app configuration
5. ✅ Install dependencies (`npm ci`)
6. ✅ Run EAS build with EXPO_TOKEN from secrets
7. ✅ Display recent builds

**Working Directory:** The workflow is configured with `defaults: run: working-directory: mobile`, ensuring all commands run in the mobile directory.

### After Build Completes

Once the GitHub Actions workflow completes the build:

1. **Get the Build ID**
   - Check the workflow logs for the build ID
   - Or visit: https://expo.dev/accounts/fixlo-app/projects/fixloapp/builds
   - Note the Build ID (36-character UUID)

2. **Submit to App Store Connect**
   - Option A: Run submission manually (see Alternative Option 2 below)
   - Option B: Use Expo dashboard to submit
   - Option C: Create a GitHub Actions workflow for submission

---

## 🔧 Alternative Option 1: Local Execution

If you prefer to run locally and have EXPO_TOKEN:

```bash
# Step 1: Export EXPO_TOKEN
export EXPO_TOKEN="your-expo-token-here"

# Step 2: Navigate to mobile directory
cd /home/runner/work/fixloapp/fixloapp/mobile

# Step 3: Run the quick execution script
./execute-build-27.sh

# The script will:
# - Verify EXPO_TOKEN is set
# - Verify you're in mobile directory
# - Check version configuration
# - Ask for confirmation
# - Execute the full deployment script
```

### What the Script Will Do

The `execute-build-27.sh` script will call `scripts/deploy-ios-build-27.sh` which will:

1. ✅ Verify prerequisites and configuration
2. ✅ Clean reinstall dependencies
3. ✅ Execute EAS build for iOS
4. ✅ Capture Build ID
5. ✅ Submit to App Store Connect
6. ✅ Generate deployment report

**Expected Duration:** 20-30 minutes total

---

## 🔧 Alternative Option 2: Manual Step-by-Step

For maximum control, execute each step manually:

### Setup
```bash
# Set EXPO_TOKEN
export EXPO_TOKEN="your-expo-token-here"

# Navigate to mobile directory
cd /home/runner/work/fixloapp/fixloapp/mobile

# Verify configuration
grep -E "version:|buildNumber:|versionCode:" app.config.js
```

Expected output:
```
version: "1.0.27",
buildNumber: "27",
versionCode: 27,
```

### Step 1: Build iOS
```bash
npx eas-cli@latest build \
  --platform ios \
  --profile production \
  --non-interactive
```

**Duration:** 15-25 minutes

### Step 2: Get Build ID
```bash
npx eas-cli@latest build:list \
  --platform ios \
  --limit 5 \
  --non-interactive
```

Look for the most recent build and copy the Build ID (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Step 3: Submit to App Store
```bash
# Replace <BUILD_ID> with the actual Build ID from step 2
npx eas-cli@latest submit \
  --platform ios \
  --id <BUILD_ID> \
  --non-interactive
```

**Duration:** 2-5 minutes

---

## 📋 Pre-Execution Checklist

Before executing, verify these are all ✅:

- [x] Configuration verified (version 1.0.27, build 27)
- [x] Dependencies installed (779 packages)
- [x] Scripts prepared and executable
- [x] Working directory is `/mobile` (not root)
- [ ] EXPO_TOKEN is available (in GitHub secrets OR environment)

**Status:** 4 of 5 complete. Only EXPO_TOKEN required.

---

## 🎯 Expected Outcomes

### Successful Build
- ✅ Build appears on Expo dashboard
- ✅ Build ID captured (36-character UUID)
- ✅ Build status: "Finished"
- ✅ Platform: iOS
- ✅ Profile: production
- ✅ Version: 1.0.27
- ✅ Build Number: 27
- ✅ Owner: fixlo-app

### Successful Submission
- ✅ Submitted to App Store Connect
- ✅ Status: "Processing" or "Waiting for Review"
- ✅ TestFlight availability (once processing completes)
- ✅ Build visible in App Store Connect

### Verification Points
- ✅ Build was created from `/mobile` directory (NOT root)
- ✅ Used `mobile/app.config.js` (full app config)
- ✅ Used `mobile/eas.json` (production profile)
- ✅ Built under "fixlo-app" Expo account

---

## ⚠️ Common Issues & Solutions

### Issue: "EXPO_TOKEN not set"
**Solution:** 
- Use GitHub Actions workflow (token in secrets)
- OR set token: `export EXPO_TOKEN="..."`

### Issue: "Build failed - wrong directory"
**Solution:** 
- Ensure you're in `/mobile` directory
- Run: `cd /home/runner/work/fixloapp/fixloapp/mobile`

### Issue: "Configuration mismatch"
**Solution:** 
- Verify `app.config.js` has version 1.0.27, build 27
- This has already been verified ✅

### Issue: "Dependencies not found"
**Solution:** 
- Run: `npm install` from mobile directory
- This has already been done ✅

---

## 📊 Progress Tracking

### What's Complete ✅
1. ✅ Directory configuration verified (`/mobile`, not root)
2. ✅ Version configuration verified (1.0.27, build 27)
3. ✅ Dependencies installed (779 packages)
4. ✅ Deployment scripts prepared
5. ✅ Documentation created
6. ✅ All prerequisites verified

### What's Pending ⏳
1. ⏳ Set/access EXPO_TOKEN
2. ⏳ Execute EAS build
3. ⏳ Capture Build ID
4. ⏳ Submit to App Store Connect
5. ⏳ Verify submission status

**Progress:** 6 of 11 total steps complete (55%)  
**Blocking:** EXPO_TOKEN access  
**Recommendation:** Use GitHub Actions workflow

---

## 🚀 Ready to Execute?

### Option 1: GitHub Actions (RECOMMENDED) ⭐
1. Go to: https://github.com/Walter905-creator/fixloapp/actions
2. Click: "EAS Build" workflow
3. Click: "Run workflow"
4. Set: platform=ios, profile=production
5. Click: "Run workflow" button
6. Monitor progress in Actions tab

### Option 2: Local with Token
```bash
export EXPO_TOKEN="your-token"
cd /home/runner/work/fixloapp/fixloapp/mobile
./execute-build-27.sh
```

### Option 3: Manual Step-by-Step
Follow the commands in "Alternative Option 2" section above.

---

## 📞 Support & Resources

### Expo Resources
- Dashboard: https://expo.dev/accounts/fixlo-app/projects/fixloapp
- Builds: https://expo.dev/accounts/fixlo-app/projects/fixloapp/builds
- Docs: https://docs.expo.dev/build/introduction/

### Repository Files
- Workflow: `.github/workflows/eas-build.yml`
- Config: `mobile/app.config.js`
- EAS Config: `mobile/eas.json`
- Deploy Script: `mobile/scripts/deploy-ios-build-27.sh`
- Quick Script: `mobile/execute-build-27.sh`

### Documentation
- Execution Report: `BUILD_27_PIPELINE_EXECUTION_REPORT.md`
- Status Summary: `BUILD_27_DEPLOYMENT_STATUS.md`
- This Guide: `BUILD_27_HOW_TO_EXECUTE.md`

---

## ✅ Final Checklist

Before clicking "Run workflow" or executing locally:

- [x] Build 27 configuration verified
- [x] Dependencies installed
- [x] Scripts prepared
- [x] Documentation reviewed
- [ ] EXPO_TOKEN available (via GitHub Actions or environment)
- [ ] Ready to execute build
- [ ] Monitoring plan in place

**Everything is ready. Just need to execute with EXPO_TOKEN.**

---

**Last Updated:** December 4, 2025  
**Status:** ✅ READY FOR EXECUTION  
**Recommended Method:** GitHub Actions Workflow  
**Estimated Time:** 20-30 minutes total
