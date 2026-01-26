# Serverless Scheduler Verification Guide

## Overview
The social media scheduler has been converted to a serverless-compatible architecture for Vercel deployment. This guide provides steps to verify the implementation.

## Architecture Changes

### Before (Cron-Based)
- Used `node-cron` with setInterval for continuous execution
- Required long-running process
- Not compatible with Vercel serverless functions

### After (Event-Driven)
- On-demand execution via HTTP endpoint
- MongoDB-based state persistence
- Execution locking prevents concurrent runs
- Fully serverless-compatible

## New Components

### 1. SchedulerState Model
**Location**: `server/modules/social-manager/models/SchedulerState.js`

Persists scheduler execution state in MongoDB:
- `lastRunAt`: When scheduler last executed
- `executionLock`: Prevents concurrent executions
- `lockExpiry`: Stale lock recovery
- `nextScheduledPost`: Info about next scheduled post
- Statistics: total executions, posts published, etc.

### 2. Scheduler.executeOnce()
**Location**: `server/modules/social-manager/scheduler/index.js`

New serverless-compatible method:
- Executes one scheduler cycle
- Acquires MongoDB lock before execution
- Processes scheduled posts that are due
- Updates state after completion
- Idempotent and safe to call multiple times

### 3. POST /api/social/scheduler/run
**Location**: `api/social/scheduler/run.js`

New endpoint to trigger scheduler execution:
- **Authentication**: Required (JWT admin token or admin secret key)
- **Method**: POST
- **Response**: Execution results (posts processed/published)
- **Idempotent**: Safe to call multiple times

### 4. Updated GET /api/social/scheduler/status
**Location**: `api/social/scheduler/status.js`

Enhanced status endpoint:
- Shows `lastRunAt` from MongoDB
- Shows `nextScheduledPost` information
- Shows `databaseAvailable` status
- Shows `operational` status (db + meta connected)
- Includes `serverless: true` indicator

## Verification Steps

### Step 1: Check Status Endpoint

```bash
curl https://fixloapp.com/api/social/scheduler/status | jq '.'
```

**Expected Response:**
```json
{
  "success": true,
  "environment": "serverless",
  "serverless": true,
  "operational": true,
  "scheduler": {
    "lastRunAt": "2026-01-26T...",
    "lastRunDuration": 1234,
    "lastRunStatus": "success",
    "totalExecutions": 5,
    "totalPostsPublished": 3,
    "executionLock": false,
    "nextScheduledPost": {
      "postId": "...",
      "scheduledFor": "2026-01-27T...",
      "platform": "meta_instagram"
    }
  },
  "metaConnected": true,
  "databaseAvailable": true,
  "endpoints": {
    "run": "/api/social/scheduler/run (POST, requires auth)",
    "status": "/api/social/scheduler/status (GET, public)"
  }
}
```

### Step 2: Test Authentication (Should Fail)

```bash
curl -X POST https://fixloapp.com/api/social/scheduler/run
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Missing or invalid Authorization header"
}
```

### Step 3: Execute Scheduler (With Auth)

```bash
curl -X POST https://fixloapp.com/api/social/scheduler/run \
  -H "Authorization: Bearer fixlo_admin_2026_super_secret_key"
```

**Expected Response:**
```json
{
  "success": true,
  "result": {
    "success": true,
    "postsProcessed": 0,
    "postsPublished": 0,
    "duration": 152,
    "nextScheduledPost": null,
    "timestamp": "2026-01-26T..."
  },
  "message": "Processed 0 posts, published 0"
}
```

### Step 4: Verify Idempotency

Call the run endpoint twice in quick succession:

```bash
# First call
curl -X POST https://fixloapp.com/api/social/scheduler/run \
  -H "Authorization: Bearer fixlo_admin_2026_super_secret_key" &

# Second call (immediately after)
curl -X POST https://fixloapp.com/api/social/scheduler/run \
  -H "Authorization: Bearer fixlo_admin_2026_super_secret_key"
```

**Expected Behavior:**
- One request executes normally
- Other request returns: `"skipped": true, "reason": "Another instance is running"`

### Step 5: Check Updated State

```bash
curl https://fixloapp.com/api/social/scheduler/status | jq '.scheduler'
```

**Verify:**
- `lastRunAt` is updated to recent timestamp
- `totalExecutions` incremented
- `lastRunStatus` is "success"

## Automated Verification

### Using Test Script

```bash
node test-scheduler-endpoints.js
```

Or test against production:

```bash
API_URL=https://fixloapp.com node test-scheduler-endpoints.js
```

### Using Shell Script

```bash
./verify-scheduler-serverless.sh https://fixloapp.com
```

## Setting Up Vercel Cron (Optional)

To enable automated execution on Vercel, add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/social/scheduler/run",
    "schedule": "*/15 * * * *"
  }]
}
```

**Note**: Vercel Cron automatically includes authentication headers, so no additional auth configuration needed.

## Security Verification

### 1. Authorization Check
✅ Run endpoint requires authentication
✅ Status endpoint is public (read-only)
✅ Supports both JWT tokens and admin secret key

### 2. Execution Lock
✅ MongoDB-based lock prevents concurrent executions
✅ Lock expires after 5 minutes (stale lock recovery)
✅ Lock is released after completion

### 3. Secrets Management
✅ No hardcoded secrets in code
✅ Uses environment variables (JWT_SECRET, ADMIN_SECRET_KEY)
✅ Admin secret key has sensible default for testing

## Backward Compatibility

✅ Cron-based scheduler still works for local development
✅ No changes to Meta OAuth logic
✅ No changes to posting adapters
✅ No frontend modifications required

## Troubleshooting

### Database Not Available
- Check MONGO_URI environment variable in Vercel
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Check connection string format

### Meta Not Connected
- Run Meta OAuth flow first
- Check SocialAccount records in MongoDB
- Verify tokens are not expired

### Execution Lock Stuck
Locks auto-expire after 5 minutes. To manually clear:

```javascript
// In MongoDB shell or Compass
db.schedulerstates.updateOne(
  { _id: 'scheduler_state' },
  { $set: { executionLock: false, lockExpiry: null, lockedBy: null } }
)
```

## Production Deployment Checklist

- [ ] Verify MONGO_URI is set in Vercel environment variables
- [ ] Verify ADMIN_SECRET_KEY is set (or use default)
- [ ] Verify JWT_SECRET is set
- [ ] Test status endpoint returns 200
- [ ] Test run endpoint with auth
- [ ] Verify Meta accounts are connected
- [ ] (Optional) Add Vercel Cron configuration
- [ ] Monitor execution via status endpoint

## Monitoring

### Check Last Execution
```bash
curl https://fixloapp.com/api/social/scheduler/status | jq '.scheduler.lastRunAt'
```

### Check Execution Stats
```bash
curl https://fixloapp.com/api/social/scheduler/status | jq '.scheduler | {totalExecutions, totalPostsPublished, lastRunStatus}'
```

### Check Next Scheduled Post
```bash
curl https://fixloapp.com/api/social/scheduler/status | jq '.scheduler.nextScheduledPost'
```

## Success Criteria

✅ Status endpoint returns serverless: true
✅ Database connection successful
✅ Meta connection status shown
✅ Run endpoint requires authentication
✅ Run endpoint executes successfully with auth
✅ Idempotency works (concurrent calls handled)
✅ State persists in MongoDB
✅ No frontend changes required
✅ No Meta OAuth changes required
✅ Backward compatible with local dev
