# Fixlo iOS App Testing Checklist

## Pre-Submission Testing Requirements

This checklist ensures all Apple App Review issues are resolved before resubmission.

---

## 🎨 Visual Testing

### Icons (Guideline 2.3.8)
- [ ] App icon displays correctly in home screen
- [ ] App icon is professional and not a placeholder
- [ ] Icon is 1024x1024 pixels
- [ ] Icon displays correctly on both light and dark backgrounds
- [ ] Adaptive icon displays correctly (Android)
- [ ] Splash screen displays with logo centered

**How to Test:**
1. Build and install app on device
2. Check home screen icon
3. Launch app and verify splash screen
4. Verify icon in App Store listing preview

---

## 📱 Button Responsiveness (Guideline 2.1)

### Welcome Screen
- [ ] "🏠 I am a Homeowner" button responds to tap
- [ ] "👷 I am a Pro" button responds to tap
- [ ] "🏠 Homeowner Login" link responds to tap
- [ ] "👷 Pro Login" link responds to tap
- [ ] All buttons show visual feedback when pressed
- [ ] All buttons navigate to correct screen

### Login Screen
- [ ] "Sign In" button responds to tap
- [ ] "Forgot Password?" link responds to tap
- [ ] "Sign Up" link responds to tap
- [ ] Button shows loading state when processing
- [ ] Keyboard dismisses properly
- [ ] Form validation works correctly

### Signup Screen
- [ ] "Create Account" button responds to tap
- [ ] "Sign In" link responds to tap
- [ ] Button shows loading state when processing
- [ ] All text inputs are focusable
- [ ] Keyboard dismisses properly
- [ ] Form validation works correctly

### Homeowner Dashboard
- [ ] "Post a Job Request" button responds to tap
- [ ] "My Active Requests" button responds to tap (shows alert)
- [ ] "Browse Professionals" button responds to tap (shows alert)
- [ ] All buttons provide haptic feedback

### Pro Dashboard
- [ ] "Sign Up as Pro" button responds to tap
- [ ] "Already a member? Login" link responds to tap
- [ ] "Test Notification" button responds to tap (if visible)
- [ ] All buttons provide haptic feedback

### Pro Signup Screen
- [ ] "Subscribe Now" button responds to tap
- [ ] IAP flow initiates properly
- [ ] "Maybe Later" button responds to tap
- [ ] Form fields are all editable
- [ ] Button shows loading state during purchase

### Job Request Screen
- [ ] "Submit Request" button responds to tap
- [ ] All form fields are editable
- [ ] Submit button shows loading state
- [ ] Form validation works
- [ ] Success alert displays properly

**How to Test on iPad:**
1. Install app on iPad Air 11-inch or iPad Pro
2. Test every single button by tapping
3. Verify visual feedback (button press animation)
4. Ensure navigation works correctly
5. Test in both portrait and landscape orientations

**iPad Specific Tests:**
- [ ] All screens render properly on iPad
- [ ] Buttons are appropriately sized (not too small)
- [ ] Layout looks professional on larger screen
- [ ] Touch targets are adequate size (minimum 44x44 points)
- [ ] No UI elements are cut off or overlapping

---

## 💳 In-App Purchase (Guideline 3.1.1)

### IAP Configuration
- [ ] Product ID created in App Store Connect: `com.fixloapp.mobile.pro.monthly`
- [ ] Subscription price set to $59.99/month
- [ ] Subscription is auto-renewable
- [ ] Subscription group created
- [ ] Product description added
- [ ] Terms of service URL provided

### IAP Functionality
- [ ] App connects to App Store
- [ ] Product loads successfully
- [ ] Product price displays correctly ($59.99/month)
- [ ] Purchase flow initiates properly
- [ ] Purchase can be completed (sandbox testing)
- [ ] Purchase success shows confirmation
- [ ] Purchase cancellation handled gracefully
- [ ] Subscription status persists across app restarts
- [ ] Restore purchases works (if implemented)

### Development Mode
- [ ] Demo mode works when no products available
- [ ] Demo mode clearly indicates it's test mode
- [ ] Demo mode allows testing flow without real purchase

**How to Test IAP:**

**Sandbox Testing:**
1. Create sandbox tester in App Store Connect
2. Sign out of App Store on test device
3. Install app on device
4. Navigate to Pro Signup screen
5. Tap "Subscribe Now"
6. Sign in with sandbox tester when prompted
7. Complete test purchase
8. Verify subscription activates

**Production Testing:**
1. Submit build to TestFlight
2. Test with real TestFlight users
3. Verify IAP works in TestFlight environment

---

## 📸 Screenshots (Guideline 2.3.3)

### Screenshot Requirements
- [ ] At least 3-5 screenshots per device size
- [ ] Screenshots show actual app functionality
- [ ] No screenshot is just a login/splash screen
- [ ] Screenshots highlight core features
- [ ] Screenshots are visually appealing
- [ ] Text is readable in all screenshots
- [ ] Screenshots show diverse functionality

### Required Device Sizes
- [ ] iPhone 6.7" (1290x2796) - At least 3 screenshots
- [ ] iPhone 6.5" (1242x2688) - At least 3 screenshots
- [ ] iPad 12.9" (2048x2732) - At least 3 screenshots
- [ ] iPad 11" (1668x2388) - At least 3 screenshots

### Recommended Screenshot Sequence
1. [ ] Welcome screen (showing both user type options)
2. [ ] Homeowner dashboard (with action buttons visible)
3. [ ] Job request form (showing input fields)
4. [ ] Pro benefits screen (showing subscription value)
5. [ ] Pro signup/subscription (showing IAP pricing)
6. [ ] Additional feature screens as applicable

**How to Create Screenshots:**
1. Build app and run on simulator/device
2. Navigate to each key screen
3. Take screenshot (Cmd+S on simulator, or Volume Up + Power on device)
4. Use image editing to add device frames (optional)
5. Upload to App Store Connect

---

## 🧪 Functional Testing

### Authentication Flow
- [ ] Can create homeowner account
- [ ] Can create pro account
- [ ] Can log in as homeowner
- [ ] Can log in as pro
- [ ] Invalid credentials show error
- [ ] Password validation works
- [ ] Email validation works
- [ ] Forgot password link works

### Navigation
- [ ] Can navigate to all screens
- [ ] Back button works on all screens
- [ ] Navigation stack is correct
- [ ] Deep linking works (if applicable)
- [ ] Tab navigation works (if applicable)

### Homeowner Features
- [ ] Can access homeowner dashboard
- [ ] Can navigate to job request form
- [ ] Can fill out job request form
- [ ] Can submit job request
- [ ] Success message displays after submission
- [ ] Form clears after successful submission

### Pro Features
- [ ] Can access pro dashboard
- [ ] Can view subscription benefits
- [ ] Can navigate to pro signup
- [ ] Push notifications register (if enabled)
- [ ] Can complete subscription purchase

### Error Handling
- [ ] Network errors display friendly message
- [ ] Form validation errors are clear
- [ ] Purchase errors handled gracefully
- [ ] App doesn't crash on errors
- [ ] Loading states display correctly

---

## 📐 Layout & Responsiveness

### iPhone Testing
- [ ] Test on iPhone SE (small screen)
- [ ] Test on iPhone 14/15 (standard size)
- [ ] Test on iPhone 14/15 Pro Max (large screen)
- [ ] All screens render correctly
- [ ] No content is cut off
- [ ] Keyboard doesn't obscure inputs

### iPad Testing (CRITICAL)
- [ ] Test on iPad Air 11-inch
- [ ] Test on iPad Air (5th generation)
- [ ] Test on iPad Pro 12.9"
- [ ] All screens utilize space effectively
- [ ] Buttons are appropriately sized
- [ ] Layout looks professional, not stretched
- [ ] Both portrait and landscape work
- [ ] Touch targets are adequate size

### Accessibility
- [ ] Text is readable (font size adequate)
- [ ] Color contrast is sufficient
- [ ] Touch targets are minimum 44x44 points
- [ ] VoiceOver works (iOS accessibility)

---

## 🔒 Compliance & Permissions

### Privacy
- [ ] Privacy policy URL added
- [ ] Terms of service URL added
- [ ] IAP subscription terms included
- [ ] User data handling disclosed

### Permissions
- [ ] Location permission request (if used)
- [ ] Camera permission request (if used)
- [ ] Photo library permission (if used)
- [ ] Push notifications permission request
- [ ] All permission descriptions are clear

---

## 🚀 Performance

### App Performance
- [ ] App launches quickly (< 3 seconds)
- [ ] Smooth scrolling on all screens
- [ ] No lag when tapping buttons
- [ ] Forms respond immediately to input
- [ ] Images load quickly
- [ ] No memory leaks
- [ ] No crashes during normal use

### Network
- [ ] API calls complete successfully
- [ ] Handles slow network gracefully
- [ ] Handles no network gracefully
- [ ] Timeouts are reasonable
- [ ] Loading indicators display

---

## ✅ Pre-Submission Final Checks

### Build Configuration
- [ ] Version number is correct (1.0.0)
- [ ] Build number incremented (5 or higher)
- [ ] Bundle identifier matches (com.fixloapp.mobile)
- [ ] Deployment target is iOS 15.1+
- [ ] App icon included in build
- [ ] Splash screen included in build

### App Store Connect
- [ ] IAP subscription configured
- [ ] App metadata complete
- [ ] Screenshots uploaded (all device sizes)
- [ ] App description updated
- [ ] Keywords added
- [ ] Privacy policy URL set
- [ ] Support URL set
- [ ] Age rating set

### TestFlight
- [ ] Build uploaded to TestFlight
- [ ] Internal testing completed
- [ ] External testing completed (optional)
- [ ] No crashes reported
- [ ] All features work in TestFlight

---

## 📝 Test Results Log

### Test Date: ___________
### Tester: ___________
### Device: ___________
### iOS Version: ___________

**Critical Issues Found:**
- [ ] None
- [ ] Issue 1: _____________________
- [ ] Issue 2: _____________________

**Minor Issues Found:**
- [ ] None
- [ ] Issue 1: _____________________
- [ ] Issue 2: _____________________

**Notes:**
___________________________________________
___________________________________________
___________________________________________

---

## 🎯 Ready for Submission?

Only check this when ALL items above are complete:

- [ ] All visual tests passed
- [ ] All button responsiveness tests passed (especially iPad)
- [ ] IAP fully configured and tested
- [ ] Screenshots created and uploaded
- [ ] All functional tests passed
- [ ] Layout tested on iPhone and iPad
- [ ] Performance is acceptable
- [ ] App Store Connect fully configured
- [ ] TestFlight testing complete

**✅ Ready to submit for review!**

---

## 📞 If Issues Persist

If you encounter issues during testing:

1. **Button unresponsiveness**: Ensure `TouchableOpacity` is used with proper `onPress` handler
2. **IAP not working**: Verify product ID matches App Store Connect exactly
3. **Layout issues on iPad**: Test with `maxWidth` constraints and proper alignment
4. **Screenshots rejected**: Ensure screenshots show actual app usage, not just login

For help: support@fixloapp.com
