# Vercel API Routing Configuration

## Overview

This document explains how API routes are configured for the Fixlo application on Vercel.

## Architecture

Fixlo uses a **hybrid deployment** architecture:
- **Frontend**: React SPA deployed to Vercel (static files)
- **Backend API**: Node.js serverless functions deployed to Vercel (in `/api` directory)
- **Database**: MongoDB Atlas (external)

## API Route Configuration

### Vercel Serverless Functions

Vercel automatically exposes any file in the `/api` directory as a serverless function:
- `/api/ping.js` → `GET /api/ping`
- `/api/social/force-status.js` → `GET /api/social/force-status`

### vercel.json Configuration

The `vercel.json` file controls routing:

```json
{
  "rewrites": [
    {
      "source": "/api/ping",
      "destination": "/api/ping"
    },
    {
      "source": "/api/social/force-status",
      "destination": "/api/social/force-status"
    },
    // ... other routes ...
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Key Points:**
1. **API routes MUST be defined BEFORE the SPA fallback** (`/(.*)`).
2. API routes return JSON responses, not HTML.
3. The SPA fallback catches all non-API routes and serves `index.html`.

### Route Order Matters

Routes are matched **top-to-bottom**. If the SPA fallback (`/(.*)`) comes before API routes, all requests (including API calls) would serve `index.html` instead of JSON.

**Current Order (Correct):**
1. `/api/ping` → Serverless function
2. `/api/social/force-status` → Serverless function
3. Other specific routes (terms, privacy, etc.)
4. `/(.*)`  → SPA fallback (serves index.html)

## Testing API Routes

### Local Testing

```bash
# Start Vercel dev server
npx vercel dev

# Test endpoints
curl http://localhost:3000/api/ping
curl http://localhost:3000/api/social/force-status
```

### Production Testing

```bash
# Test on production domain
curl https://fixloapp.com/api/ping
curl https://fixloapp.com/api/social/force-status
```

### Expected Responses

**GET /api/ping**
```json
{
  "status": "ok",
  "timestamp": "2026-01-21T01:52:00.000Z",
  "message": "Fixlo API is operational",
  "environment": "production",
  "region": "iad1"
}
```

**GET /api/social/force-status**
```json
{
  "success": true,
  "facebookConnected": false,
  "instagramConnected": false,
  "pageId": null,
  "pageName": null,
  "instagramBusinessId": null,
  "instagramUsername": null,
  "connectedAt": null,
  "isTokenValid": false,
  "tokenExpiresAt": null,
  "requestId": "abc123"
}
```

## Environment Variables

Configure these in Vercel dashboard:

- `MONGODB_URI`: MongoDB connection string (optional for /api/ping)
- `VERCEL_ENV`: Automatically set by Vercel (production, preview, development)
- `VERCEL_REGION`: Automatically set by Vercel

## Security Features

### CORS Configuration

Both endpoints implement CORS headers for allowed origins:
- `https://www.fixloapp.com`
- `https://fixloapp.com`
- `http://localhost:3000`
- `*.vercel.app` (preview deployments)

### Security Headers

All API responses include:
- `Content-Type: application/json`
- `X-Content-Type-Options: nosniff`
- `X-Request-ID: <unique-id>` (for force-status)

### Input Validation

- Method validation (only GET allowed)
- Query parameter validation (ownerId format check)
- Error handling with appropriate HTTP status codes

## Logging

All API requests are logged with:
- Request ID (unique identifier)
- Method
- Timestamp
- Origin (for CORS debugging)
- Query parameters

**Example log output:**
```
[API /api/ping] Health check request { 
  method: 'GET', 
  timestamp: '2026-01-21T01:52:00.000Z',
  origin: 'https://fixloapp.com' 
}
```

Logs are available in Vercel dashboard under Functions → Logs.

## Troubleshooting

### API returns HTML instead of JSON

**Cause**: SPA fallback is intercepting API routes.

**Solution**: Ensure API routes are defined BEFORE `/(.*` in `vercel.json` rewrites.

### 404 on API routes

**Cause**: Serverless function file missing or incorrect path.

**Solution**: 
1. Verify file exists in `/api` directory
2. Check filename matches route (e.g., `ping.js` for `/api/ping`)
3. Redeploy to Vercel

### Database connection errors

**Cause**: `MONGODB_URI` not configured in Vercel environment variables.

**Solution**: Both endpoints gracefully handle missing database:
- `/api/ping`: Always returns 200 (no DB required)
- `/api/social/force-status`: Returns 200 with default values and message

### CORS errors

**Cause**: Origin not in allowed list.

**Solution**: Add origin to `allowedOrigins` array in API function or use environment variable.

## Deployment

### Automatic Deployment

Every push to `main` branch triggers:
1. Client build (`npm run build`)
2. Deployment of static files to Vercel CDN
3. Deployment of `/api` functions to Vercel serverless platform

### Manual Deployment

```bash
# Deploy to Vercel
vercel --prod

# Or use GitHub Actions (if configured)
git push origin main
```

## Migration Notes

**Previous Setup:**
- All `/api/*` requests were proxied to external Render backend: `https://fixloapp.onrender.com`

**Current Setup:**
- API routes are handled by Vercel serverless functions
- No external proxy required
- Faster response times (same CDN as frontend)
- Simplified deployment (single platform)

## Future Enhancements

1. **Add more API endpoints** as serverless functions in `/api` directory
2. **Implement authentication** for protected routes
3. **Add API rate limiting** using Vercel Edge Config
4. **Set up monitoring** with Vercel Analytics
5. **Add integration tests** for API endpoints
