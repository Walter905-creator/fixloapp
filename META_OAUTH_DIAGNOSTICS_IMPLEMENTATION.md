# Meta OAuth Diagnostics Implementation

## Overview
This document describes the implementation of comprehensive diagnostics for Meta (Facebook/Instagram) OAuth connection failures in Fixlo.

## Problem Statement
Meta OAuth was connecting successfully, but Fixlo still showed Facebook/Instagram as "Not Connected" with no error messages or diagnostic information. This made it impossible to diagnose what Meta requirement was failing.

## Solution
Added structured logging, debug endpoints, and UI diagnostics to explicitly show which Meta requirement is failing.

## Implementation Details

### Backend Changes

#### 1. Error Constants (`server/modules/social-manager/oauth/metaHandler.js`)
```javascript
const ERROR_REASONS = {
  NO_PAGES: 'NO_PAGES',
  NO_PAGE_TOKEN: 'NO_PAGE_TOKEN',
  NO_IG_BUSINESS: 'NO_IG_BUSINESS',
  APP_NOT_LIVE: 'APP_NOT_LIVE',
  UNKNOWN: 'UNKNOWN'
};

const ERROR_MESSAGES = {
  [ERROR_REASONS.NO_PAGES]: 'No Facebook Pages found...',
  [ERROR_REASONS.NO_PAGE_TOKEN]: 'Page access token not available...',
  [ERROR_REASONS.NO_IG_BUSINESS]: 'No Instagram Business Account found...',
  [ERROR_REASONS.APP_NOT_LIVE]: 'App permissions error...'
};
```

#### 2. Structured Logging
Production-safe logging at each OAuth step:
- OAuth callback received (with timestamp)
- Access token exchange (success/failure)
- Pages API response (page count only in production)
- Instagram Business Account lookup
- Final decision with reason codes

Example log output:
```
[Meta OAuth] Callback received {
  accountType: 'instagram',
  ownerId: 'admin',
  hasCode: true,
  timestamp: '2026-01-12T03:15:23.527Z'
}
[Meta OAuth] Access token exchange: SUCCESS { hasToken: true, expiresIn: 5184000 }
[Meta OAuth] Instagram account lookup failed: {
  reason: 'NO_PAGE_TOKEN',
  error: 'Page access token not available...'
}
[Meta OAuth] Final decision: REJECTED { reason: 'NO_PAGE_TOKEN' }
```

#### 3. Debug Endpoint (`GET /api/social/debug/meta`)
Returns comprehensive diagnostic information:
```json
{
  "success": true,
  "isConfigured": true,
  "nodeEnv": "development",
  "hasActiveInstagram": false,
  "hasActiveFacebook": false,
  "lastOAuthAttempt": {
    "success": false,
    "reason": "NO_PAGE_TOKEN",
    "accountType": "instagram",
    "errorMessage": "Page access token not available...",
    "timestamp": "2026-01-12T03:15:23.527Z"
  },
  "lastErrorReason": "NO_PAGE_TOKEN",
  "lastErrorTimestamp": "2026-01-12T03:15:23.527Z",
  "helpText": "Page access token not available. Your app must be in Live mode on Meta for Developers.",
  "connectedAccounts": []
}
```

#### 4. OAuth Callback Handler (`GET /api/social/oauth/meta/callback`)
- Processes Meta OAuth redirect
- Completes connection or captures error
- Redirects with sanitized error codes
- No sensitive data in URL params

### Frontend Changes

#### 1. Error Detection (`client/src/routes/AdminSocialMediaPage.jsx`)
Detects OAuth callback parameters on page load:
```javascript
const urlParams = new URLSearchParams(window.location.search);
const oauthError = urlParams.get('error');
const reason = urlParams.get('reason');
const connected = urlParams.get('connected');
```

#### 2. Diagnostic Panel
Red alert panel shows when connection fails:
```
┌─────────────────────────────────────────────────────┐
│ ⚠️  Meta Connection Failed: NO_PAGE_TOKEN           │
│                                                     │
│ Page access token not available. Your app must be  │
│ in Live mode on Meta for Developers.               │
│                                                     │
│ Error Code: NO_PAGE_TOKEN                          │
│ Timestamp: 1/12/2026, 3:15:23 AM                   │
│ Node Env: development                              │
│                                                     │
│ [Dismiss]                                          │
└─────────────────────────────────────────────────────┘
```

#### 3. Meta Debug Info Section
Admin-visible panel at bottom of page:
```
┌─────────────────────────────────────────────────────┐
│ Meta OAuth Debug Info                    [Refresh]  │
│                                                     │
│ App Configured: ✓ Yes      Node Env: development   │
│ Instagram Connected: ✗ No   Facebook Connected: ✗ No│
│                                                     │
│ Last OAuth Attempt:                                 │
│ Status: ✗ Failed                                    │
│ Reason: NO_PAGE_TOKEN                               │
│ Account Type: instagram                             │
│ Timestamp: 1/12/2026, 3:15:23 AM                    │
└─────────────────────────────────────────────────────┘
```

## Security Features

### Production-Safe Logging
- ✅ No access tokens logged
- ✅ Page IDs/usernames only in development mode
- ✅ Production logs: counts and booleans only
- ✅ All logs use `console.info` (safe for production)

### Sanitized Error Messages
- ✅ URL params contain only whitelisted reason codes
- ✅ No raw error messages from OAuth provider
- ✅ Frontend maps codes to safe messages
- ✅ No sensitive data in client responses

### Secure Defaults
- ✅ Production default: `https://www.fixloapp.com`
- ✅ Development default: `http://localhost:3000`
- ✅ Always respects `CLIENT_URL` env var

## Error Reason Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `NO_PAGES` | No Facebook Pages found | Create or connect a Facebook Page |
| `NO_PAGE_TOKEN` | Page access token not available | Ensure Meta app is in Live mode |
| `NO_IG_BUSINESS` | No Instagram Business Account linked | Connect Instagram Business Account to Page |
| `APP_NOT_LIVE` | Meta app permissions error | Submit app for review and get approved |
| `UNKNOWN` | Other errors | Check server logs for details |

## Testing Checklist

### Automated Tests
- [x] Backend server starts without errors
- [x] Client builds successfully
- [x] No syntax errors in code
- [x] Security review passed
- [x] Code quality review passed

### Manual Testing (Requires Meta Credentials)
- [ ] Test successful Instagram connection
- [ ] Test failure: NO_PAGES (no pages on account)
- [ ] Test failure: NO_IG_BUSINESS (page without Instagram)
- [ ] Test failure: NO_PAGE_TOKEN (app not in Live mode)
- [ ] Test failure: APP_NOT_LIVE (permissions denied)
- [ ] Verify logs appear in server console
- [ ] Verify debug endpoint returns correct data
- [ ] Verify diagnostic panel displays correctly
- [ ] Verify no secrets in logs or UI

## Usage Instructions

### For Developers
1. Check server console logs for detailed OAuth flow
2. Call `GET /api/social/debug/meta` for current state
3. Review error reason codes in logs
4. Check Meta for Developers dashboard

### For Admins
1. Navigate to Admin → Social Media Manager
2. Attempt to connect Instagram/Facebook
3. If connection fails, diagnostic panel appears
4. Read the error message and follow guidance
5. Check "Meta Debug Info" section for details
6. Click "Refresh" to update debug info

### Common Scenarios

#### Scenario 1: App Not in Live Mode
```
Error: NO_PAGE_TOKEN
Message: Page access token not available. Your app must be in Live mode...
Solution: Go to Meta for Developers → App Settings → Switch to Live Mode
```

#### Scenario 2: No Instagram Business Account
```
Error: NO_IG_BUSINESS
Message: No Instagram Business Account found...
Solution: In Instagram app → Settings → Switch to Business Account → Link to Facebook Page
```

#### Scenario 3: No Facebook Pages
```
Error: NO_PAGES
Message: No Facebook Pages found...
Solution: Create a Facebook Business Page first
```

## File Changes Summary

### Modified Files
1. `server/modules/social-manager/oauth/metaHandler.js` - Added logging and diagnostics
2. `server/modules/social-manager/routes/index.js` - Added debug endpoint and callback handler
3. `client/src/routes/AdminSocialMediaPage.jsx` - Added diagnostic UI

### Key Additions
- Error constants and messages
- Structured logging functions
- Debug endpoint implementation
- OAuth callback handler
- Diagnostic panel UI
- Debug info section UI

## Maintenance Notes

### Adding New Error Reasons
1. Add to `ERROR_REASONS` constant
2. Add message to `ERROR_MESSAGES` constant
3. Update detection logic in `connect()` method
4. Update frontend error code mapping
5. Update this documentation

### Debugging Tips
1. Check `NODE_ENV` - affects what's logged
2. Verify `CLIENT_URL` is set correctly
3. Check Meta app is configured (client ID/secret)
4. Verify Meta app permissions in developer console
5. Check if Meta app is in Live mode

## References
- [Meta OAuth Documentation](https://developers.facebook.com/docs/facebook-login/overview)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Pages API](https://developers.facebook.com/docs/pages)

## Authors
- Implementation: GitHub Copilot
- Review: Walter905-creator

## Version History
- v1.0.0 (2026-01-12) - Initial implementation with comprehensive diagnostics
