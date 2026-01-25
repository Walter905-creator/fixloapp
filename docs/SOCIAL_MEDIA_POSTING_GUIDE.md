# Social Media Automated Posting System - User Guide

## Overview

The Fixlo Social Media Manager now supports fully automated posting to Instagram and Facebook. This guide explains how to verify connections, send test posts, and enable the scheduler.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Verify Meta Connection](#verify-meta-connection)
3. [Send a Test Post](#send-a-test-post)
4. [Enable the Scheduler](#enable-the-scheduler)
5. [Check Scheduler Status](#check-scheduler-status)
6. [Troubleshooting](#troubleshooting)
7. [Security Notes](#security-notes)

---

## Prerequisites

Before using the automated posting system, ensure:

1. **Meta OAuth Connected**: You have completed the Meta OAuth flow and connected your Instagram Business Account and/or Facebook Page
2. **Valid Tokens**: The stored access tokens are valid and not expired
3. **Admin Access**: You have admin JWT token for authenticated endpoints
4. **Database Connected**: MongoDB is configured and accessible

### Environment Variables Required

```bash
# Database
MONGODB_URI=mongodb://...

# JWT Authentication
JWT_SECRET=your_jwt_secret

# Meta OAuth Credentials
SOCIAL_META_CLIENT_ID=your_meta_app_id
SOCIAL_META_CLIENT_SECRET=your_meta_app_secret

# Token Encryption
SOCIAL_ENCRYPTION_KEY=base64_encoded_32_byte_key
```

---

## Verify Meta Connection

### Endpoint: `GET /api/social/force-status`

This endpoint checks your Meta connection status and returns information about connected accounts.

**No authentication required** (read-only endpoint)

### Request

```bash
curl https://fixloapp.com/api/social/force-status
```

### Response

```json
{
  "success": true,
  "facebookConnected": true,
  "instagramConnected": true,
  "pageId": "123456789",
  "pageName": "Fixlo",
  "instagramBusinessId": "987654321",
  "instagramUsername": "fixloapp",
  "connectedAt": "2024-01-15T10:30:00.000Z",
  "isTokenValid": true,
  "tokenExpiresAt": "2024-03-15T10:30:00.000Z",
  "requestId": "abc123"
}
```

### Interpretation

- ✅ **instagramConnected: true** - Ready to post to Instagram
- ✅ **facebookConnected: true** - Ready to post to Facebook
- ✅ **isTokenValid: true** - Token is valid
- ❌ **instagramConnected: false** - Need to connect via Meta OAuth

---

## Send a Test Post

### Endpoint: `POST /api/social/post/test`

Sends a test post to Instagram using your stored credentials. This endpoint:

- Posts directly without scheduling
- Uses hardcoded test content
- Returns the post ID and URL
- Logs the action for auditing

**Authentication required**: Admin JWT token

### Request

```bash
curl -X POST https://fixloapp.com/api/social/post/test \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Serverless Function (Vercel)

```bash
curl -X POST https://fixloapp.com/api/social/post/test \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Success Response

```json
{
  "success": true,
  "message": "Test post published successfully",
  "platform": "instagram",
  "account": "fixloapp",
  "postId": "18123456789012345",
  "postUrl": "https://instagram.com/p/18123456789012345",
  "caption": "Fixlo test post — automated social system is live 🚀",
  "requestId": "xyz789"
}
```

### Error Responses

#### No Instagram Account Connected

```json
{
  "success": false,
  "error": "No active Instagram account found",
  "message": "Connect Instagram via Meta OAuth first",
  "requestId": "xyz789"
}
```

#### Token Expired

```json
{
  "success": false,
  "error": "Instagram token expired",
  "message": "Re-authenticate via Meta OAuth",
  "requestId": "xyz789"
}
```

#### Authentication Failed

```json
{
  "success": false,
  "error": "Invalid or expired token",
  "requestId": "xyz789"
}
```

---

## Enable the Scheduler

### Endpoint: `POST /api/social/scheduler/start`

Starts the automated scheduler that processes scheduled posts. The scheduler:

- Runs cron jobs every 15 minutes to check for scheduled posts
- Refreshes tokens every 6 hours
- Retries failed posts hourly
- Respects manual approval mode
- Can be safely called multiple times (idempotent)

**Authentication required**: Admin JWT token

### Request

```bash
curl -X POST https://fixloapp.com/api/social/scheduler/start \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Success Response

```json
{
  "success": true,
  "message": "Scheduler started successfully",
  "status": {
    "isRunning": true,
    "emergencyStop": false,
    "activeJobs": 4,
    "jobs": [
      {
        "name": "scheduled-posting",
        "schedule": "*/15 * * * *"
      },
      {
        "name": "token-refresh",
        "schedule": "0 */6 * * *"
      },
      {
        "name": "metrics-collection",
        "schedule": "0 2 * * *"
      },
      {
        "name": "retry-failed",
        "schedule": "0 * * * *"
      }
    ]
  },
  "metaAccounts": {
    "instagram": true,
    "facebook": true
  },
  "manualApprovalMode": true,
  "requestId": "def456"
}
```

### Error Responses

#### Meta Not Connected

```json
{
  "success": false,
  "error": "Meta accounts not connected",
  "message": "Connect Instagram or Facebook via Meta OAuth before starting scheduler",
  "requestId": "def456"
}
```

### Scheduler Already Running

```json
{
  "success": true,
  "message": "Scheduler already running",
  "status": {
    "isRunning": true,
    "emergencyStop": false,
    "activeJobs": 4
  },
  "requestId": "def456"
}
```

---

## Check Scheduler Status

### Endpoint: `GET /api/social/scheduler/status`

Returns the current status of the scheduler and Meta connections.

**No authentication required** (read-only endpoint)

### Request

```bash
curl https://fixloapp.com/api/social/scheduler/status
```

### Response

```json
{
  "success": true,
  "scheduler": {
    "isRunning": true,
    "emergencyStop": false,
    "activeJobs": 4,
    "jobs": [
      {
        "name": "scheduled-posting",
        "schedule": "*/15 * * * *"
      },
      {
        "name": "token-refresh",
        "schedule": "0 */6 * * *"
      }
    ]
  },
  "meta": {
    "connected": true,
    "totalAccounts": 2,
    "validAccounts": 2,
    "instagram": {
      "connected": true,
      "isValid": true
    },
    "facebook": {
      "connected": true,
      "isValid": true
    }
  },
  "timestamp": "2024-01-15T14:30:00.000Z",
  "requestId": "ghi123"
}
```

---

## Troubleshooting

### Issue: Test Post Fails with "No active Instagram account found"

**Solution**: Complete the Meta OAuth flow first:

1. Navigate to the admin panel
2. Click "Connect Instagram"
3. Complete the OAuth authorization
4. Verify connection with `/api/social/force-status`

### Issue: Test Post Fails with "Instagram token expired"

**Solution**: Re-authenticate via Meta OAuth:

1. The token automatically refreshes every 60 days
2. If expired, disconnect and reconnect via OAuth
3. Tokens are stored encrypted in the database

### Issue: Scheduler Won't Start - "Meta accounts not connected"

**Solution**: Ensure at least one Meta account is connected:

```bash
# Check connection status
curl https://fixloapp.com/api/social/force-status

# Should show:
# "instagramConnected": true OR "facebookConnected": true
```

### Issue: Posts Not Publishing Automatically

**Checklist**:

1. ✅ Scheduler is running: `GET /api/social/scheduler/status`
2. ✅ Scheduled posts exist with status `approved` or `scheduled`
3. ✅ Posts are scheduled for current time
4. ✅ Rate limits not exceeded
5. ✅ Manual approval mode settings correct

### Issue: "Database connection unavailable"

**Solution**: Verify `MONGODB_URI` environment variable:

```bash
# Check if MongoDB is accessible
curl https://fixloapp.com/api/social/force-status

# Should not return "Database connection unavailable"
```

---

## Security Notes

### Token Storage

- ✅ Tokens are encrypted using AES-256-CBC
- ✅ Encryption key stored in environment variable `SOCIAL_ENCRYPTION_KEY`
- ✅ Never logged or exposed in API responses
- ✅ Stored separately in `EncryptedToken` collection

### Authentication

- ✅ Test posting requires admin JWT token
- ✅ Scheduler control requires admin JWT token
- ✅ Status endpoints are read-only (no auth required)
- ✅ All endpoints use CORS restrictions

### Logging

Safe logging practices (no sensitive data):

```
✅ [Social Post] Attempt
✅ [Social Post] Success
✅ [Social Post] Failure
```

**Never logged**:
- ❌ Access tokens
- ❌ Encryption keys
- ❌ Full user credentials

### Production Deployment

1. Use HTTPS only (`https://fixloapp.com`)
2. Set `NODE_ENV=production`
3. Rotate `JWT_SECRET` regularly
4. Monitor audit logs via `/api/social/admin/audit-logs`
5. Set up alerts for failed posts

---

## API Reference Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/social/force-status` | GET | No | Check Meta connection status |
| `/api/social/post/test` | POST | Yes | Send test post to Instagram |
| `/api/social/scheduler/start` | POST | Yes | Start the scheduler |
| `/api/social/scheduler/status` | GET | No | Check scheduler status |

---

## Next Steps

1. **Verify Connection**: `GET /api/social/force-status`
2. **Test Posting**: `POST /api/social/post/test`
3. **Enable Scheduler**: `POST /api/social/scheduler/start`
4. **Monitor Status**: `GET /api/social/scheduler/status`

For advanced features like AI content generation, custom scheduling, and analytics, see the main Social Media Manager documentation.

---

**Questions or Issues?**

- Check server logs for detailed error messages
- Review audit logs: `/api/social/admin/audit-logs`
- Verify environment variables are set correctly
- Contact support if Meta OAuth issues persist
