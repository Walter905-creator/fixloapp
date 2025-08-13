# 🔧 Fix Admin login ERR_CONNECTION_REFUSED / TypeError: Failed to fetch (no regressions)

**Title:** 🔧 Fix Admin login ERR_CONNECTION_REFUSED / TypeError: Failed to fetch (no regressions)

**Body:**

Do not modify: vercel.json rewrites, homepage plumbing, or Request a Service popups/buttons.
Goal: Make Admin login load reliably in production without console/network errors.

## Acceptance Criteria

- Admin login API calls succeed on www.fixloapp.com
- No localhost:* references in production bundles
- All admin/API calls use relative /api/... paths
- CORS preflight passes; no "Failed to fetch" in console

## Steps (what to do)

1. Confirm request URL in DevTools → Network during admin login. It must be /api/... (not http://localhost:3001/...).

2. Keep this rewrite in vercel.json (verify it exists):
   ```json
   { "source": "/api/(.*)", "destination": "https://fixloapp.onrender.com/api/$1" }
   ```
   (Vercel external rewrites = reverse proxy; don't change other routes. [Vercel Docs](https://vercel.com/docs/functions/rewrites))

3. Backend CORS on Render must allow our origins and headers:
   - Access-Control-Allow-Origin: https://www.fixloapp.com (and preview domain if needed)
   - Allow methods/headers we send (Authorization, etc.), handle OPTIONS preflight. ([CORS + preflight refs](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS))

4. Mixed content: ensure all calls are HTTPS (no http:// endpoints). [Vercel HTTPS guide](https://vercel.com/docs/concepts/edge-network/protocols#https)

5. Re-test, attach:
   - DevTools request showing /api/... and 2xx response
   - Response headers with correct CORS
   - Console free of Failed to fetch

## Out of scope / guardrails

- Don't alter vercel.json except to verify the /api/(.*) rewrite exists.
- Don't touch Request a Service popups/buttons.
- Don't switch analytics/wrappers off; if wrapper adds headers, update CORS to match.

**Labels:** bug, admin, production, cors
**Assignees:** @Walter905-creator
**Priority:** High