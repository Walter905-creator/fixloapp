# Fixlo API - Vercel Serverless Functions

This directory contains Vercel serverless functions that handle backend API routes for the Fixlo platform.

## Architecture

Vercel automatically exposes any JavaScript file in this directory as a serverless API endpoint:

- `api/ping.js` → `GET /api/ping`
- `api/social/force-status.js` → `GET /api/social/force-status`

## Available Endpoints

### GET /api/ping

**Purpose**: Health check endpoint to verify API routing is working.

**Database Required**: No

**Request**:
```bash
curl https://fixloapp.com/api/ping
```

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-21T01:52:00.000Z",
  "message": "Fixlo API is operational",
  "environment": "production",
  "region": "iad1"
}
```

**Status Codes**:
- `200 OK` - Endpoint is working
- `405 Method Not Allowed` - Only GET requests allowed

---

### GET /api/social/force-status

**Purpose**: Check social media account connection status (Facebook, Instagram).

**Database Required**: Optional (returns default values if unavailable)

**Request**:
```bash
# Production (ownerId = 'admin' always)
curl https://fixloapp.com/api/social/force-status

# Preview/Development (can override ownerId)
curl https://preview.vercel.app/api/social/force-status?ownerId=admin
```

**Response** (with database):
```json
{
  "success": true,
  "facebookConnected": true,
  "instagramConnected": true,
  "pageId": "123456789",
  "pageName": "Fixlo Official",
  "instagramBusinessId": "987654321",
  "instagramUsername": "fixloapp",
  "connectedAt": "2026-01-15T10:30:00.000Z",
  "isTokenValid": true,
  "tokenExpiresAt": "2026-03-15T10:30:00.000Z",
  "requestId": "abc123xyz"
}
```

**Response** (without database):
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
  "message": "Database connection unavailable - configure MONGODB_URI environment variable",
  "requestId": "def456uvw"
}
```

**Status Codes**:
- `200 OK` - Status retrieved successfully (or default values returned)
- `400 Bad Request` - Invalid ownerId format
- `405 Method Not Allowed` - Only GET requests allowed
- `500 Internal Server Error` - Unexpected error

**Query Parameters**:
- `ownerId` (optional, non-production only): Override the owner ID to check. Must be alphanumeric, underscore, or hyphen only. Default: `admin`.

---

## Local Development

### Install Dependencies

```bash
cd api
npm install
```

### Test Locally (without Vercel)

You can test the functions by requiring them directly:

```javascript
const ping = require('./ping');

// Mock req and res objects
const req = { method: 'GET', headers: {} };
const res = {
  statusCode: 200,
  headers: {},
  body: '',
  setHeader(key, value) { this.headers[key] = value; },
  status(code) { this.statusCode = code; return this; },
  json(data) { this.body = JSON.stringify(data); return this; },
  end() { console.log(this); }
};

await ping(req, res);
```

### Test with Vercel Dev

```bash
# From project root
npx vercel dev

# Test endpoints
curl http://localhost:3000/api/ping
curl http://localhost:3000/api/social/force-status
```

### Run Integration Tests

```bash
# From project root
npm run test:api:local
```

## Deployment

### Automatic Deployment

When you push to the `main` branch:
1. Vercel builds the frontend (`npm run build`)
2. Vercel deploys static files to CDN
3. Vercel deploys `/api` functions as serverless functions

### Manual Deployment

```bash
# Deploy to Vercel
vercel --prod
```

## Environment Variables

Configure these in the Vercel dashboard (Settings → Environment Variables):

### Required

None - both endpoints work without environment variables.

### Optional

- `MONGODB_URI` - MongoDB connection string for `/api/social/force-status`
  - If not set, endpoint returns default empty status
  - Format: `mongodb+srv://username:password@cluster.mongodb.net/database`

### Automatic (Set by Vercel)

- `VERCEL_ENV` - Environment (`production`, `preview`, `development`)
- `VERCEL_REGION` - Region code (e.g., `iad1`, `sfo1`)

## Security Features

### CORS

Allowed origins:
- `https://www.fixloapp.com`
- `https://fixloapp.com`
- `http://localhost:3000`
- `*.vercel.app` (preview deployments)

### Headers

All responses include:
- `Content-Type: application/json`
- `X-Content-Type-Options: nosniff`
- `X-Request-ID: <unique-id>` (force-status only)
- `Access-Control-Allow-Origin: <origin>` (if allowed)

### Input Validation

- Method validation (only GET allowed)
- Query parameter validation (alphanumeric check)
- Error handling with appropriate HTTP status codes

## Logging

### What Gets Logged

✅ **Logged (safe)**:
- Request method
- Timestamp
- Origin (for CORS debugging)
- Query parameters
- Request ID
- Success/failure status

❌ **NOT logged (sensitive)**:
- Authentication tokens
- User passwords
- API keys
- Personal information

### View Logs

1. Go to Vercel Dashboard
2. Select project → Functions
3. Click on function name → Logs

### Example Log Output

```
[API /api/ping] Health check request { 
  method: 'GET', 
  timestamp: '2026-01-21T01:52:00.000Z',
  origin: 'https://fixloapp.com' 
}
```

```
[API /api/social/force-status] Request received { 
  requestId: 'abc123xyz',
  method: 'GET', 
  timestamp: '2026-01-21T01:52:00.000Z',
  origin: 'https://fixloapp.com',
  query: {} 
}
```

## Error Handling

All functions implement consistent error handling:

1. **Method validation** - Returns 405 if not GET
2. **Input validation** - Returns 400 for invalid parameters
3. **Try-catch blocks** - Catches unexpected errors
4. **Graceful degradation** - Works without database when possible
5. **Detailed error logs** - Logs errors for debugging (non-sensitive)

## Performance

### Cold Starts

Serverless functions may experience cold starts:
- First request: ~1-3 seconds
- Subsequent requests: ~50-200ms

### Optimization Tips

1. **Keep dependencies minimal** - Faster cold starts
2. **Cache database connections** - Reuse across invocations
3. **Use connection pooling** - For database queries
4. **Set appropriate timeouts** - Avoid hanging requests

### Timeout

Default timeout: 10 seconds (Vercel Hobby plan)

## Monitoring

### Metrics Available

- Request count
- Error rate
- Average duration
- Cold start frequency
- Data transfer

### Set Up Alerts

1. Go to Vercel Dashboard → Integrations
2. Add monitoring integration (e.g., Sentry, LogRocket)
3. Configure alerts for errors

## Troubleshooting

### API returns HTML instead of JSON

**Cause**: SPA fallback is intercepting API routes.

**Solution**: Ensure API routes are defined BEFORE `/(.*) → /index.html` in `vercel.json`.

### 404 on API routes

**Cause**: Function file missing or Vercel not detecting it.

**Solution**:
1. Verify file exists at `api/[function-name].js`
2. Check filename is lowercase
3. Redeploy to Vercel

### Database connection timeout

**Cause**: `MONGODB_URI` invalid or database unreachable.

**Solution**:
1. Verify `MONGODB_URI` in Vercel environment variables
2. Check database whitelist includes Vercel IPs (or use `0.0.0.0/0`)
3. Test connection with MongoDB Compass

### CORS errors in browser

**Cause**: Origin not in allowed list.

**Solution**: Add origin to `allowedOrigins` array in function code.

## Testing

### Manual Testing

```bash
# Health check
curl -i https://fixloapp.com/api/ping

# Social status
curl -i https://fixloapp.com/api/social/force-status

# Check response headers
curl -I https://fixloapp.com/api/ping
```

### Automated Testing

```bash
# Run integration tests
npm run test:api:production

# Or with custom URL
node test-api-endpoints.js https://your-preview.vercel.app
```

## Adding New Endpoints

1. **Create function file**:
   ```javascript
   // api/new-endpoint.js
   module.exports = async (req, res) => {
     res.status(200).json({ success: true });
   };
   ```

2. **Add route to vercel.json** (if needed):
   ```json
   {
     "source": "/api/new-endpoint",
     "destination": "/api/new-endpoint"
   }
   ```

3. **Add tests**:
   - Update `test-api-endpoints.js`
   - Test locally with `npx vercel dev`

4. **Deploy**:
   ```bash
   git add api/new-endpoint.js
   git commit -m "Add new API endpoint"
   git push origin main
   ```

## Best Practices

1. ✅ **Always validate input** - Check method, parameters, headers
2. ✅ **Handle errors gracefully** - Don't expose internal errors
3. ✅ **Log safely** - Never log sensitive data
4. ✅ **Set security headers** - Content-Type, CORS, etc.
5. ✅ **Use environment variables** - For secrets and config
6. ✅ **Cache connections** - Reuse database connections
7. ✅ **Return consistent responses** - Same structure for success/error
8. ✅ **Document your endpoints** - Update this README

## Resources

- [Vercel Serverless Functions](https://vercel.com/docs/serverless-functions)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel Function Logs](https://vercel.com/docs/observability/runtime-logs)
- [Project Documentation](../docs/VERCEL_API_ROUTING.md)
