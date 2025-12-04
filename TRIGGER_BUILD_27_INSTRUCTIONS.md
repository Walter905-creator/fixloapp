# Build 27 - GitHub Actions Workflow Execution Instructions

## 📋 Problem Statement Requirements

Execute iOS Build 27 using GitHub Actions workflow with:
- ✅ Platform: ios
- ✅ Profile: production  
- ✅ Working directory: mobile
- ✅ Version: 1.0.27
- ✅ Build Number: 27
- ✅ Workflow: .github/workflows/eas-build.yml
- ✅ EXPO_TOKEN: Available in GitHub Secrets

## 🎯 How to Trigger the Workflow

### Method 1: GitHub Web Interface (RECOMMENDED)

**Step 1**: Navigate to the workflow page:
```
https://github.com/Walter905-creator/fixloapp/actions/workflows/eas-build.yml
```

**Step 2**: Click the "Run workflow" button (dropdown on the right side)

**Step 3**: Fill in the required parameters:
```
Use workflow from: main
platform: ios
profile: production
branch: main
```

**Step 4**: Click the green "Run workflow" button to trigger

**Step 5**: Wait for workflow to appear in the list (~5 seconds)

**Step 6**: Click on the workflow run to see live logs

### Method 2: GitHub CLI

If you have GitHub CLI installed and authenticated:

```bash
# Navigate to repository
cd /home/runner/work/fixloapp/fixloapp

# Run the trigger script
./trigger-build-27-workflow.sh

# Or use gh command directly
gh workflow run eas-build.yml \
  --repo Walter905-creator/fixloapp \
  --ref main \
  --field platform=ios \
  --field profile=production \
  --field branch=main
```

### Method 3: GitHub API with Token

```bash
# Set your GitHub token
export GITHUB_TOKEN="your-github-token"

# Run the trigger script
./trigger-build-27-workflow.sh

# Or use curl directly
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/Walter905-creator/fixloapp/actions/workflows/eas-build.yml/dispatches \
  -d '{"ref":"main","inputs":{"platform":"ios","profile":"production","branch":"main"}}'
```

## 📊 What You'll See After Triggering

### 1. Workflow Run URL

Once triggered, the workflow run will appear at:
```
https://github.com/Walter905-creator/fixloapp/actions/runs/[RUN_ID]
```

Example:
```
https://github.com/Walter905-creator/fixloapp/actions/runs/7234567890
```

You can monitor the workflow in real-time at this URL.

### 2. Job Status Progression

**Initial Status** (0-30 seconds):
```
🟡 Queued - Waiting for runner
```

**During Execution** (2-3 minutes):
```
🔵 In Progress - Running workflow steps
  ✓ Checkout code
  ✓ Setup Node.js 18
  ✓ Validate Expo app
  ✓ Install dependencies
  🔵 Run EAS Build (current)
  ⏳ Show recent builds
```

**Completion** (after 2-3 minutes):
```
🟢 Completed - All steps successful
  ✓ Checkout code
  ✓ Setup Node.js 18
  ✓ Validate Expo app
  ✓ Install dependencies
  ✓ Run EAS Build
  ✓ Show recent builds
```

### 3. EAS Build ID

The workflow logs will contain the Build ID. Look for output like:
```
✔ Build created successfully
Build ID: 12345678-abcd-1234-efgh-123456789012
Build URL: https://expo.dev/accounts/fixlo-app/projects/fixloapp/builds/12345678-abcd-1234-efgh-123456789012
```

**Format**: UUID (36 characters)
**Example**: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### 4. EAS Build Progress

After the workflow completes, the actual iOS build continues on Expo's servers.

**Monitor at Expo Dashboard**:
```
https://expo.dev/accounts/fixlo-app/projects/fixloapp/builds
```

**Build Status Progression**:
```
PENDING (0-5 min)
  ↓
IN_PROGRESS (15-25 min)
  ↓
FINISHED
```

**Build Details You'll See**:
- Platform: iOS
- Version: 1.0.27
- Build Number: 27
- Profile: production
- Status: [PENDING → IN_PROGRESS → FINISHED]
- Owner: fixlo-app
- Project: fixloapp

## 📱 App Store Connect Submission

### After Build Finishes (Status: FINISHED)

**Step 1**: Get the Build ID from workflow logs or Expo dashboard

**Step 2**: Navigate to mobile directory and run submission:
```bash
cd /home/runner/work/fixloapp/fixloapp/mobile

# Set EXPO_TOKEN if not in environment
export EXPO_TOKEN="your-expo-token"

# Run submission script
./submit-build-27.sh <BUILD_ID>
```

**Step 3**: The script will:
- Validate the Build ID
- Verify build is finished
- Confirm build details
- Submit to App Store Connect
- Show submission confirmation

### App Store Submission Confirmation

After submission, you'll see:
```
✅ Submission Successful!

Next Steps:
1. Check App Store Connect
   https://appstoreconnect.apple.com

2. Wait for processing (10-30 minutes)
   Status will change from 'Processing' to 'Ready to Submit'

3. Build will appear in TestFlight
   Navigate to: My Apps → Fixlo → TestFlight → iOS
```

## 🔍 Monitoring Commands

### Monitor Workflow Execution

```bash
# Using monitor script
./monitor-build-27-workflow.sh

# Using gh CLI
gh run watch --repo Walter905-creator/fixloapp

# List recent runs
gh run list --repo Walter905-creator/fixloapp --workflow eas-build.yml --limit 5

# View specific run
gh run view [RUN_ID] --repo Walter905-creator/fixloapp
```

### Monitor EAS Build

```bash
cd mobile

# List recent builds
npx eas-cli@latest build:list --platform ios --limit 5

# View specific build
npx eas-cli@latest build:view <BUILD_ID>
```

## ✅ Verification Checklist

### Workflow Triggered Successfully ✅
- [ ] Workflow appears in Actions tab
- [ ] Run ID generated
- [ ] Status shows "Queued" or "In Progress"
- [ ] Can access workflow run URL

### Workflow Completed Successfully ✅
- [ ] Status shows "Completed" with green checkmark
- [ ] All steps show green checkmarks
- [ ] Build ID appears in logs
- [ ] No error messages in any step

### EAS Build Initiated ✅
- [ ] Build appears in Expo dashboard
- [ ] Build ID matches workflow logs
- [ ] Platform shows: iOS
- [ ] Profile shows: production
- [ ] Version shows: 1.0.27
- [ ] Build number shows: 27

### EAS Build Completed ✅
- [ ] Build status: FINISHED
- [ ] .ipa file generated
- [ ] No build errors
- [ ] Build size looks reasonable

### App Store Submission Complete ✅
- [ ] Submission command succeeded
- [ ] Build uploaded to App Store Connect
- [ ] Build visible in App Store Connect dashboard
- [ ] Build appears under TestFlight → iOS Builds
- [ ] Build number: 27 (1.0.27)
- [ ] Status: "Waiting for Review" or "Ready to Submit"

## 📋 Expected URLs After Execution

| Resource | URL Format | Example |
|----------|------------|---------|
| **Workflow Run** | `https://github.com/Walter905-creator/fixloapp/actions/runs/[RUN_ID]` | `https://github.com/Walter905-creator/fixloapp/actions/runs/7234567890` |
| **EAS Build** | `https://expo.dev/accounts/fixlo-app/projects/fixloapp/builds/[BUILD_ID]` | `https://expo.dev/accounts/fixlo-app/projects/fixloapp/builds/a1b2c3d4-...` |
| **App Store Connect** | `https://appstoreconnect.apple.com/apps/[APP_ID]/testflight/ios` | Access via My Apps → Fixlo → TestFlight |

## ⏱️ Timeline and Durations

| Phase | Expected Duration | Status |
|-------|------------------|--------|
| **Workflow Trigger** | Instant | Manual action |
| **Workflow Queue** | 0-30 seconds | GitHub managed |
| **Workflow Execution** | 2-3 minutes | GitHub Actions |
| **EAS Build Queue** | 0-5 minutes | Expo managed |
| **EAS Build Process** | 15-25 minutes | Expo servers |
| **App Store Submission** | 2-5 minutes | Manual/scripted |
| **App Store Processing** | 10-30 minutes | Apple managed |
| **TestFlight Availability** | Instant | After processing |
| **TOTAL** | **30-60 minutes** | End to end |

## 🎯 Summary of What Will Happen

1. **You trigger the workflow** via GitHub Web UI, CLI, or API
2. **GitHub Actions starts** the workflow on Ubuntu runner
3. **Workflow checks out code** from main branch
4. **Workflow sets up** Node.js 18 with npm caching
5. **Workflow validates** Expo app exists in mobile/
6. **Workflow installs** dependencies with `npm ci`
7. **Workflow runs EAS build** with EXPO_TOKEN from secrets
8. **EAS receives** build request and queues it
9. **EAS builds** iOS app (15-25 minutes)
10. **Build finishes** and .ipa is generated
11. **You submit** to App Store Connect with script
12. **App Store processes** the build (10-30 minutes)
13. **Build appears** in TestFlight for testing

## 📞 Important Links

### Trigger Workflow Here
```
https://github.com/Walter905-creator/fixloapp/actions/workflows/eas-build.yml
```
Click "Run workflow" → Set parameters → Click green button

### View All Workflow Runs
```
https://github.com/Walter905-creator/fixloapp/actions
```

### Monitor Builds on Expo
```
https://expo.dev/accounts/fixlo-app/projects/fixloapp/builds
```

### App Store Connect
```
https://appstoreconnect.apple.com
```
Navigate to: My Apps → Fixlo → TestFlight → iOS

## 🎉 Ready to Execute

**All systems are GO**:
- ✅ Workflow configured correctly
- ✅ Build parameters set (v1.0.27, build 27)
- ✅ EXPO_TOKEN available in GitHub Secrets
- ✅ Scripts created for monitoring and submission
- ✅ Documentation complete

**NEXT ACTION**: 
1. Go to: https://github.com/Walter905-creator/fixloapp/actions/workflows/eas-build.yml
2. Click "Run workflow"
3. Set: platform=ios, profile=production, branch=main
4. Click green "Run workflow" button
5. Monitor at the workflow run URL that appears

---

**Date**: December 4, 2025  
**Build**: 27 (v1.0.27)  
**Status**: READY TO TRIGGER  
**Method**: GitHub Actions Workflow  
**Location**: .github/workflows/eas-build.yml
