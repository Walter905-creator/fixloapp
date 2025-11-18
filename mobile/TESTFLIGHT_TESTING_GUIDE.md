# 🧪 TestFlight Testing Guide - Build 22
## Fixlo iOS App - Professional Beta Testing Instructions

---

## 📋 OVERVIEW

Thank you for testing **Fixlo Build 22**! This is a comprehensive guide to help you thoroughly test all features before our App Store submission. Please follow each section carefully and report any issues you encounter.

**Estimated Testing Time**: 60-90 minutes  
**Build Number**: 22  
**Version**: 1.0.2  
**Test Date**: November 18, 2025  

---

## 🔐 DEMO TEST ACCOUNTS

Use these accounts for testing. **Do NOT create real accounts with personal information during testing.**

### Homeowner Account
```
Email: demo.homeowner@fixloapp.com
Password: Demo2025!
```
**Use for**: Testing job posting, messaging, browsing services

### Professional Account
```
Email: demo.pro@fixloapp.com
Password: Demo2025!
```
**Use for**: Testing Pro dashboard, job alerts, subscription flow

### Apple Pay Testing
For testing the $59.99/month Pro subscription, you'll need a **Sandbox Tester Account**:
1. Go to App Store Connect (if you have access)
2. Create a Sandbox Tester account
3. Sign out of App Store on your device
4. When prompted during subscription, sign in with Sandbox account
5. **IMPORTANT**: Do NOT use real payment methods!

---

## ✅ TESTING CHECKLIST

### Test 1: Initial App Launch (5 minutes)
**Goal**: Verify app launches smoothly and displays welcome screen

- [ ] **Step 1**: Download Fixlo from TestFlight
- [ ] **Step 2**: Open the app for the first time
- [ ] **Step 3**: Verify app launches within 3 seconds
- [ ] **Step 4**: Confirm welcome screen displays with Fixlo logo
- [ ] **Step 5**: Check that app doesn't crash or freeze
- [ ] **Step 6**: Verify no error messages appear

**Expected Result**: Clean welcome screen with two main options: "I Need a Service" and "I'm a Pro"

**Report if**:
- App takes longer than 5 seconds to launch
- Blank white or black screen appears
- App crashes immediately
- Error messages displayed

---

### Test 2: Service Discovery (10 minutes)
**Goal**: Test browsing 10 service categories

- [ ] **Step 1**: From home screen, view all 10 service categories:
  - 🔧 Plumbing
  - ⚡ Electrical
  - 🧹 Cleaning
  - 🏠 Roofing
  - ❄️ HVAC
  - 🪚 Carpentry
  - 🎨 Painting
  - 🌳 Landscaping
  - 🚛 Junk Removal
  - 🔨 Handyman

- [ ] **Step 2**: Tap each service category button
- [ ] **Step 3**: Verify each button shows correct icon and color
- [ ] **Step 4**: Confirm button tap provides visual feedback
- [ ] **Step 5**: Test the search bar at top of screen
- [ ] **Step 6**: Search for "plumbing" and verify results

**Expected Result**: All 10 service categories display correctly with proper icons, colors, and descriptions

**Report if**:
- Any service button is missing
- Icons don't match service type
- Buttons are unresponsive (especially on iPad)
- Search doesn't work

---

### Test 3: Homeowner Job Request (15 minutes)
**Goal**: Test complete job posting flow

**Prerequisites**: Use demo homeowner account or create test account

- [ ] **Step 1**: Tap "I Need a Service" or "Post a Job"
- [ ] **Step 2**: Fill out job request form:
  - Select service type from dropdown
  - Enter job description (min 10 characters)
  - Add location/address
  - Upload photo (optional)

- [ ] **Step 3**: Submit the job request
- [ ] **Step 4**: Verify success message appears
- [ ] **Step 5**: Check job appears in homeowner dashboard
- [ ] **Step 6**: Try editing the job request
- [ ] **Step 7**: Try canceling/deleting the job request

**Expected Result**: Job posts successfully and appears in dashboard

**Report if**:
- Form doesn't submit
- Validation errors are unclear
- Job doesn't appear in dashboard
- Can't edit or delete job
- Photo upload fails

---

### Test 4: Professional Signup Flow (20 minutes)
**Goal**: Test Pro account creation and subscription

**CRITICAL**: This is the most important test for Apple Review

- [ ] **Step 1**: Logout if logged in
- [ ] **Step 2**: Tap "I'm a Pro" or "Join as Professional"
- [ ] **Step 3**: Fill out Pro signup form:
  - Full name
  - Email address
  - Phone number
  - Trade/service category
  - Business name (optional)
  - Years of experience

- [ ] **Step 4**: Tap "Continue" to subscription screen
- [ ] **Step 5**: **CRITICAL**: Verify subscription screen shows:
  - Price: $59.99/month
  - "Subscribe with Apple Pay" button
  - Subscription benefits listed
  - Auto-renewal information
  - Terms and conditions link

- [ ] **Step 6**: Tap "Subscribe for $59.99/month"
- [ ] **Step 7**: Verify Apple Pay sheet appears:
  - Merchant name: "Fixlo"
  - Amount: $59.99
  - Subscription terms displayed
  - Payment method shown

- [ ] **Step 8**: **Use Sandbox Account** to complete test purchase
- [ ] **Step 9**: Verify subscription activates
- [ ] **Step 10**: Confirm Pro dashboard loads

**Expected Result**: Smooth signup flow with working Apple Pay integration

**Report IMMEDIATELY if**:
- Apple Pay sheet doesn't appear
- Wrong price displayed
- Merchant name is incorrect
- Subscription doesn't activate
- Payment fails with real error (not sandbox)

---

### Test 5: Professional Dashboard (15 minutes)
**Goal**: Test Pro features and job management

**Prerequisites**: Login with demo.pro@fixloapp.com or completed signup

- [ ] **Step 1**: View Pro dashboard
- [ ] **Step 2**: Verify dashboard shows:
  - Available jobs count
  - "New Jobs" badge
  - Job listings
  - Quick action buttons
  - Navigation menu

- [ ] **Step 3**: Browse available jobs
- [ ] **Step 4**: Filter jobs by service type
- [ ] **Step 5**: Filter jobs by location
- [ ] **Step 6**: Tap on a job to view details
- [ ] **Step 7**: Verify job detail screen shows:
  - Service type
  - Description
  - Location
  - Homeowner name
  - Posted date
  - Contact options

- [ ] **Step 8**: Test "Contact Homeowner" button
- [ ] **Step 9**: Navigate back to dashboard

**Expected Result**: Dashboard displays all information clearly, jobs are browsable and filterable

**Report if**:
- Dashboard is blank or shows errors
- Job list doesn't load
- Filters don't work
- Can't view job details
- Navigation breaks

---

### Test 6: Real-Time Messaging (15 minutes)
**Goal**: Test chat functionality between homeowner and pro

**Prerequisites**: Need 2 devices OR alternate between accounts

- [ ] **Step 1**: Login as homeowner, navigate to Messages
- [ ] **Step 2**: Start conversation with a pro (or use existing)
- [ ] **Step 3**: Send a text message
- [ ] **Step 4**: Verify message appears in conversation
- [ ] **Step 5**: Send multiple messages quickly
- [ ] **Step 6**: Switch to pro account (or second device)
- [ ] **Step 7**: Open Messages and find conversation
- [ ] **Step 8**: Verify messages appear in real-time
- [ ] **Step 9**: Reply from pro account
- [ ] **Step 10**: Switch back to homeowner, verify reply appears
- [ ] **Step 11**: Test message history loads when reopening chat
- [ ] **Step 12**: Navigate away and back, verify messages persist

**Expected Result**: Messages send and receive instantly, history persists

**Report if**:
- Messages don't send
- Delay is longer than 5 seconds
- Messages appear out of order
- Chat history doesn't load
- App crashes when sending message

---

### Test 7: Push Notifications (10 minutes)
**Goal**: Test notification delivery and handling

**Prerequisites**: Pro account with notification permissions granted

- [ ] **Step 1**: When app asks for notification permission, tap "Allow"
- [ ] **Step 2**: Verify permission is granted in iOS Settings
- [ ] **Step 3**: As homeowner, post a new job
- [ ] **Step 4**: As pro (or second device), wait for notification
- [ ] **Step 5**: Verify notification appears on lock screen with:
  - Fixlo app icon
  - "New Job Available" title
  - Job description preview
  - Sound/vibration

- [ ] **Step 6**: Tap notification
- [ ] **Step 7**: Verify app opens to correct screen (job detail)
- [ ] **Step 8**: Check notification badge updates on app icon
- [ ] **Step 9**: Test notification settings in app

**Expected Result**: Notifications arrive within 10 seconds, tap opens relevant screen

**Report if**:
- Notifications don't arrive
- Wrong content in notification
- Tapping notification doesn't open app
- Notification opens wrong screen
- Sound doesn't play

---

### Test 8: iPad Optimization (15 minutes)
**Goal**: Verify app works perfectly on iPad (CRITICAL for Apple)

**Prerequisites**: iPad Air 11-inch or iPad Pro

- [ ] **Step 1**: Install app on iPad
- [ ] **Step 2**: Launch app in portrait mode
- [ ] **Step 3**: Verify all UI elements are properly sized
- [ ] **Step 4**: Test all buttons are responsive:
  - Service category buttons
  - Login/Signup buttons
  - Submit buttons
  - Navigation buttons

- [ ] **Step 5**: Rotate to landscape mode
- [ ] **Step 6**: Verify layout adapts correctly
- [ ] **Step 7**: Test split-screen multitasking
- [ ] **Step 8**: Navigate through all screens:
  - Home
  - Login/Signup
  - Dashboard (both homeowner and pro)
  - Job request form
  - Messaging
  - Settings

- [ ] **Step 9**: Verify no text is cut off or truncated
- [ ] **Step 10**: Check images and icons scale properly

**Expected Result**: App is fully functional and beautiful on iPad

**Report IMMEDIATELY if**:
- Buttons are unresponsive on iPad
- Layout is broken or overlapping
- Text is unreadable
- Navigation doesn't work
- App crashes on iPad

---

### Test 9: Offline Mode & Network Resilience (10 minutes)
**Goal**: Test app behavior with poor/no connectivity

- [ ] **Step 1**: Open app with good WiFi connection
- [ ] **Step 2**: Navigate to a few screens
- [ ] **Step 3**: Enable Airplane Mode
- [ ] **Step 4**: Try to perform actions:
  - Browse service categories (should work)
  - Submit job request (should show error)
  - Send message (should queue)

- [ ] **Step 5**: Verify error messages are user-friendly
- [ ] **Step 6**: Confirm app doesn't crash
- [ ] **Step 7**: Disable Airplane Mode
- [ ] **Step 8**: Verify app reconnects automatically
- [ ] **Step 9**: Check queued actions execute (messages send)
- [ ] **Step 10**: Test with slow connection (enable "Slow Internet" in Developer settings if available)

**Expected Result**: App handles offline gracefully with clear messaging

**Report if**:
- App crashes when offline
- Error messages are unclear or technical
- App doesn't reconnect
- Data is lost when going offline

---

### Test 10: Performance & Stability (15 minutes)
**Goal**: Test app performance under various conditions

- [ ] **Step 1**: Test cold start (force quit, reopen)
  - Should launch in < 3 seconds

- [ ] **Step 2**: Test warm start (background, reopen)
  - Should restore instantly

- [ ] **Step 3**: Navigate rapidly between screens
  - Check for lag or stutter

- [ ] **Step 4**: Open and close keyboard multiple times
  - Verify smooth animations

- [ ] **Step 5**: Scroll long lists (job listings, messages)
  - Check for smooth 60fps scrolling

- [ ] **Step 6**: Leave app running for 10 minutes
  - Check memory usage in Xcode or Settings

- [ ] **Step 7**: Enable Low Power Mode
  - Verify app still functions

- [ ] **Step 8**: Test with 10% battery
  - Check battery drain isn't excessive

- [ ] **Step 9**: Force kill app and reopen
  - Verify state persists (login status, etc.)

**Expected Result**: App is fast, smooth, and doesn't drain battery

**Report if**:
- Launch time exceeds 5 seconds
- Noticeable lag or frame drops
- Memory warnings or crashes
- Excessive battery drain (>5% per 10 min of use)

---

### Test 11: Permissions & Privacy (10 minutes)
**Goal**: Test permission requests and handling

- [ ] **Step 1**: Fresh install or reset permissions
- [ ] **Step 2**: Trigger location permission:
  - Post a job with location
  - Verify prompt appears
  - Verify description is clear: "Allow Fixlo to use your location to show nearby services."

- [ ] **Step 3**: Test denying location
  - Verify app explains why permission is needed
  - Verify app still functions (degraded)

- [ ] **Step 4**: Test granting location
  - Verify location features work

- [ ] **Step 5**: Trigger notification permission
  - Verify description is clear
  - Test allow/deny scenarios

- [ ] **Step 6**: Trigger camera permission (if applicable)
  - Verify description: "Allow Fixlo to access your camera for profile photos."

- [ ] **Step 7**: Trigger photo library permission
  - Verify description: "Allow Fixlo to access your photo library for uploads."

- [ ] **Step 8**: Check Settings > Fixlo
  - Verify all permissions listed
  - Test toggling permissions

**Expected Result**: All permissions have clear descriptions and are handled gracefully

**Report if**:
- Permission descriptions are missing or unclear
- App crashes when permission denied
- Can't change permissions in Settings
- App doesn't explain why permission is needed

---

### Test 12: Edge Cases & Error Scenarios (10 minutes)
**Goal**: Test unusual scenarios and error handling

- [ ] **Step 1**: Try to submit job request with empty fields
  - Verify validation errors appear
  - Verify errors are specific and helpful

- [ ] **Step 2**: Enter invalid email formats
  - test@test (no domain)
  - @test.com (no local part)
  - Verify validation catches errors

- [ ] **Step 3**: Try very long inputs:
  - 1000+ character job description
  - Verify app handles gracefully

- [ ] **Step 4**: Test rapid button tapping
  - Tap submit button 10 times quickly
  - Verify no duplicate submissions

- [ ] **Step 5**: Try to access Pro features as homeowner
  - Should be redirected or blocked

- [ ] **Step 6**: Logout and login 5 times in a row
  - Verify no issues

- [ ] **Step 7**: Test auto-login after app restart
  - Should remember logged-in state

- [ ] **Step 8**: Test with wrong password
  - Verify error message is helpful

**Expected Result**: App handles errors gracefully with helpful messages

**Report if**:
- App crashes on invalid input
- Error messages are unclear or missing
- Can access features without proper authentication
- Data validation is missing

---

## 🐛 HOW TO REPORT BUGS

When you find a bug, please report it with the following information:

### Required Information:
1. **Device & OS**
   - Device model (e.g., "iPhone 14 Pro", "iPad Air 5th gen")
   - iOS version (e.g., "iOS 17.1")

2. **Build Information**
   - Build number: 22
   - Version: 1.0.2

3. **Steps to Reproduce**
   - Detailed step-by-step instructions
   - Be specific about what you tapped/typed
   - Example:
     ```
     1. Logged in as homeowner
     2. Tapped "Post a Job"
     3. Selected "Plumbing" from dropdown
     4. Entered "Fix sink" as description
     5. Tapped "Submit"
     6. App crashed
     ```

4. **Expected Behavior**
   - What should have happened?

5. **Actual Behavior**
   - What actually happened?

6. **Screenshots/Video**
   - Take screenshots if possible
   - Screen recording is even better
   - Use iOS screen recording: Control Center > Record

7. **Frequency**
   - Does it happen every time? Sometimes? Rarely?
   - Can you reproduce it consistently?

### Bug Severity Levels:

**🔴 Critical (Report Immediately)**:
- App crashes or freezes
- Data loss
- Can't login/signup
- Apple Pay not working
- Complete feature failure

**🟠 High**:
- Feature partially broken
- Poor performance
- Unclear error messages
- UI significantly broken

**🟡 Medium**:
- Minor visual glitches
- Typos or text issues
- Small inconveniences

**🟢 Low**:
- Suggestions for improvement
- Nice-to-have features
- Very minor visual issues

### Where to Report:
- **Email**: walter@fixloapp.com
- **Subject**: "TestFlight Build 22 - [Bug Severity]"
- **TestFlight**: Use built-in feedback feature

---

## ✅ CRITICAL ISSUES TO WATCH FOR

Apple will reject the app if these issues exist:

### 🚫 MUST NOT OCCUR:
1. App crashes on launch
2. Blank screens (white or black)
3. Buttons unresponsive on iPad
4. Apple Pay shows wrong amount or doesn't work
5. Login/Signup doesn't work
6. Missing permission descriptions
7. App references "beta", "test", or "development"
8. Screenshots in App Store don't match actual app
9. Demo accounts don't work
10. App requires features not available (e.g., backend down)

### ✅ MUST WORK PERFECTLY:
1. All 10 service categories display
2. Job request form submits successfully
3. Pro signup flow completes
4. Apple Pay subscription processes (in Sandbox)
5. Real-time messaging works
6. Push notifications arrive
7. iPad UI is fully functional
8. All navigation paths work
9. Error messages are user-friendly
10. Offline mode handles gracefully

---

## 📊 TESTING SCORECARD

Track your progress:

| Test Area | Status | Issues Found | Notes |
|-----------|--------|--------------|-------|
| Initial Launch | ☐ | ___ | |
| Service Discovery | ☐ | ___ | |
| Homeowner Job Request | ☐ | ___ | |
| Pro Signup | ☐ | ___ | |
| Pro Dashboard | ☐ | ___ | |
| Messaging | ☐ | ___ | |
| Notifications | ☐ | ___ | |
| iPad Optimization | ☐ | ___ | |
| Offline Mode | ☐ | ___ | |
| Performance | ☐ | ___ | |
| Permissions | ☐ | ___ | |
| Edge Cases | ☐ | ___ | |

**Overall Assessment**: _____ / 12 tests passed

---

## 🎯 FINAL CHECKLIST

Before concluding your testing session:

- [ ] Completed all 12 test sections
- [ ] Reported all critical bugs immediately
- [ ] Documented medium/low priority issues
- [ ] Tested on both iPhone and iPad (if available)
- [ ] Tested with demo accounts
- [ ] Verified Apple Pay works in Sandbox
- [ ] Took screenshots of any issues
- [ ] Filled out testing scorecard
- [ ] Submitted feedback via TestFlight
- [ ] Emailed detailed bug report (if bugs found)

---

## 💬 TESTER FEEDBACK

**What worked well?**
_________________________________________
_________________________________________

**What needs improvement?**
_________________________________________
_________________________________________

**Would you recommend this app?** Yes ☐ No ☐

**Additional comments:**
_________________________________________
_________________________________________

---

## 🙏 THANK YOU!

Your thorough testing is critical to our App Store success. Every bug you find and report helps us deliver a better product to our users.

**Questions?** Email walter@fixloapp.com

**Build Information**:
- Version: 1.0.2
- Build: 22
- Test Date: November 18, 2025

---

**Happy Testing! 🚀**
