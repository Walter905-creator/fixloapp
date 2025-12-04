# Build 27 - GitHub Actions Execution Guide

## 🎯 Objective

Execute iOS Build 27 using GitHub Actions workflow with the following parameters:
- **Platform**: ios
- **Profile**: production  
- **Working Directory**: mobile
- **Version**: 1.0.27
- **Build Number**: 27

## ✅ Pre-Execution Verification

All prerequisites have been verified and are ready:

### Configuration Status
- ✅ **Workflow File**: `.github/workflows/eas-build.yml` exists and is properly configured
- ✅ **Version**: 1.0.27 set in `mobile/app.config.js`
- ✅ **Build Number**: 27 set in `mobile/app.config.js` for iOS
- ✅ **Expo Owner**: fixlo-app (paid account)
- ✅ **EXPO_TOKEN**: Available in GitHub Secrets
- ✅ **Working Directory**: Workflow configured with `working-directory: mobile`

### Workflow Configuration Details

The workflow is configured in `.github/workflows/eas-build.yml` with:

```yaml
on:
  workflow_dispatch:
    inputs:
      platform:
        type: choice
        options: [ios, android]
        required: true
      profile:
        type: choice
        options: [development, preview, production]
        required: true
      branch:
        default: main
        required: true

jobs:
  eas-build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: mobile
```

**Key Features**:
- Uses `workflow_dispatch` for manual triggering
- Automatically runs in `mobile` directory
- Uses EXPO_TOKEN from GitHub Secrets
- Runs on Ubuntu latest
- Uses Node.js 18
- Validates Expo app presence before building

## 🚀 Execution Methods

### Method 1: GitHub Web UI (Recommended)

This is the easiest and most reliable method.

#### Steps:

1. **Navigate to Actions**
   ```
   https://github.com/Walter905-creator/fixloapp/actions
   ```

2. **Select the EAS Build Workflow**
   - In the left sidebar, click "EAS Build"
   - Or go directly to:
     ```
     https://github.com/Walter905-creator/fixloapp/actions/workflows/eas-build.yml
     ```

3. **Click "Run workflow"**
   - Look for the "Run workflow" button on the right side
   - Click the dropdown

4. **Fill in Parameters**
   ```
   Use workflow from: main
   platform: ios
   profile: production
   branch: main
   ```

5. **Trigger the Workflow**
   - Click the green "Run workflow" button
   - The workflow will start immediately

6. **Monitor Progress**
   - The workflow run will appear in the list
   - Click on it to see detailed logs
   - Estimated time: 15-25 minutes

### Method 2: GitHub CLI

If you have GitHub CLI installed and authenticated:

```bash
cd /home/runner/work/fixloapp/fixloapp

# Run the trigger script
./trigger-build-27-workflow.sh
```

Or manually:

```bash
gh workflow run eas-build.yml \
  --repo Walter905-creator/fixloapp \
  --ref main \
  --field platform=ios \
  --field profile=production \
  --field branch=main
```

### Method 3: GitHub API

Using curl with a GitHub token:

```bash
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/Walter905-creator/fixloapp/actions/workflows/eas-build.yml/dispatches \
  -d '{"ref":"main","inputs":{"platform":"ios","profile":"production","branch":"main"}}'
```

## 📊 Expected Workflow Execution

### Workflow Steps

The workflow will execute the following steps:

1. **Checkout Code**
   - Checks out the `main` branch
   - Uses `actions/checkout@v4`

2. **Setup Node.js**
   - Installs Node.js version 18
   - Caches npm dependencies from `mobile/package-lock.json`

3. **Validate Expo App**
   - Verifies `app.json` or `app.config.*` exists in mobile/
   - Ensures build will proceed from correct directory

4. **Install Dependencies**
   - Runs `npm ci` in mobile directory
   - Installs all required packages

5. **Verify EAS CLI**
   - Runs `npx eas-cli@latest --version`
   - Confirms EAS CLI is available

6. **Run EAS Build**
   - Platform: iOS
   - Profile: production
   - Non-interactive mode
   - No-wait mode (returns immediately)
   - Uses EXPO_TOKEN from secrets

7. **Show Recent Builds**
   - Lists the 5 most recent builds
   - Helps identify the new build

### Expected Output

#### Build Initiation
```
✔ Build created successfully
Build ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Build URL: https://expo.dev/accounts/fixlo-app/projects/fixloapp/builds/...
```

#### Build Details
- **Platform**: iOS
- **Profile**: production
- **Version**: 1.0.27
- **Build Number**: 27
- **Owner**: fixlo-app
- **Project**: fixloapp
- **Status**: Queued → In Progress → Finished

## 🔍 Monitoring the Build

### During Workflow Execution

1. **Workflow Run URL**
   ```
   https://github.com/Walter905-creator/fixloapp/actions/runs/[RUN_ID]
   ```
   - Shows real-time progress of each step
   - Displays console output
   - Updates status automatically

2. **Job Status Indicators**
   - 🟡 **Queued**: Waiting for runner
   - 🔵 **In Progress**: Currently executing
   - 🟢 **Completed**: Finished successfully
   - 🔴 **Failed**: Encountered an error

### After EAS Build Starts

1. **Expo Dashboard**
   ```
   https://expo.dev/accounts/fixlo-app/projects/fixloapp/builds
   ```
   - Shows all builds for the project
   - Build 27 will appear at the top
   - Real-time status updates

2. **EAS Build ID**
   - Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - Displayed in workflow logs
   - Also visible in Expo dashboard

3. **Build Progress**
   - **Queued**: Waiting for build server
   - **In Progress**: Building iOS app
   - **Finished**: Build completed successfully
   - **Failed**: Build encountered an error

## 📱 App Store Connect Submission

### Automatic Submission

The workflow uses `--no-wait` flag, which starts the build but doesn't wait for completion. After the build finishes on Expo's servers, you need to submit to App Store Connect.

### Manual Submission Steps

1. **Wait for Build to Complete**
   - Monitor in Expo dashboard
   - Typically takes 15-25 minutes
   - Status changes to "Finished"

2. **Get Build ID**
   - From workflow logs, or
   - From Expo dashboard
   - Copy the full UUID

3. **Submit to App Store**
   ```bash
   cd /home/runner/work/fixloapp/fixloapp/mobile
   npx eas-cli@latest submit \
     --platform ios \
     --id [BUILD_ID] \
     --non-interactive
   ```

   Or use the automated script:
   ```bash
   cd /home/runner/work/fixloapp/fixloapp/mobile
   ./scripts/submit-build-27.sh [BUILD_ID]
   ```

### Submission Process

1. **EAS Upload**
   - EAS downloads the .ipa from build
   - Validates app metadata
   - Uploads to App Store Connect

2. **App Store Connect Processing**
   - Status: "Waiting for Review"
   - Processing time: 10-30 minutes
   - Appears in App Store Connect

3. **TestFlight Availability**
   - Automatically available in TestFlight
   - No additional approval needed
   - Can be shared with testers

## 🎯 Success Verification

### Workflow Completion Checklist

- [ ] Workflow status: Completed (green checkmark)
- [ ] EAS build initiated successfully
- [ ] Build ID captured from logs
- [ ] No error messages in workflow logs
- [ ] All steps completed successfully

### Build Completion Checklist

- [ ] Build visible in Expo dashboard
- [ ] Build status: Finished
- [ ] Build number: 27
- [ ] Version: 1.0.27
- [ ] Platform: iOS
- [ ] Profile: production
- [ ] Owner: fixlo-app

### App Store Submission Checklist

- [ ] Submission command executed
- [ ] Upload to App Store Connect successful
- [ ] Build appears in App Store Connect
- [ ] Build number: 27
- [ ] Version: 1.0.27
- [ ] Status: "Waiting for Review" or "Ready to Submit"

### TestFlight Verification

- [ ] Build appears in TestFlight
- [ ] Build number: 27 (1.0.27)
- [ ] Status: Available for testing
- [ ] No compliance warnings
- [ ] Can be shared with testers

## 📋 Quick Reference

### Important URLs

| Resource | URL |
|----------|-----|
| GitHub Actions Workflows | https://github.com/Walter905-creator/fixloapp/actions |
| EAS Build Workflow | https://github.com/Walter905-creator/fixloapp/actions/workflows/eas-build.yml |
| Expo Dashboard | https://expo.dev/accounts/fixlo-app/projects/fixloapp |
| Expo Builds | https://expo.dev/accounts/fixlo-app/projects/fixloapp/builds |
| App Store Connect | https://appstoreconnect.apple.com |

### Build Parameters

| Parameter | Value |
|-----------|-------|
| Platform | ios |
| Profile | production |
| Branch | main |
| Version | 1.0.27 |
| Build Number | 27 |
| Working Directory | mobile |

### Key Commands

```bash
# Trigger workflow (with gh CLI)
gh workflow run eas-build.yml \
  --repo Walter905-creator/fixloapp \
  --ref main \
  --field platform=ios \
  --field profile=production \
  --field branch=main

# Watch workflow execution
gh run watch --repo Walter905-creator/fixloapp

# List recent runs
gh run list --repo Walter905-creator/fixloapp --workflow eas-build.yml --limit 5

# Submit to App Store (after build completes)
cd mobile
npx eas-cli@latest submit --platform ios --id [BUILD_ID] --non-interactive
```

## 🔧 Troubleshooting

### Workflow Won't Start

**Issue**: Workflow doesn't appear after clicking "Run workflow"

**Solutions**:
1. Refresh the page
2. Check if you have permissions to run workflows
3. Verify you're on the correct repository
4. Try using gh CLI or API method

### Build Fails in Workflow

**Issue**: EAS build step fails

**Common Causes**:
1. EXPO_TOKEN not set or invalid
2. Configuration mismatch in app.config.js
3. Network issues with Expo servers
4. Insufficient build capacity

**Solutions**:
1. Verify EXPO_TOKEN in repository secrets
2. Check workflow logs for specific error
3. Retry the workflow
4. Contact Expo support if persistent

### Submission Fails

**Issue**: Cannot submit to App Store Connect

**Common Causes**:
1. Build not finished yet
2. Invalid build ID
3. App Store Connect credentials issue
4. App record not configured

**Solutions**:
1. Wait for build to show "Finished" status
2. Double-check build ID from Expo dashboard
3. Verify App Store Connect API key is configured
4. Ensure app record exists in App Store Connect

## 📞 Support Resources

### Expo Documentation
- EAS Build: https://docs.expo.dev/build/introduction/
- Submit to Stores: https://docs.expo.dev/submit/introduction/
- Troubleshooting: https://docs.expo.dev/build-reference/troubleshooting/

### GitHub Actions Documentation
- Workflow Dispatch: https://docs.github.com/en/actions/using-workflows/manually-running-a-workflow
- Workflow Syntax: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions

### Repository Files
- Workflow: `.github/workflows/eas-build.yml`
- App Config: `mobile/app.config.js`
- EAS Config: `mobile/eas.json`
- Trigger Script: `trigger-build-27-workflow.sh`

## ✅ Ready to Execute

All configuration is complete and verified. Build 27 is ready to execute through GitHub Actions.

**Recommended Method**: GitHub Web UI
**Estimated Total Time**: 20-30 minutes
**Next Step**: Navigate to GitHub Actions and click "Run workflow"

---

**Last Updated**: December 4, 2025  
**Status**: ✅ READY FOR EXECUTION  
**Configuration**: VERIFIED  
**EXPO_TOKEN**: AVAILABLE IN SECRETS
