# Vercel API Routing Fix - Deployment Guide

## 🎯 Objective
Fix Vercel to properly proxy ALL `/api/*` requests to the Render backend instead of serving the SPA fallback (index.html).

## 🔍 Problem Summary
- **Issue**: `https://fixloapp.com/api/ping` returns HTML (Content-Type: text/html, Server: Vercel)
- **Root Cause**: vercel.json contained legacy configuration keys that interfered with API rewrites
- **Impact**: API requests were being handled by Vercel instead of proxied to Render backend

## ✅ Fix Implemented
Updated `vercel.json` to contain **ONLY** the rewrites configuration:

```json
{
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

### Changes Made
- ❌ **Removed** `$schema`, `version`, `trailingSlash` (metadata)
- ❌ **Removed** `redirects` array (22 redirect rules for UTM params and clean URLs)
- ❌ **Removed** `env` object (4 React feature flags)
- ❌ **Removed** `headers` array (9 header rules for security, SEO, caching)
- ✅ **Kept** ONLY `rewrites` with API proxy FIRST, SPA fallback LAST

## 🚀 Deployment Steps

### 1. Force Production Redeploy on Vercel

**Option A: Via Vercel Dashboard**
1. Go to https://vercel.com/walter905-creator/fixloapp
2. Navigate to the latest deployment
3. Click "Redeploy" → Select "Use existing Build Cache" → Uncheck it
4. Click "Redeploy" to force a fresh build

**Option B: Via Vercel CLI**
```bash
vercel --prod --force
```

**Option C: Via Git Push (Recommended)**
```bash
# This PR commit will automatically trigger a deployment
# Just merge the PR to trigger production deployment
```

### 2. Clear Build Cache (Critical!)
If using Vercel CLI:
```bash
vercel build --yes --prod --clean
```

Or in Vercel Dashboard:
1. Project Settings → General
2. Scroll to "Build & Development Settings"
3. Clear build cache

### 3. Verify the Fix

**Test API Endpoint:**
```bash
curl -i https://fixloapp.com/api/ping
```

**Expected Response:**
```
HTTP/2 200
content-type: application/json
server: Render  # or Express - NOT Vercel
...

{"status":"ok","timestamp":"..."}
```

**❌ FAILURE if you see:**
```
HTTP/2 200
content-type: text/html
server: Vercel
...

<!DOCTYPE html>...
```

### 4. Additional Verification Tests

**Test CORS endpoint:**
```bash
curl -i https://fixloapp.com/api/cors-test
```

**Test backend health:**
```bash
curl -i https://fixloapp.com/api/health
```

**Test a non-API route (should still work):**
```bash
curl -i https://fixloapp.com/
# Should return index.html with React app
```

## 📊 Monitoring Post-Deployment

1. **Check Vercel Logs** for any rewrite errors
2. **Monitor Render Backend** at https://dashboard.render.com for increased API traffic
3. **Test Mobile App** API calls to ensure connectivity
4. **Test Web App** API calls in browser console

## ⚠️ Important Notes

### What This Fix Does:
- ✅ Proxies ALL `/api/*` requests to Render backend
- ✅ Maintains SPA routing for all other paths
- ✅ Eliminates the conflict between API routes and SPA fallback

### What This Fix Does NOT Include:
- ❌ Removed redirects (UTM params, HTML→clean URLs) - may need to re-implement separately
- ❌ Removed custom headers (security, SEO) - may need to re-implement separately
- ❌ Removed environment variables from vercel.json - use Vercel dashboard instead

### If Redirects/Headers Are Needed:
After confirming API routing works, redirects and headers can be re-added **in a separate deployment** to verify they don't conflict with API rewrites.

## 🔄 Rollback Plan
If issues occur, rollback to previous vercel.json:
```bash
git revert <commit-hash>
git push origin main
```

## 📝 Success Criteria Checklist
- [ ] `curl https://fixloapp.com/api/ping` returns JSON (not HTML)
- [ ] Response `Content-Type` is `application/json` (not `text/html`)
- [ ] Response `Server` header is NOT "Vercel"
- [ ] Web app still loads correctly at https://fixloapp.com
- [ ] Mobile app can connect to API
- [ ] Render backend shows increased API traffic in logs

## 🆘 Troubleshooting

### Issue: Still getting HTML from /api/ping
**Solutions:**
1. Clear Vercel build cache completely
2. Force redeploy without cache
3. Check Vercel deployment logs for errors
4. Verify vercel.json is at repository root
5. Ensure no .vercelignore is excluding vercel.json

### Issue: API requests return 404
**Solutions:**
1. Verify Render backend is running: `curl https://fixloapp.onrender.com/api/ping`
2. Check Render logs for errors
3. Verify backend has correct CORS configuration

### Issue: Web app routes broken
**Solutions:**
1. Check browser console for errors
2. Verify index.html is in repository root
3. Test with: `curl https://fixloapp.com/`

## 📞 Support
- Render Backend: https://dashboard.render.com/web/srv-xxx
- Vercel Dashboard: https://vercel.com/walter905-creator/fixloapp
- GitHub Repo: https://github.com/Walter905-creator/fixloapp

---

**Commit**: Fix Vercel API routing - remove all legacy config, keep only rewrites
**PR Branch**: copilot/fix-vercel-rewrites-config
**Date**: 2026-01-25
