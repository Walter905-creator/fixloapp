# Social Media Automated Posting - Quick Reference

## What Was Implemented

This implementation enables **fully operational automated social media posting** for Fixlo without relying on the Admin UI.

### New Endpoints

#### 1. POST /api/social/post/test
**Purpose**: Send a test post to Instagram to verify the system is working

**Authentication**: Admin JWT token required

**Request**:
```bash
curl -X POST https://fixloapp.com/api/social/post/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response**:
```json
{
  "success": true,
  "message": "Test post published successfully",
  "platform": "instagram",
  "account": "fixloapp",
  "postId": "18123456789012345",
  "postUrl": "https://instagram.com/p/18123456789012345",
  "caption": "Fixlo test post — automated social system is live 🚀"
}
```

**Logging**: Safe production logging
- `[Social Post] Attempt`
- `[Social Post] Success`
- `[Social Post] Failure`

#### 2. POST /api/social/scheduler/start
**Purpose**: Start the automated scheduler for processing scheduled posts

**Authentication**: Admin JWT token required

**Request**:
```bash
curl -X POST https://fixloapp.com/api/social/scheduler/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response**:
```json
{
  "success": true,
  "message": "Scheduler started successfully",
  "status": {
    "isRunning": true,
    "emergencyStop": false,
    "activeJobs": 4
  },
  "metaAccounts": {
    "instagram": true,
    "facebook": true
  },
  "manualApprovalMode": true
}
```

**Safety Checks**:
- ✅ Verifies Meta is connected before starting
- ✅ Respects manual approval mode
- ✅ Idempotent (safe to call multiple times)
- ✅ Emergency stop support

#### 3. GET /api/social/scheduler/status
**Purpose**: Check scheduler status and Meta connection

**Authentication**: None required (read-only)

**Request**:
```bash
curl https://fixloapp.com/api/social/scheduler/status
```

**Response**:
```json
{
  "success": true,
  "scheduler": {
    "isRunning": true,
    "emergencyStop": false,
    "activeJobs": 4
  },
  "meta": {
    "connected": true,
    "instagram": { "connected": true, "isValid": true },
    "facebook": { "connected": true, "isValid": true }
  }
}
```

### Existing Endpoint (No Changes)

#### GET /api/social/force-status
**Purpose**: Verify Meta OAuth connection status

**Request**:
```bash
curl https://fixloapp.com/api/social/force-status
```

## Backend as Source of Truth

All posting logic now relies **only on database state**:

✅ **Connection Status**: Read from `SocialAccount` collection
- `isActive: true`
- `isTokenValid: true`
- `platform: 'meta_instagram' | 'meta_facebook'`

✅ **Token Validation**: Checks `tokenExpiresAt` before posting

✅ **Error Handling**: Returns structured errors when:
- No account connected
- Token expired
- Token invalid/revoked
- Database unavailable

❌ **Frontend flags ignored**: Does not rely on UI state

## Security Features

### Token Protection
- ✅ AES-256-CBC encryption
- ✅ Stored in separate `EncryptedToken` collection
- ✅ Never logged or exposed in responses
- ✅ Encryption key in `SOCIAL_ENCRYPTION_KEY` env var

### Authentication
- ✅ Admin JWT required for POST /post/test
- ✅ Admin JWT required for POST /scheduler/start
- ✅ No auth for GET /scheduler/status (read-only)
- ✅ Token verification using `jsonwebtoken` library

### CORS
- ✅ Allowed origins: `fixloapp.com`, `www.fixloapp.com`, `localhost:3000`
- ✅ Vercel preview URLs: `*.vercel.app`
- ✅ Preflight OPTIONS support

### Production-Safe Logging
```javascript
// ✅ SAFE - No sensitive data
console.log('[Social Post] Attempt', { requestId, timestamp });
console.log('[Social Post] Success', { postId, platform });
console.log('[Social Post] Failure', { error: error.message });

// ❌ UNSAFE - Never done
// console.log(accessToken);
// console.log(decryptedToken);
```

## File Locations

### Serverless Functions (Vercel)
```
/api/social/post/test.js           - Test posting endpoint
/api/social/scheduler/start.js     - Scheduler start endpoint
/api/social/scheduler/status.js    - Scheduler status endpoint
/api/social/force-status.js        - Connection status (existing)
```

### Express Routes (Main Server)
```
/server/modules/social-manager/routes/index.js
  - POST /api/social/post/test
  - POST /api/social/scheduler/start
  - GET /api/social/scheduler/status
```

### Documentation
```
/docs/SOCIAL_MEDIA_POSTING_GUIDE.md - Complete user guide
```

## Integration Points

### Uses Existing Infrastructure

1. **Meta OAuth Handler** (`oauth/metaHandler.js`)
   - Connection management
   - Token refresh
   - Account info retrieval

2. **Posting Adapter** (`posting/metaAdapter.js`)
   - Instagram Graph API calls
   - Facebook Graph API calls
   - Media container creation

3. **Scheduler** (`scheduler/index.js`)
   - Cron job management
   - Post processing
   - Token refresh
   - Retry logic

4. **Token Encryption** (`security/tokenEncryption.js`)
   - Encrypt/decrypt tokens
   - Token rotation
   - Token revocation

5. **Database Models**
   - `SocialAccount` - Platform connections
   - `EncryptedToken` - Token storage
   - `ScheduledPost` - Post queue
   - `SocialAuditLog` - Audit trail

### No Changes Made To

- ❌ OAuth logic
- ❌ Meta scopes
- ❌ Frontend code
- ❌ Existing routes
- ❌ Security/encryption
- ❌ Database models

## How to Use

### Step 1: Verify Connection
```bash
curl https://fixloapp.com/api/social/force-status
```

Expected: `"instagramConnected": true`

### Step 2: Send Test Post
```bash
curl -X POST https://fixloapp.com/api/social/post/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected: Post appears on Instagram

### Step 3: Enable Scheduler
```bash
curl -X POST https://fixloapp.com/api/social/scheduler/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected: `"isRunning": true`

### Step 4: Monitor Status
```bash
curl https://fixloapp.com/api/social/scheduler/status
```

Expected: Scheduler running, Meta connected

## Environment Variables Required

```bash
# Database
MONGODB_URI=mongodb://...

# JWT Authentication  
JWT_SECRET=your_secret

# Meta OAuth
SOCIAL_META_CLIENT_ID=your_app_id
SOCIAL_META_CLIENT_SECRET=your_app_secret

# Token Encryption
SOCIAL_ENCRYPTION_KEY=base64_encoded_32_byte_key
```

## Deployment Notes

### Vercel (Serverless Functions)
- ✅ Endpoints work in `/api/social/` directory
- ✅ Auto-deployed with push to main
- ✅ Database connection pooling configured
- ⚠️ Scheduler endpoints inform about main server requirement

### Express Server (Render/Railway)
- ✅ Full scheduler support with cron jobs
- ✅ All routes available at `/api/social/*`
- ✅ Token refresh every 6 hours
- ✅ Post processing every 15 minutes

## Testing Checklist

- [x] Syntax validation (all files)
- [x] Security features implemented
- [x] Logging implemented
- [x] Documentation complete
- [x] Routes added to Express
- [x] Serverless functions created
- [ ] Manual API testing (requires live environment)
- [ ] Production deployment
- [ ] Monitor first automated post

## Support

**Documentation**: `/docs/SOCIAL_MEDIA_POSTING_GUIDE.md`
**Audit Logs**: `GET /api/social/admin/audit-logs`
**Meta Debug**: `GET /api/social/debug/meta`

---

**Status**: ✅ Implementation Complete - Ready for Production Testing
