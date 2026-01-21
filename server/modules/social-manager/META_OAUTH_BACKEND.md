# Meta OAuth Backend-Only Implementation

## Overview

This implementation allows Fixlo to complete Meta (Facebook + Instagram) OAuth connections entirely in the backend, without requiring the frontend Admin UI to be accessible.

## Why Backend-Only?

The frontend was not processing the OAuth callback properly, and we needed a solution that:
- Works even if the frontend is unavailable
- Works even if Admin UI routes are hidden
- Provides a simple API-based way to verify connections
- Stores all data securely in MongoDB with encrypted tokens

## Architecture

### OAuth Flow

```
1. User initiates OAuth → Meta OAuth page
2. User approves → Meta redirects to /api/social/oauth/meta/callback
3. Backend exchanges code for long-lived token
4. Backend fetches Facebook Pages
5. Backend selects Fixlo page (or first page if only one exists)
6. Backend retrieves Page access token
7. Backend checks for linked Instagram Business Account
8. Backend stores encrypted tokens in MongoDB
9. Backend returns JSON response (no frontend redirect)
```

### Key Components

#### 1. Enhanced Meta Handler (`metaHandler.js`)

**New Method: `getCompleteMetaAccountInfo(userAccessToken)`**

This method:
- Fetches all Facebook Pages the user manages
- Selects the appropriate page:
  - Searches for a page with "Fixlo" in the name
  - Falls back to the first page if no Fixlo page found
  - Falls back to the only page if there's just one
- Retrieves the Page access token (required for Meta API calls)
- Checks for linked Instagram Business Account
- Returns complete information including:
  - `pageId` - Facebook Page ID
  - `pageName` - Facebook Page name
  - `pageAccessToken` - Page access token (for API calls)
  - `instagramBusinessId` - Instagram Business Account ID (if linked)
  - `instagramUsername` - Instagram username (if linked)
  - `instagramAccessToken` - Instagram access token (same as Page token)
  - `hasInstagram` - Boolean flag

#### 2. Backend-Only Callback (`/api/social/oauth/meta/callback`)

**Old Behavior:**
- Redirected to frontend with query parameters
- Frontend processed the connection
- Failed if frontend was unreachable

**New Behavior:**
- Completes entire OAuth flow server-side
- Exchanges authorization code for tokens
- Fetches Page and Instagram information
- Stores encrypted tokens in MongoDB
- Creates/updates SocialAccount records
- Returns JSON response:
  ```json
  {
    "success": true,
    "platform": "meta",
    "connected": true,
    "facebookConnected": true,
    "instagramConnected": true,
    "pageId": "123456789",
    "pageName": "Fixlo",
    "instagramBusinessId": "987654321",
    "instagramUsername": "fixlo",
    "connectedAt": "2026-01-21T01:00:00.000Z",
    "message": "Successfully connected..."
  }
  ```

#### 3. Force Status Endpoint (`/api/social/force-status`)

**Purpose:** Verify Meta OAuth connections via API

**Access:** Public (no authentication required)

**Usage:**
```bash
GET /api/social/force-status
GET /api/social/force-status?ownerId=admin
```

**Response:**
```json
{
  "success": true,
  "facebookConnected": true,
  "instagramConnected": true,
  "pageId": "123456789",
  "pageName": "Fixlo",
  "instagramBusinessId": "987654321",
  "instagramUsername": "fixlo",
  "connectedAt": "2026-01-21T01:00:00.000Z",
  "isTokenValid": true,
  "tokenExpiresAt": "2026-03-21T01:00:00.000Z"
}
```

## Security

### Token Storage

All tokens are encrypted using AES-256-GCM encryption before storage:

1. **Page Access Token**: Stored in `EncryptedToken` collection
2. **Instagram Access Token**: Stored in `EncryptedToken` collection
3. **Encryption Key**: `SOCIAL_ENCRYPTION_KEY` environment variable (32 bytes)

### Token Protection

- ✅ Tokens are NEVER logged or returned in API responses
- ✅ Tokens are encrypted at rest in MongoDB
- ✅ Tokens are only decrypted when needed for API calls
- ✅ Each encryption uses a unique initialization vector (IV)
- ✅ AES-GCM provides authenticated encryption

### Logging

Structured logging includes:
- OAuth flow progress (step-by-step)
- Success/failure status
- Error messages and reasons
- Account IDs and usernames (non-sensitive)
- **NEVER includes:** tokens, secrets, passwords

## Environment Variables

### Required

```bash
# Meta OAuth Credentials
SOCIAL_META_CLIENT_ID=your_meta_app_id
SOCIAL_META_CLIENT_SECRET=your_meta_app_secret

# Token Encryption (32 bytes, base64 or hex)
SOCIAL_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
```

### Optional

```bash
# OAuth Redirect URI (defaults to CLIENT_URL + /api/social/oauth/meta/callback)
SOCIAL_META_REDIRECT_URI=https://api.fixloapp.com/api/social/oauth/meta/callback

# Client URL for fallback
CLIENT_URL=https://www.fixloapp.com
```

## Verification

### Method 1: Direct API Call

After completing OAuth, verify the connection:

```bash
curl https://api.fixloapp.com/api/social/force-status
```

### Method 2: Check MongoDB

```javascript
db.socialaccounts.find({
  platform: { $in: ['meta_facebook', 'meta_instagram'] },
  isActive: true
})
```

### Method 3: Check Logs

Look for these log messages:
```
[Meta OAuth Backend] CONNECTION COMPLETE
[Meta OAuth Backend] Facebook account created/updated
[Meta OAuth Backend] Instagram account created/updated
```

## Testing

Run the structure validation test:

```bash
cd server
node test-meta-oauth-structure.js
```

This validates:
- ✅ Code syntax and imports
- ✅ New method exists
- ✅ Endpoints are present
- ✅ Documentation comments are in place
- ✅ Security measures are implemented

## Troubleshooting

### Common Issues

**Issue: "No Facebook Pages found"**
- Cause: User doesn't manage any Facebook Pages
- Solution: Create a Facebook Business Page first

**Issue: "No Instagram Business Account found"**
- Cause: Facebook Page doesn't have a linked Instagram Business Account
- Solution: Link an Instagram Business Account to the Facebook Page

**Issue: "Page access token not available"**
- Cause: Meta app is not in Live mode
- Solution: Switch Meta app to Live mode in Meta for Developers

**Issue: "Token encryption error"**
- Cause: SOCIAL_ENCRYPTION_KEY not set or invalid
- Solution: Generate a new key:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```

## API Documentation

### POST /api/social/connect/meta_instagram/url

Get OAuth authorization URL

**Request:**
```json
GET /api/social/connect/meta_instagram/url?accountType=instagram
```

**Response:**
```json
{
  "success": true,
  "authUrl": "https://www.facebook.com/v18.0/dialog/oauth?..."
}
```

### GET /api/social/oauth/meta/callback

OAuth callback (called by Meta)

**Query Parameters:**
- `code` - Authorization code from Meta
- `state` - JSON string with `{ ownerId, accountType }`
- `error` - Error code (if OAuth failed)

**Response (Success):**
```json
{
  "success": true,
  "platform": "meta",
  "connected": true,
  "facebookConnected": true,
  "instagramConnected": true,
  "pageId": "...",
  "instagramBusinessId": "...",
  "message": "Successfully connected..."
}
```

**Response (Error):**
```json
{
  "success": false,
  "platform": "meta",
  "connected": false,
  "error": "Error message",
  "reason": "ERROR_CODE"
}
```

### GET /api/social/force-status

Check connection status

**Query Parameters:**
- `ownerId` - Optional owner ID (defaults to "admin")

**Response:**
```json
{
  "success": true,
  "facebookConnected": boolean,
  "instagramConnected": boolean,
  "pageId": string | null,
  "pageName": string | null,
  "instagramBusinessId": string | null,
  "instagramUsername": string | null,
  "connectedAt": date | null,
  "isTokenValid": boolean,
  "tokenExpiresAt": date | null
}
```

## Migration Notes

### Changes from Previous Implementation

1. **Callback no longer redirects to frontend**
   - Old: `res.redirect(clientUrl + '?connected=true')`
   - New: `res.json({ success: true, connected: true, ... })`

2. **Complete OAuth flow in backend**
   - Old: Frontend completed connection after redirect
   - New: Backend completes entire flow before responding

3. **New status endpoint**
   - Old: No way to check status without frontend
   - New: `/api/social/force-status` provides API-based status

4. **Enhanced token storage**
   - Old: Only stored basic account info
   - New: Stores both Page and Instagram tokens separately

### Backward Compatibility

This implementation:
- ✅ Does NOT break existing routes
- ✅ Does NOT change Meta scopes
- ✅ Maintains same database schema
- ✅ Uses same encryption service
- ✅ Follows same security practices

## Support

For issues or questions:
1. Check logs for `[Meta OAuth Backend]` messages
2. Verify environment variables are set
3. Check Meta app status (Live vs Development mode)
4. Use `/api/social/force-status` to check connection state
5. Review audit logs in MongoDB (`socialauditlogs` collection)
