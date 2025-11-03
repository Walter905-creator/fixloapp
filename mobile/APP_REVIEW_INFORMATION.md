# App Review Information for Apple

**For App Store Connect Submission**

---

## Demo Account / Test Credentials

### Homeowner Account (Optional)
If Apple reviewers need to test homeowner features:

**Email**: `test.homeowner@fixloapp.com`  
**Password**: `TestHomeowner2024!`

### Pro Account (Optional)
If Apple reviewers need to test pro features:

**Email**: `test.pro@fixloapp.com`  
**Password**: `TestPro2024!`

**Note**: These accounts should be created in your production backend before submission if you want reviewers to test authenticated features.

---

## Notes for Reviewers

### App Purpose
Fixlo is a home services marketplace that connects homeowners with verified service professionals. Homeowners can post job requests for free, while professionals subscribe to receive unlimited job leads.

### Key Features to Test

**For Homeowners (Free):**
1. Open app and select "I am a Homeowner"
2. Navigate to "Post a Job Request"
3. Fill out job details (title, description, category, location)
4. Submit request (confirmation message will appear)
5. Can also browse professionals and view active requests

**For Professionals (Subscription Required):**
1. Open app and select "I am a Pro"
2. View subscription benefits
3. Tap "Sign Up as Pro"
4. See In-App Purchase subscription screen ($59.99/month)
5. Can test subscription with Apple sandbox account
6. After subscribing, pros receive push notifications for new jobs

### In-App Purchase Testing

**Product Information:**
- Product ID: `com.fixloapp.mobile.pro.monthly`
- Type: Auto-renewable subscription
- Duration: 1 month
- Price: $59.99 USD

**Testing Notes:**
- Use an Apple sandbox tester account to test purchases
- Demo mode is available if IAP products aren't loaded (development only)
- Real subscription is required in production to access pro features

### iPad Support
This app fully supports iPad with responsive layouts:
- All buttons are appropriately sized for touch
- Content scales properly on larger screens
- Tested on iPad Air (5th generation) and iPad Pro
- Both portrait and landscape orientations supported

### Permissions Requested

1. **Location** (When in Use)
   - Purpose: Find nearby professionals based on user location
   - When requested: When posting a job or browsing professionals

2. **Camera** (Optional)
   - Purpose: Take photos of projects to attach to job requests
   - When requested: When user wants to add photos to job

3. **Photo Library** (Optional)
   - Purpose: Upload existing photos to job requests
   - When requested: When user wants to add existing photos

4. **Push Notifications** (Optional)
   - Purpose: Alert professionals about new job opportunities
   - When requested: During pro signup process

All permissions include clear descriptions and can be denied without breaking core functionality.

### Privacy & Data Usage

**Data Collected:**
- Account information (name, email, phone)
- Location (for job matching)
- Job request details (description, photos, category)
- Payment information (handled by Apple IAP, not stored in app)

**Data Usage:**
- Matching homeowners with professionals
- Sending job notifications
- App functionality and user preferences

**Privacy Policy**: https://fixloapp.com/privacy-policy.html  
**Terms of Service**: https://fixloapp.com/terms.html

### Backend Services

The app connects to a backend API at:
- Production: `https://fixloapp.onrender.com`

**Note**: Some features may show alerts saying "feature coming soon" as the backend is still in development. Core functionality (user registration, job posting, subscription) is fully working.

---

## Technical Information

### Build Details
- **Version**: 1.0.0
- **Build**: 6
- **Minimum iOS**: 15.1
- **SDK**: Expo SDK 54
- **Bundle ID**: com.fixloapp.mobile

### Third-Party Services
- **Apple In-App Purchase**: For pro subscriptions
- **Push Notifications**: For job alerts (via Expo)
- **Backend API**: Custom Node.js/Express server

### Privacy Manifest
This app includes a Privacy Manifest (required as of May 2024) declaring:
- File timestamp access (app functionality)
- System boot time (performance monitoring)
- Disk space (storage management)
- UserDefaults (user preferences)

All API usage complies with Apple's guidelines.

---

## Compliance

### App Store Guidelines Compliance

**Guideline 2.1 - App Completeness**: ✅
- App is fully functional
- All buttons are responsive
- Tested on iPhone and iPad
- No crashes or major bugs

**Guideline 2.3 - Accurate Metadata**: ✅
- Screenshots show actual app features
- Description accurately represents functionality
- Professional app icons (not placeholders)

**Guideline 3.1.1 - In-App Purchase**: ✅
- Pro subscription uses native Apple IAP
- No external payment mechanisms
- Subscription is auto-renewable through Apple

**Guideline 5.1 - Privacy**: ✅
- Privacy policy provided and accessible
- Privacy manifest included (2024 requirement)
- User consent for data collection
- Clear permission descriptions

---

## Support Information

**Support Email**: support@fixloapp.com  
**Support URL**: https://fixloapp.com/support  
**Marketing URL**: https://fixloapp.com

---

## Additional Notes

### Known Limitations (Not Bugs)
1. Some backend features may still be in development
2. Real-time chat may show "coming soon" alert
3. Payment processing is via Apple IAP only (as required)

### Testing Recommendations
1. Test on both iPhone and iPad (iPad Air specifically)
2. Verify all buttons respond to touch
3. Test IAP subscription flow with sandbox account
4. Check permission requests appear with clear descriptions
5. Verify app doesn't crash during normal use

### Response Time
If reviewers have questions or need additional information, we typically respond within 24 hours via the App Review team messages in App Store Connect.

---

**This information should be added to the "App Review Information" section in App Store Connect when submitting the app.**

*Last Updated: November 3, 2024*
