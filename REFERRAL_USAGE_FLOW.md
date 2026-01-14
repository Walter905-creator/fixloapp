# Referral Usage Flow Implementation

## Overview

This document describes the complete referral usage flow implementation for Fixlo's professional signup process. The system enables anyone to refer professionals via referral links, with automatic code capture and application.

## Features Implemented

### 1. Referral Link Support

**Primary Format**: `https://fixloapp.com/join?ref=REFERRAL_CODE`
**Alternative Format**: `https://fixloapp.com/pro/signup?ref=REFERRAL_CODE`

Both formats are fully supported and will automatically:
- Capture the referral code from the URL
- Store it securely in browser storage
- Auto-apply it to the signup form

### 2. Auto-Apply from Link

When a professional visits any page with `?ref=CODE`:

1. **Capture**: The code is extracted from the URL parameter
2. **Validate**: Code format is validated (3-20 characters, alphanumeric + hyphens)
3. **Store**: Code is saved to localStorage with a timestamp
4. **Persist**: Code remains available for 30 days
5. **Fallback**: If localStorage fails, sessionStorage is used

**Key File**: `/client/src/utils/referralCapture.js`

```javascript
// Utility functions provided:
- captureReferralCode(searchParams) // Capture and store from URL
- getStoredReferralCode() // Retrieve stored code
- clearReferralCode() // Clear after signup
- isValidReferralCode(code) // Validate format
- hasStoredReferralCode() // Check if code exists
```

### 3. Professional Signup Page UX

**Location**: `/client/src/routes/ProSignupPage.jsx`

#### Visual Elements

1. **Confirmation Banner** (appears when referral is valid):
   - Subtle green background with checkmark icon
   - Message: "Joining with a referral code"
   - Subtext: "Your referral will be credited after signup. No action needed."
   - ARIA-compliant with `role="status"` for screen readers

2. **Referral Code Field**:
   - Label: "Referral Code (optional)"
   - Auto-filled if code detected from link
   - Editable for manual entry
   - Helper text explaining purpose
   - Max length: 20 characters
   - Non-blocking: signup works without it

3. **Status Indicators**:
   - "Referral code applied" ✓ (when auto-filled)
   - "Referred by {name}" (when validated)

#### User Flow

**Scenario A: User clicks referral link**
1. User clicks `fixloapp.com/join?ref=ABC123`
2. JoinPage captures code and redirects to ProSignupPage
3. ProSignupPage auto-fills referral field with "ABC123"
4. Green confirmation banner appears
5. Code is validated against backend
6. If valid, shows referrer name
7. User completes signup normally
8. Referral code attached to Stripe checkout

**Scenario B: User navigates without link**
1. User visits ProSignupPage directly
2. Checks localStorage for stored code
3. If found and not expired, auto-fills field
4. If not found, field is empty but visible
5. User can manually enter code if they have one
6. Signup works perfectly either way

**Scenario C: User manually enters code**
1. User arrives at ProSignupPage without referral
2. Sees empty "Referral Code (optional)" field
3. Enters code manually (e.g., from friend's text)
4. Code is validated on input change
5. If valid, shows confirmation
6. Proceeds with signup

### 4. Submission Logic

When the signup form is submitted:

1. Referral code (if present) is read from the field
2. Code is attached to Stripe checkout URL as `client_reference_id`
3. Stripe processes payment and creates subscription
4. Backend webhook receives subscription event
5. Backend extracts referral code from `client_reference_id`
6. Referral is recorded and credited to referrer

**Backend Integration** (already exists):
- `POST /api/referrals/validate` - Validates referral code
- `POST /api/referrals/track-click` - Tracks referral clicks
- `POST /api/referrals/complete` - Completes referral after payment

### 5. Data Persistence

**LocalStorage Keys**:
- `fixlo_referral_code` - The referral code (uppercase)
- `fixlo_referral_timestamp` - Unix timestamp when captured

**Expiry**: 30 days from capture
**Fallback**: SessionStorage if localStorage unavailable
**Clearing**: Automatic after expiry, manual clear available

## Technical Implementation

### Files Modified

1. **`/client/src/utils/referralCapture.js`** (new)
   - Core utility for referral code management
   - Validation, storage, retrieval functions

2. **`/client/src/routes/JoinPage.jsx`** (modified)
   - Added referral capture from URL
   - Redirects to ProSignupPage when ref present

3. **`/client/src/routes/ProSignupPage.jsx`** (modified)
   - Auto-applies referral from URL or storage
   - Added visible referral code field
   - Added confirmation banner
   - Added real-time validation
   - Attaches code to Stripe checkout

### Code Quality

- ✅ **Build**: Successful without errors
- ✅ **Code Review**: Passed with accessibility improvements
- ✅ **Accessibility**: ARIA labels, semantic HTML, screen reader support
- ✅ **Security**: No CodeQL issues, input validation, safe storage
- ✅ **Error Handling**: Graceful degradation, try-catch blocks
- ✅ **Browser Support**: Works with localStorage and sessionStorage

## Usage Examples

### For Referrers

Share your referral link:
```
https://www.fixloapp.com/join?ref=YOUR-CODE
```

Or direct signup link:
```
https://www.fixloapp.com/pro/signup?ref=YOUR-CODE
```

### For Developers

#### Testing Referral Capture

```javascript
// In browser console after navigating with ?ref=TEST123
localStorage.getItem('fixlo_referral_code');
// Should return: "TEST123"

localStorage.getItem('fixlo_referral_timestamp');
// Should return: timestamp in milliseconds
```

#### Manual Code Entry Test

1. Navigate to `/pro/signup`
2. Scroll to "Referral Code (optional)" field
3. Enter any valid code format
4. Observe real-time validation
5. Submit form to see code attached to Stripe

## Acceptance Criteria Status

- ✅ Pro clicks referral link → code auto-applied
- ✅ Pro sees referral clearly on signup
- ✅ Pro can manually enter code if needed
- ✅ Signup works with or without referral
- ✅ No confusion about where code is used
- ✅ No regression to Pro signup
- ✅ No changes to Request Service flow
- ✅ Accessible to screen readers
- ✅ Graceful error handling

## Future Enhancements

Potential improvements for future iterations:

1. **Analytics**: Track referral click-through rates
2. **A/B Testing**: Test different banner designs
3. **Gamification**: Show referrer's success stats
4. **Social Proof**: "Join X other pros referred by {name}"
5. **Multi-language**: Translate referral messages
6. **Mobile Deep Links**: Support app:// URLs for mobile
7. **QR Codes**: Generate QR codes for referral links

## Troubleshooting

### Referral code not auto-filling

**Check**:
1. URL contains `?ref=CODE` parameter
2. Code format is valid (3-20 chars, alphanumeric + hyphens)
3. Browser allows localStorage
4. Console for any JavaScript errors

**Solution**: Manual entry is always available as fallback

### Code not persisting

**Check**:
1. Browser privacy settings allow storage
2. Code hasn't expired (>30 days old)
3. Storage not cleared by user/browser

**Solution**: Use referral link again or manual entry

### Backend not receiving code

**Check**:
1. Stripe checkout URL is configured
2. `client_reference_id` is set in URL
3. Webhook is processing subscription events

**Solution**: Check server logs for webhook errors

## Security Considerations

### Input Validation

- Referral codes validated on client and server
- Maximum length enforced (20 characters)
- Only alphanumeric and hyphens allowed
- XSS protection via React's built-in escaping

### Storage Security

- No sensitive data stored in localStorage
- Only referral code (public identifier)
- Can be cleared by user at any time
- Automatic expiry prevents stale data

### Backend Verification

- All referral codes validated against database
- Anti-fraud checks for duplicate usage
- Rate limiting on validation endpoints
- Codes locked after successful signup

## Support

For issues or questions:
1. Check this documentation
2. Review console logs for errors
3. Test with different browsers
4. Verify backend API is responding
5. Contact development team if issue persists

---

**Last Updated**: 2026-01-14
**Version**: 1.0.0
**Status**: Production Ready
