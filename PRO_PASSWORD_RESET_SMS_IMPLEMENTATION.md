# Pro Password Reset SMS Implementation

## Overview
This implementation replaces the email-based password reset flow for Pro users with a phone-based SMS system using Twilio.

## Changes Made

### Backend Changes

#### 1. **Pro Authentication Routes** (`server/routes/proAuth.js`)

**Login Endpoint** (`POST /api/pro-auth/login`)
- Changed from email-based authentication to phone-based
- Accepts `{ phone, password }` instead of `{ email, password }`
- Uses `normalizeE164()` utility to standardize phone numbers
- Returns JWT token with phone number in payload

**Request Password Reset** (`POST /api/pro-auth/request-password-reset`)
- Changed from email-based to phone-based
- Accepts `{ phone }` instead of `{ email }`
- Generates a 6-digit numeric code (easier for users to enter than long tokens)
- Sends SMS via Twilio with message: `"Fixlo: Your password reset code is ${code}. Valid for 15 minutes. Reply STOP to opt out."`
- Code expires after 15 minutes (reduced from 1 hour for better security)
- Always returns success message to prevent phone enumeration attacks
- In development mode (no Twilio), logs the reset code to console for testing

**Reset Password** (`POST /api/pro-auth/reset-password`)
- Accepts both `code` (6-digit SMS code) and `token` (for backward compatibility)
- Validates code/token and expiration
- Requires password to be at least 8 characters
- Hashes password with bcrypt (rounds: 10)
- Clears reset token after successful reset

### Frontend Changes

#### 1. **Pro Sign-In Page** (`client/src/routes/ProSignInPage.jsx`)
- Changed email input field to phone number input
- Updated input type from `email` to `tel`
- Updated placeholder from email example to phone format: `(555) 123-4567`
- Changed request payload from `{ email, password }` to `{ phone, password }`
- Maintained all error handling and validation logic

#### 2. **Forgot Password Page** (`client/src/routes/ProForgotPasswordPage.jsx`)
- Replaced email input with phone number input
- Updated label: "Enter your phone number to receive a reset code via SMS"
- Changed button text from "Send Reset Link" to "Send Reset Code"
- Updated success message to reference SMS instead of email
- Changed request payload from `{ email }` to `{ phone }`

#### 3. **Reset Password Page** (`client/src/routes/ProResetPasswordPage.jsx`)
- Added support for both token (URL parameter) and code (form input)
- When no token in URL, displays a 6-digit code input field
- Code input has maxLength="6" validation
- Maintains password strength indicator with visual feedback
- Sends `{ code, newPassword }` or `{ token, newPassword }` based on what's available
- Updated UI text to mention SMS code instead of email link

## Security Features

1. **Phone Enumeration Protection**: Always returns success message even if phone doesn't exist
2. **Code Expiration**: Reset codes expire after 15 minutes
3. **Hashed Storage**: Reset codes are hashed using SHA-256 before storage
4. **Rate Limiting**: Existing rate limiting middleware protects endpoints
5. **Strong Password Requirements**: Minimum 8 characters with strength indicator
6. **Single Use Codes**: Codes are cleared after successful password reset

## SMS Compliance

- All SMS messages include "Reply STOP to opt out" as required by TCPA
- Uses existing Twilio integration from `server/utils/twilio.js`
- Phone numbers are normalized to E.164 format for consistency
- SMS notifications respect user's SMS consent preferences

## Testing Considerations

### Manual Testing (Production)
1. **Forgot Password Flow**
   - Navigate to `/pro/forgot-password`
   - Enter a valid Pro user's phone number
   - Verify SMS is received with 6-digit code
   - Navigate to `/pro/reset-password`
   - Enter the code and new password
   - Verify password is reset successfully

2. **Login Flow**
   - Navigate to `/pro/sign-in`
   - Enter phone number and password
   - Verify successful login

### Development Testing (No Database)
- When database is not available, server logs reset codes to console
- Look for: `📱 SMS disabled - Reset code for [phone]: [code]`
- Use the logged code to test the reset password flow

### Environment Variables Required
```bash
# Twilio Configuration (Required for SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE=+1234567890

# Server Configuration
PORT=3001
NODE_ENV=production  # or development

# Frontend API URL
REACT_APP_API_URL=https://fixloapp.onrender.com
```

## Pro Model Requirements

The Pro model already has the required fields:
- `phone` (String, required, unique) - Primary identifier
- `password` (String, hashed with bcrypt) - User password
- `passwordResetToken` (String) - Stores hashed reset code/token
- `passwordResetExpires` (Date) - Expiration timestamp for reset code

No model changes were required.

## API Endpoints Summary

| Endpoint | Method | Request Body | Response |
|----------|--------|--------------|----------|
| `/api/pro-auth/login` | POST | `{ phone, password }` | `{ token, pro: {...} }` |
| `/api/pro-auth/request-password-reset` | POST | `{ phone }` | `{ success: true, message: "..." }` |
| `/api/pro-auth/reset-password` | POST | `{ code, newPassword }` or `{ token, newPassword }` | `{ success: true, message: "..." }` |

## Backward Compatibility

- Reset password endpoint accepts both `code` and `token` parameters
- This allows for a gradual migration if some users still have old reset links
- The `token` parameter works exactly as before (URL-based reset links)

## Stripe Integration

✅ **No changes to Stripe logic** - All payment processing, subscription management, and checkout flows remain unchanged as required.

## Deployment Notes

1. Ensure Twilio credentials are configured in production environment variables
2. Test SMS delivery in production environment
3. Monitor SMS costs and usage through Twilio dashboard
4. Verify that Pro users can successfully log in with phone numbers
5. Check that reset codes are being sent and received properly

## Future Enhancements

Consider implementing:
1. Rate limiting for SMS sends (prevent SMS bombing)
2. SMS verification during Pro signup
3. Two-factor authentication using SMS codes
4. Phone number change flow with verification
5. Resend code functionality with cooldown period
