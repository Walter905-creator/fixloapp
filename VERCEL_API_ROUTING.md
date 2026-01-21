# Vercel API Routing Configuration

## Problem Solved
Fixed production API routing so that serverless functions under `/api/*` are executed correctly instead of being served as frontend HTML.

## Solution Overview
Vercel has built-in priority for `/api/*` paths - any files in the `/api` directory are automatically exposed as serverless functions. However, catch-all rewrites can interfere with this behavior.

## Route Priority (How Vercel Processes Requests)

1. **API Routes (Highest Priority)**: `/api/*` paths are automatically routed to serverless functions in the `/api` directory
2. **Redirects**: Permanent or temporary redirects defined in `vercel.json`
3. **Headers**: Custom headers for specific paths
4. **Rewrites**: URL rewrites that don't change the browser URL
5. **Static Files**: Files in the build output
6. **404 Fallback**: When no match is found

## Configuration in vercel.json

### Before (Broken)
```json
{
  "rewrites": [
    ...specific rewrites...,
    {
      "source": "/(.*)",
      "destination": "/index.html"  // This was catching API routes!
    }
  ]
}
```

The catch-all rewrite `/(.*) → /index.html` was intercepting ALL requests, including `/api/*`, before they could reach the serverless functions.

### After (Fixed)
```json
{
  "rewrites": [
    ...specific rewrites for static pages...,
    {
      "source": "/((?!api).*)",
      "destination": "/index.html"
    }
  ]
}
```

**Key Change**: Used a negative lookahead regex `/((?!api).*)` to match all paths EXCEPT those starting with `api`. This ensures:
- `/api/*` paths are NOT rewritten and go to serverless functions
- All other paths fall back to `/index.html` for the SPA

## How It Works

1. **API Routes Are Reserved**: Vercel reserves `/api/*` exclusively for serverless functions
2. **Automatic Detection**: Any `.js` file in `/api/` becomes a serverless endpoint
3. **Priority Ordering**: API routes are checked BEFORE rewrites
4. **SPA Fallback**: For SPAs, the frontend app handles 404s client-side via React Router

## Testing API Routes

### Health Check Endpoint
```bash
# Should return JSON, not HTML
curl -i https://fixloapp.com/api/ping

# Expected Response:
# HTTP/2 200
# content-type: application/json
# 
# {
#   "status": "ok",
#   "timestamp": "2026-01-21T02:00:00.000Z",
#   "message": "Fixlo API is operational",
#   "environment": "production",
#   "region": "iad1"
# }
```

### Verify Not Serving HTML
```bash
# Check Content-Type header
curl -I https://fixloapp.com/api/ping | grep -i content-type

# Should show:
# content-type: application/json
```

## Available API Endpoints

1. **GET /api/ping** - Health check (no database required)
2. **GET /api/social/force-status** - Social media connection status

## Why This Works

Vercel's routing system processes requests in this order:

1. ✅ **Check `/api/*` directory** - If file exists, execute serverless function
2. ✅ **Check redirects** - Apply permanent/temporary redirects
3. ✅ **Check rewrites** - Apply URL rewrites (excluding `/api/*`)
4. ✅ **Check static files** - Serve from build output
5. ✅ **SPA client-side routing** - React Router handles the rest

By removing the catch-all rewrite, we allow Vercel's built-in API routing to work correctly.

## Deployment Notes

- Frontend build outputs to root directory
- Serverless functions are in `/api` directory
- Both are deployed together in a single Vercel project
- No additional configuration needed for API routing to work

## References

- [Vercel Serverless Functions](https://vercel.com/docs/serverless-functions)
- [Vercel Rewrites Documentation](https://vercel.com/docs/rewrites)
- [API Directory Reserved Path](https://vercel.com/docs/serverless-functions/introduction)
