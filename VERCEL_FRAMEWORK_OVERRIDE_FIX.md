# Vercel Framework Override Fix - Deployment Guide

## Problem Addressed

**Issue:** Vercel was treating the project as a Vite/React SPA and injecting its own fallback routing BEFORE the configured rewrites were evaluated.

**Impact:** All `/api/*` requests in production were serving `index.html` instead of proxying to the backend at `https://fixloapp.onrender.com/api/*`.

**Root Cause:** Missing `"framework": null` in `vercel.json` caused Vercel to auto-detect the framework and override the routing configuration with framework-specific defaults.

## Solution Implemented

### Change Made

Updated `vercel.json` to explicitly disable framework detection:

```json
{
  "framework": null,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://fixloapp.onrender.com/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**What Changed:**
- ✅ Added `"framework": null` to prevent Vercel from auto-detecting React/Vite
- ✅ Kept existing rewrites unchanged
- ✅ Maintained correct rewrite priority (API first, SPA fallback second)

**What Was NOT Changed:**
- ❌ No backend code modified
- ❌ No OAuth logic changed
- ❌ No Meta integration touched
- ❌ No frontend routing altered
- ❌ No build configuration changed

## Expected Behavior After Deployment

### Before This Fix
```bash
$ curl -i https://fixloapp.com/api/ping
HTTP/2 200
content-type: text/html
content-length: 1234

<!DOCTYPE html>
<html>
  <head>
    <title>Fixlo</title>
    ...
```
❌ **Wrong:** Returns HTML from SPA instead of JSON from backend

### After This Fix
```bash
$ curl -i https://fixloapp.com/api/ping
HTTP/2 200
content-type: application/json
content-length: 123

{"ok":true,"timestamp":"2026-01-25T...","message":"Fixlo API is operational"}
```
✅ **Correct:** Returns JSON from Render backend

## Post-Merge Deployment Steps

### Step 1: Clear Vercel Build Cache
1. Go to Vercel Dashboard → Project Settings
2. Navigate to "General" tab
3. Scroll to "Build & Development Settings"
4. Click "Clear Build Cache"
5. Confirm the action

**Why:** Ensures Vercel doesn't use cached framework detection from previous builds.

### Step 2: Verify Vercel Project Settings
Ensure these settings are configured in Vercel Dashboard:

**Framework Preset:**
- Set to: `Other` (NOT Vite, React, or Create React App)

**Build & Development Settings:**
- Framework Preset: `Other`
- Build Command: `npm run build`
- Output Directory: `dist` (or leave empty if using root)
- Install Command: `npm install`
- Root Directory: (leave empty)

**Advanced Settings:**
- ✅ Ensure "Single Page Application" fallback is NOT enabled separately
- ✅ The `vercel.json` config should be the source of truth

**Why:** The `"framework": null` in vercel.json should prevent auto-detection, but manual verification ensures consistency.

### Step 3: Trigger Production Deployment
```bash
# Option 1: Push to main branch (if this PR is merged)
git push origin main

# Option 2: Use Vercel CLI
vercel --prod

# Option 3: Use Vercel Dashboard
# Go to Deployments → Redeploy → "Redeploy with existing Build Cache cleared"
```

**Note:** Wait 1-2 minutes for deployment to complete.

### Step 4: Verify API Routing
Run these verification commands:

```bash
# Test 1: API ping endpoint
curl -i https://fixloapp.com/api/ping
# Expected: application/json response from Render backend

# Test 2: Check Content-Type header
curl -sI https://fixloapp.com/api/ping | grep -i content-type
# Expected: content-type: application/json

# Test 3: Verify it's NOT HTML
curl -s https://fixloapp.com/api/ping | head -1
# Expected: {"ok":true,...}
# NOT Expected: <!DOCTYPE html>

# Test 4: Check another API endpoint (if available)
curl -i https://fixloapp.com/api/health
# Expected: JSON response, not HTML

# Test 5: Verify SPA fallback still works
curl -sI https://fixloapp.com/ | grep -i content-type
# Expected: content-type: text/html (SPA should still serve)
```

### Step 5: Monitor Deployment
1. Check Vercel deployment logs for any errors
2. Verify no build errors occurred
3. Check Vercel Functions tab to ensure no serverless functions are being created (we're proxying to Render)
4. Monitor error rates in Vercel Analytics

## Troubleshooting

### Issue: Still Serving HTML for API Routes

**Possible Causes:**
1. Vercel build cache not cleared
2. Framework Preset still set to Vite/React in dashboard
3. Deployment didn't pick up new vercel.json

**Solutions:**
1. Clear build cache again and redeploy
2. Manually set Framework Preset to "Other" in Vercel settings
3. Force a new deployment with:
   ```bash
   vercel --prod --force
   ```

### Issue: SPA Routes Not Working

**Symptoms:** Direct navigation to routes like `/services` returns 404

**Cause:** This should NOT happen - the `/(.*) → /index.html` rewrite should handle it

**Solutions:**
1. Verify vercel.json was deployed correctly:
   ```bash
   curl -s https://fixloapp.com/vercel.json
   ```
2. Check if there are conflicting settings in Vercel dashboard
3. Ensure the SPA rewrite is still present and comes AFTER the API rewrite

### Issue: Backend API Not Responding

**Symptoms:** API routes return 502 or timeout

**Cause:** This is a backend issue at `https://fixloapp.onrender.com`, NOT related to this fix

**Solutions:**
1. Verify Render backend is running:
   ```bash
   curl -i https://fixloapp.onrender.com/api/ping
   ```
2. Check Render dashboard for backend errors
3. This fix only changes Vercel routing, not backend functionality

## Validation Checklist

After deployment, verify:

- [ ] ✅ `curl -i https://fixloapp.com/api/ping` returns JSON
- [ ] ✅ Content-Type header is `application/json` for API routes
- [ ] ✅ API routes do NOT return HTML
- [ ] ✅ SPA fallback still works for non-API routes
- [ ] ✅ Direct navigation to SPA routes (e.g., `/services`) works
- [ ] ✅ No new errors in Vercel deployment logs
- [ ] ✅ No serverless functions created in Vercel
- [ ] ✅ OAuth callbacks work (if applicable)
- [ ] ✅ Meta integration works (if applicable)

## Rollback Plan

If issues occur after deployment:

### Quick Rollback
1. Go to Vercel Dashboard → Deployments
2. Find the previous successful deployment
3. Click "..." → "Promote to Production"
4. Confirm promotion

### Git Rollback
```bash
git revert <commit-hash>
git push origin main
```

**Note:** Rollback will restore the broken behavior (API returns HTML), but ensures the site remains functional if other issues arise.

## Technical Details

### Why `"framework": null` Works

Vercel's deployment process:
1. Detects framework based on files (package.json, vite.config.js, etc.)
2. Applies framework-specific defaults (including SPA fallback)
3. Merges with vercel.json configuration
4. **Problem:** Framework defaults can override vercel.json rewrites

With `"framework": null`:
1. ✅ Vercel skips framework detection
2. ✅ No framework-specific defaults applied
3. ✅ vercel.json rewrites are used as-is
4. ✅ API routes are evaluated BEFORE SPA fallback

### Rewrite Order Matters

```json
{
  "rewrites": [
    {"source": "/api/(.*)", "destination": "https://..."},  // ← Checked FIRST
    {"source": "/(.*)", "destination": "/index.html"}       // ← Checked SECOND
  ]
}
```

**Evaluation:**
- Request to `/api/ping` → Matches first rule → Proxy to Render ✅
- Request to `/services` → Doesn't match first rule → Matches second → Serve index.html ✅

## Security Considerations

This change:
- ✅ Does NOT modify any code or logic
- ✅ Does NOT change authentication/authorization
- ✅ Does NOT expose new endpoints
- ✅ Only fixes routing configuration
- ✅ Maintains all existing security measures

**Security Impact:** Positive - Fixes broken OAuth callbacks and API routing

## Files Modified

- `vercel.json` (1 line added)

**Total Impact:**
- 1 file changed
- 1 insertion
- 0 deletions
- 100% configuration change

## References

- [Vercel Rewrites Documentation](https://vercel.com/docs/projects/project-configuration#rewrites)
- [Vercel Framework Detection](https://vercel.com/docs/deployments/configure-a-build#framework-preset)
- Problem Statement: GitHub Issue/PR #XXX
- Related Docs: `VERCEL_API_ROUTING_FIX_FINAL.md`

## Summary

**What:** Added `"framework": null` to vercel.json
**Why:** Prevent Vercel from overriding API rewrites with framework-specific fallbacks  
**Impact:** API routes will correctly proxy to backend instead of serving HTML
**Risk:** Very low - pure configuration change with clear rollback path
**Testing:** Comprehensive verification steps provided above

✅ **Ready for deployment after merge**
