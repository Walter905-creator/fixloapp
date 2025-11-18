# ✅ Final Submission Checklist - Build 22
## Fixlo iOS App Store Submission - Step-by-Step Guide

---

## 📋 OVERVIEW

This is your complete, step-by-step checklist for submitting Fixlo Build 22 to the Apple App Store. Follow each step in order and check off items as you complete them.

**Build Number**: 22  
**Version**: 1.0.2  
**Bundle ID**: com.fixloapp.mobile  
**Target Date**: November 18, 2025  

---

## PHASE 1: PRE-BUILD VERIFICATION ✅

### Code Quality Verification
- [x] Build number in app.config.js is 22
- [x] Version in app.config.js is 1.0.2
- [x] Version in package.json matches (1.0.2)
- [x] All console.log statements wrapped in __DEV__
- [x] All console.error statements wrapped in __DEV__
- [x] No localhost references in production code
- [x] API endpoints point to production
- [x] No "beta", "test", "debug" text in UI
- [x] No placeholder text in screens
- [x] No "TODO" or "FIXME" comments in production code

### Apple Pay & Subscription Configuration
- [x] Merchant ID configured: merchant.com.fixloapp.mobile
- [x] Entitlements set in app.config.js
- [x] Subscription product ID referenced: com.fixloapp.mobile.pro.monthly
- [x] Pricing displayed correctly: $59.99/month
- [x] Subscription terms shown in UI
- [x] Auto-renewal information displayed
- [x] Cancel policy explained

### Permission Descriptions (Info.plist)
- [x] NSCameraUsageDescription: "Allow Fixlo to access your camera for profile photos."
- [x] NSPhotoLibraryUsageDescription: "Allow Fixlo to access your photo library for uploads."
- [x] NSLocationWhenInUseUsageDescription: "Allow Fixlo to use your location to show nearby services."
- [x] ITSAppUsesNonExemptEncryption: false

### Assets
- [x] App icon: 1024x1024 PNG, RGB, no transparency
- [x] Splash screen: professional design
- [x] All service icons present and correct
- [x] No missing images in app
- [x] Logo displays correctly

---

## PHASE 2: BUILD CREATION 🔨

### EAS Build Setup
- [ ] **Step 1**: Ensure EAS CLI is installed
  ```bash
  npm install -g eas-cli
  ```

- [ ] **Step 2**: Login to Expo account
  ```bash
  eas login
  ```
  - Use Fixlo's Expo account credentials
  - Verify login successful

- [ ] **Step 3**: Navigate to mobile directory
  ```bash
  cd /path/to/fixloapp/mobile
  ```

- [ ] **Step 4**: Verify eas.json is configured
  - Check production profile exists
  - Verify iOS settings are correct

### Build Execution
- [ ] **Step 5**: Start iOS production build
  ```bash
  eas build --platform ios --profile production
  ```

- [ ] **Step 6**: Monitor build progress
  - Build URL: https://expo.dev/accounts/fixloapp/projects/fixloapp/builds
  - Estimated time: 15-25 minutes
  - Watch for errors in build logs

- [ ] **Step 7**: Wait for build completion
  - Status should show "Finished"
  - Download URL will be provided
  - Build artifact: .ipa file

- [ ] **Step 8**: Download build (optional)
  - Click download link in EAS dashboard
  - Save .ipa file locally for backup

**Build Status**: ☐ Success ☐ Failed (if failed, check logs and retry)

---

## PHASE 3: APP STORE CONNECT SETUP 🍎

### Access App Store Connect
- [ ] **Step 1**: Go to https://appstoreconnect.apple.com
- [ ] **Step 2**: Login with Apple Developer account
- [ ] **Step 3**: Navigate to "My Apps"
- [ ] **Step 4**: Click on Fixlo app (or create if first time)

### Create New Version
- [ ] **Step 5**: Click "+" to create new version
- [ ] **Step 6**: Enter version number: **1.0.2**
- [ ] **Step 7**: Click "Create"

---

## PHASE 4: APP INFORMATION 📱

### Basic Information
- [ ] **App Name**: Fixlo - Home Services
- [ ] **Subtitle** (30 char max): Trusted Home Service Pros
- [ ] **Privacy Policy URL**: https://fixloapp.com/privacy-policy.html
  - [ ] Verify URL is accessible
  - [ ] Verify content is appropriate
- [ ] **Terms of Service URL**: https://fixloapp.com/terms.html (optional)

### Categories
- [ ] **Primary Category**: Lifestyle
- [ ] **Secondary Category**: Business (optional)
- [ ] **Age Rating**: 4+ (No objectionable content)

### Contact Information
- [ ] **Support URL**: https://fixloapp.com/support
  - [ ] Verify URL is accessible
- [ ] **Marketing URL**: https://fixloapp.com
  - [ ] Verify URL is accessible

---

## PHASE 5: SUBSCRIPTION CONFIGURATION 💳

### In-App Purchase Setup
- [ ] **Step 1**: Go to "Features" > "In-App Purchases"
- [ ] **Step 2**: Create subscription group: "Fixlo Pro"
- [ ] **Step 3**: Create subscription:
  - Product ID: com.fixloapp.mobile.pro.monthly
  - Reference Name: Fixlo Pro Monthly
  - Subscription Duration: 1 month
  - Price: $59.99 USD

- [ ] **Step 4**: Add subscription details:
  - **Display Name**: Fixlo Pro Membership
  - **Description**: 
    ```
    Fixlo Pro Membership - Unlimited Access to Job Leads

    Get unlimited access to homeowner job requests in your service area. Receive instant push notifications when new jobs are posted. Grow your business with a steady stream of qualified leads.

    Features:
    • Unlimited job leads
    • Real-time push notifications
    • Professional dashboard
    • Direct client messaging
    • Build your reputation with reviews
    • Mobile-first experience

    $59.99 per month, auto-renewable
    Cancel anytime in your device Settings
    ```

- [ ] **Step 5**: Add App Store promotional image (optional)
- [ ] **Step 6**: Submit subscription for review
- [ ] **Step 7**: Wait for approval (can submit app before this)

---

## PHASE 6: VERSION INFORMATION 📝

### What's New
- [ ] Copy content from `APP_STORE_CONNECT_COPY_PASTE.md`
- [ ] Paste into "What's New in This Version" field
- [ ] Verify character count is under 4000
- [ ] Verify formatting looks good
- [ ] Preview text

### Promotional Text
- [ ] Copy from `APP_STORE_CONNECT_COPY_PASTE.md`
- [ ] Paste into "Promotional Text" field
- [ ] Verify character count is under 170
- [ ] This text can be updated anytime without new version

### Description
- [ ] Copy full description from `APP_STORE_CONNECT_COPY_PASTE.md`
- [ ] Paste into "Description" field
- [ ] Verify character count is under 4000
- [ ] Check formatting with preview
- [ ] Verify all features are mentioned:
  - [ ] 10 service categories listed
  - [ ] Free for homeowners mentioned
  - [ ] $59.99/month for pros mentioned
  - [ ] Apple Pay mentioned
  - [ ] Privacy information included

### Keywords
- [ ] Copy keywords from `APP_STORE_CONNECT_COPY_PASTE.md`
- [ ] Paste into "Keywords" field
- [ ] Verify character count is under 100 characters
- [ ] Keywords: home services,plumber,electrician,hvac,handyman,contractor,repairs,cleaning,roofing,local pros

---

## PHASE 7: SCREENSHOTS 📸

### iPhone Screenshots Required
Must provide screenshots for at least one iPhone size:

**6.7" Display (iPhone 14 Pro Max, 15 Pro Max)**
- Resolution: 1290 x 2796 pixels
- [ ] Screenshot 1: Home/Welcome screen with service categories
- [ ] Screenshot 2: Service selection or search
- [ ] Screenshot 3: Homeowner dashboard
- [ ] Screenshot 4: Job request form
- [ ] Screenshot 5: Pro dashboard
- [ ] Screenshot 6: Pro subscription screen
- [ ] Screenshot 7: Messaging/Chat screen
- [ ] Screenshot 8: Notifications or settings (optional)

**Alternative: 6.5" Display (iPhone 11 Pro Max, XS Max)**
- Resolution: 1242 x 2688 pixels
- Same screenshots as above if not using 6.7"

### iPad Screenshots (Required - App supports iPad)
**12.9" iPad Pro (3rd gen and later)**
- Resolution: 2048 x 2732 pixels (portrait)
- [ ] Screenshot 1: iPad home screen
- [ ] Screenshot 2: iPad dashboard view
- [ ] Screenshot 3: iPad messaging or job view
- Minimum 3 screenshots required

**Alternative: 11" iPad Pro**
- Resolution: 1668 x 2388 pixels
- Same content as 12.9" screenshots

### Screenshot Captions
For each screenshot, add caption from `APP_STORE_CONNECT_COPY_PASTE.md`:
- [ ] Caption 1: Browse 10 Service Categories - Plumbing, Electrical, HVAC, and More
- [ ] Caption 2: Find Local Professionals for Any Home Service Need
- [ ] Caption 3: Post Job Requests and Connect with Verified Pros - Free for Homeowners
- [ ] Caption 4: Simple Job Posting in Under 2 Minutes
- [ ] Caption 5: Professional Dashboard with Real-Time Job Notifications
- [ ] Caption 6: Unlimited Job Leads - $59.99/month with Apple Pay
- [ ] Caption 7: Secure In-App Chat to Discuss Project Details
- [ ] Caption 8: Instant Push Notifications for New Job Opportunities

### Screenshot Quality Check
- [ ] All screenshots show actual app (not mockups)
- [ ] Screenshots are crisp and clear
- [ ] No outdated UI in screenshots
- [ ] Screenshots show different features (not all same screen)
- [ ] Text in screenshots is readable
- [ ] Screenshots follow Apple's guidelines (no overlays, no device frames)

---

## PHASE 8: BUILD UPLOAD & SELECTION 📦

### Upload Build to App Store Connect
Choose one method:

**Method A: EAS Submit (Recommended)**
- [ ] Run command:
  ```bash
  eas submit --platform ios --profile production
  ```
- [ ] Provide Apple ID credentials when prompted
- [ ] Wait for upload completion (5-10 minutes)

**Method B: Transporter App**
- [ ] Download .ipa from EAS dashboard
- [ ] Open Transporter app on Mac
- [ ] Drag .ipa file into Transporter
- [ ] Click "Deliver"
- [ ] Wait for upload completion

### Build Processing
- [ ] Wait for build to process (5-15 minutes)
- [ ] Refresh App Store Connect
- [ ] Build should appear in "Build" section
- [ ] Status changes from "Processing" to "Ready"

### Select Build
- [ ] In version 1.0.2, click "Build" section
- [ ] Click "+" to select build
- [ ] Choose Build 22 from list
- [ ] Verify build number: 22
- [ ] Verify version: 1.0.2
- [ ] Click "Done"

### Export Compliance
- [ ] Answer export compliance questions:
  - **Does your app use encryption?** Yes (HTTPS)
  - **Is your app exempt?** Yes (standard encryption only)
- [ ] Verify ITSAppUsesNonExemptEncryption is false in build

---

## PHASE 9: APP REVIEW INFORMATION 👨‍⚖️

### Demo Account Credentials
- [ ] Click "App Review Information"
- [ ] Check "Sign-in required"
- [ ] Add Homeowner demo account:
  ```
  Username: demo.homeowner@fixloapp.com
  Password: Demo2025!
  ```
- [ ] Click "Add Additional Username and Password"
- [ ] Add Professional demo account:
  ```
  Username: demo.pro@fixloapp.com
  Password: Demo2025!
  ```

### Contact Information
- [ ] **First Name**: Walter (or your first name)
- [ ] **Last Name**: [Your last name]
- [ ] **Email**: walter@fixloapp.com
- [ ] **Phone**: [Your phone with country code]
  - Format: +1 XXX XXX XXXX

### Review Notes
- [ ] Add notes for reviewers:
  ```
  Please test using the demo accounts provided above. The homeowner account is free to use. The Pro account subscription can be tested using an App Store Connect Sandbox tester account. All features are fully functional and ready for production use.

  Key Features to Test:
  - Service category browsing (10 categories)
  - Homeowner job request form
  - Professional signup and Apple Pay subscription ($59.99/month)
  - Real-time messaging between users
  - Push notifications for new jobs
  - iPad optimization and responsiveness

  All navigation paths work correctly with no blank screens. The app has been thoroughly tested on both iPhone and iPad devices.

  Contact: walter@fixloapp.com for any questions.
  ```

### Attachments (Optional)
- [ ] Add demo video if available
- [ ] Add additional documentation if needed

---

## PHASE 10: TESTFLIGHT (Optional but Recommended) 🧪

### Internal Testing
- [ ] Go to "TestFlight" section
- [ ] Build 22 should appear automatically
- [ ] Add internal testers:
  - [ ] Add your email
  - [ ] Add team members' emails
  - [ ] Click "Add Testers"

- [ ] Send test invitation
- [ ] Install TestFlight app on devices
- [ ] Install Fixlo Build 22
- [ ] Test critical flows (30-60 minutes):
  - [ ] Login with both demo accounts
  - [ ] Post a job as homeowner
  - [ ] Browse jobs as pro
  - [ ] Test Apple Pay subscription (Sandbox)
  - [ ] Test messaging
  - [ ] Test on iPad
  - [ ] Test push notifications

### External Testing (Optional)
- [ ] Create external testing group
- [ ] Add beta testers
- [ ] Provide testing instructions from `TESTFLIGHT_TESTING_GUIDE.md`
- [ ] Collect feedback
- [ ] Fix critical bugs if found

---

## PHASE 11: PRE-SUBMISSION VALIDATION ✓

### Final Checklist
Review everything one more time:

**Content**
- [ ] App name is correct: "Fixlo - Home Services"
- [ ] Version is 1.0.2
- [ ] Build 22 is selected
- [ ] All URLs are accessible
- [ ] Privacy Policy is up-to-date
- [ ] Screenshots show actual app
- [ ] Description is compelling
- [ ] Keywords are relevant

**Metadata**
- [ ] Promotional text added
- [ ] What's New text added
- [ ] Description added
- [ ] Keywords added
- [ ] Screenshots uploaded (min 3 iPhone + 3 iPad)
- [ ] Categories selected
- [ ] Age rating is 4+

**Build**
- [ ] Build 22 uploaded and processed
- [ ] Build selected for version 1.0.2
- [ ] Export compliance answered
- [ ] No warnings on build

**Review Info**
- [ ] Demo accounts added and tested
- [ ] Contact info added
- [ ] Review notes added
- [ ] Sign-in required checked

**Subscription**
- [ ] Subscription product created
- [ ] Product ID matches app: com.fixloapp.mobile.pro.monthly
- [ ] Price is $59.99/month
- [ ] Subscription description added

**Testing**
- [ ] Tested on iPhone
- [ ] Tested on iPad
- [ ] Demo accounts work
- [ ] No crashes
- [ ] All features functional

---

## PHASE 12: SUBMIT FOR REVIEW 🚀

### Final Steps
- [ ] **Step 1**: Review all sections one final time
- [ ] **Step 2**: Check for any yellow warnings
- [ ] **Step 3**: Resolve any issues
- [ ] **Step 4**: Click "Add for Review" (top right)
- [ ] **Step 5**: Review submission summary
- [ ] **Step 6**: Confirm all information is correct
- [ ] **Step 7**: Click "Submit for Review"

### Submission Confirmation
- [ ] Verify submission confirmation appears
- [ ] Status changes to "Waiting for Review"
- [ ] You receive confirmation email
- [ ] Note submission date and time

### Post-Submission
- [ ] Monitor App Store Connect daily
- [ ] Check email for Apple communications
- [ ] Be ready to respond to questions within 24 hours
- [ ] Status timeline:
  - Waiting for Review: 0-2 days
  - In Review: 1-48 hours
  - Pending Developer Release or Ready for Sale: After approval

---

## PHASE 13: DURING REVIEW 👀

### Monitoring
- [ ] Check App Store Connect daily
- [ ] Read any messages from App Review
- [ ] Respond to questions promptly (within 24 hours)

### Common Review Issues & Responses

**If Rejected for Guideline 2.1 (Completeness)**
- Response: "We have tested all features thoroughly. Please use the demo accounts provided. [Provide specific testing instructions]"

**If Rejected for Guideline 2.3 (Screenshots)**
- Response: "We have updated screenshots to show [specific features]. Please review the new screenshots."

**If Rejected for Guideline 3.1 (In-App Purchase)**
- Response: "Our subscription uses Apple's In-App Purchase system. Merchant ID: merchant.com.fixloapp.mobile. Product ID: com.fixloapp.mobile.pro.monthly."

**If Rejected for Guideline 4.0 (Design)**
- Response: "We have tested on iPad Air 11-inch and iPad Pro. All buttons are responsive. [Provide video if needed]"

### Be Prepared To
- [ ] Answer questions about app functionality
- [ ] Provide additional screenshots
- [ ] Clarify subscription terms
- [ ] Explain demo account usage
- [ ] Provide video demonstration
- [ ] Update metadata if requested

---

## PHASE 14: APPROVAL & RELEASE 🎉

### Upon Approval
- [ ] Receive approval email
- [ ] Status changes to "Pending Developer Release"
- [ ] Review release options:
  - [ ] **Automatic**: Release immediately
  - [ ] **Manual**: Release when you choose
  - [ ] **Scheduled**: Release on specific date

### Release Options
**Option A: Immediate Release (Recommended)**
- [ ] Click "Release This Version"
- [ ] App goes live within 24 hours
- [ ] Available in App Store immediately

**Option B: Scheduled Release**
- [ ] Set release date
- [ ] Set release time
- [ ] App releases automatically

**Option C: Manual Release**
- [ ] Keep "Pending Developer Release"
- [ ] Release when marketing ready
- [ ] Click "Release This Version" when ready

### Post-Release
- [ ] Verify app appears in App Store (search "Fixlo")
- [ ] Test download on fresh device
- [ ] Verify all metadata displays correctly
- [ ] Check screenshots display properly
- [ ] Test subscription flow with real account
- [ ] Monitor crash reports
- [ ] Monitor user reviews
- [ ] Respond to user feedback

---

## 📊 PROGRESS TRACKING

**Overall Progress**: _____ / 14 Phases Complete

| Phase | Status | Completion Date | Notes |
|-------|--------|-----------------|-------|
| 1. Pre-Build Verification | ✅ | Nov 18, 2025 | All checks passed |
| 2. Build Creation | ☐ | | |
| 3. App Store Connect Setup | ☐ | | |
| 4. App Information | ☐ | | |
| 5. Subscription Config | ☐ | | |
| 6. Version Information | ☐ | | |
| 7. Screenshots | ☐ | | |
| 8. Build Upload | ☐ | | |
| 9. App Review Info | ☐ | | |
| 10. TestFlight | ☐ | | Optional |
| 11. Pre-Submission Validation | ☐ | | |
| 12. Submit for Review | ☐ | | |
| 13. During Review | ☐ | | |
| 14. Approval & Release | ☐ | | |

---

## 📞 SUPPORT & RESOURCES

### Documentation
- Full Metadata: `IOS_BUILD_22_APP_STORE_METADATA.md`
- Copy/Paste Guide: `APP_STORE_CONNECT_COPY_PASTE.md`
- Testing Guide: `TESTFLIGHT_TESTING_GUIDE.md`
- This Checklist: `BUILD_22_SUBMISSION_CHECKLIST.md`

### Apple Resources
- App Store Connect: https://appstoreconnect.apple.com
- Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Developer Forum: https://developer.apple.com/forums/

### Expo Resources
- EAS Dashboard: https://expo.dev/accounts/fixloapp/projects/fixloapp
- EAS Builds: https://expo.dev/accounts/fixloapp/projects/fixloapp/builds
- Expo Docs: https://docs.expo.dev/

### Contact
- **Email**: walter@fixloapp.com
- **Support**: https://fixloapp.com/support

---

## 🎯 SUCCESS CRITERIA

Build 22 submission is successful when:

✅ Build uploaded and processed without errors  
✅ All metadata complete and accurate  
✅ Screenshots show actual app features  
✅ Subscription properly configured  
✅ Demo accounts work correctly  
✅ Submitted for review  
✅ Passed App Review  
✅ Live in App Store  

---

**Good luck with your submission! 🚀**

**Build**: 22  
**Version**: 1.0.2  
**Status**: Ready for Submission ✅  
**Last Updated**: November 18, 2025
