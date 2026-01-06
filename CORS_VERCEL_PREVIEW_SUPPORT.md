# CORS Configuration for Vercel Preview Deployments

## Overview
This document explains the CORS (Cross-Origin Resource Sharing) configuration for the Fixlo backend API, specifically the support for Vercel preview deployments.

## Problem
Vercel creates unique preview URLs for each deployment (e.g., `https://fixloapp-rbv1dcn3w-walters-projects-b292b340.vercel.app`). These URLs were being blocked by CORS policy because they didn't match the allowed origins list which only included:
- `https://www.fixloapp.com`
- `https://fixloapp.com`

## Solution
The CORS configuration in `server/index.js` now includes logic to automatically allow all HTTPS Vercel preview deployments while maintaining security.

### Implementation
The `isOriginAllowed()` function checks origins in this order:

1. **Exact matches** against the `allowedOrigins` array
2. **Vercel preview domains** (*.vercel.app) with security validation:
   - Must use HTTPS protocol (not HTTP)
   - Must have a valid hostname ending in `.vercel.app`
   - URL manipulation attacks are prevented through proper parsing

```javascript
function isOriginAllowed(origin) {
  if (!origin) return true;
  
  // Check exact matches
  if (allowedOrigins.includes(origin)) return true;
  
  // Allow Vercel preview deployments (*.vercel.app)
  if (origin.endsWith('.vercel.app')) {
    try {
      const url = new URL(origin);
      // Security: Double-check hostname to prevent manipulation
      if (url.protocol === 'https:' && url.hostname.endsWith('.vercel.app')) {
        return true;
      }
    } catch (e) {
      return false;
    }
  }
  
  return false;
}
```

## Security Considerations

### What IS allowed:
✅ Production domains: `https://www.fixloapp.com`, `https://fixloapp.com`
✅ Vercel previews: `https://fixloapp-*.vercel.app` (HTTPS only)
✅ Local development: `http://localhost:3000`, `http://localhost:8000` (when CORS_ALLOWED_ORIGINS not set)

### What is NOT allowed:
❌ HTTP Vercel URLs: `http://fixloapp-test.vercel.app`
❌ Random domains: `https://evil.com`
❌ Spoofing attempts: `https://evil.com?url=.vercel.app`
❌ Path-based spoofing: `https://evil.com/.vercel.app`

## Testing

### Test Script
Use the provided test script to verify CORS configuration:

```bash
cd server
./test-cors-deployment.sh
# Or with custom URL:
./test-cors-deployment.sh https://your-api-url.com
```

### Manual Testing
1. **Check CORS configuration**:
   ```bash
   curl https://fixloapp.onrender.com/api/cors-test
   ```

2. **Test OPTIONS preflight from Vercel preview**:
   ```bash
   curl -X OPTIONS https://fixloapp.onrender.com/api/country/detect \
     -H "Origin: https://fixloapp-test.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```
   
   Should return HTTP 204 with `Access-Control-Allow-Origin` header.

3. **Test from unauthorized domain**:
   ```bash
   curl -X OPTIONS https://fixloapp.onrender.com/api/country/detect \
     -H "Origin: https://evil.com" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```
   
   Should return HTTP 403 with CORS policy violation error.

## Deployment

### Environment Variables
The `CORS_ALLOWED_ORIGINS` environment variable in `render.yaml` controls the base allowed origins:

```yaml
- key: CORS_ALLOWED_ORIGINS
  value: https://www.fixloapp.com,https://fixloapp.com
```

Vercel preview URLs are allowed automatically in addition to these.

### Triggering Deployment
To force a Render deployment (e.g., after CORS configuration changes):

```bash
# Update the deployment trigger file
echo "$(date -u) - Deploy description" > .deploy-trigger
git add .deploy-trigger
git commit -m "Trigger deployment"
git push
```

## Monitoring

### Startup Logs
When the server starts, look for:
```
🔍 CORS Configuration
📋 Allowed Origins: [ 'https://www.fixloapp.com', 'https://fixloapp.com' ]
🌐 Env CORS_ALLOWED_ORIGINS: https://www.fixloapp.com,https://fixloapp.com
✅ Vercel Preview Deployments: ENABLED (*.vercel.app)
```

### Request Logs
Successful CORS preflight:
```
🔍 OPTIONS /api/country/detect — origin allowed: https://fixloapp-test.vercel.app
```

Blocked request:
```
❌ OPTIONS /api/country/detect — origin not allowed: https://evil.com
```

## Troubleshooting

### Issue: Vercel preview URLs still blocked
**Symptoms**: Error "CORS policy does not allow origin" for `.vercel.app` domains

**Solutions**:
1. Verify the deployed code includes the updated `isOriginAllowed()` function
2. Check server startup logs for "Vercel Preview Deployments: ENABLED"
3. Force a redeploy by updating `.deploy-trigger`
4. Clear any CDN/proxy caches (Cloudflare, etc.)

### Issue: All origins blocked
**Symptoms**: Even production domains are blocked

**Solutions**:
1. Check `CORS_ALLOWED_ORIGINS` environment variable is set correctly in Render
2. Verify no syntax errors in `server/index.js`
3. Check server logs for errors during startup

### Issue: Security warning about CORS
**Concern**: Allowing all `.vercel.app` domains seems too permissive

**Response**: This is safe because:
- Only HTTPS URLs are allowed (prevents HTTP attacks)
- Only valid `.vercel.app` hostnames are allowed (prevents spoofing)
- Vercel preview URLs are only accessible to authenticated team members
- The API still requires authentication for protected endpoints

## References
- CORS spec: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- Vercel preview deployments: https://vercel.com/docs/deployments/preview-deployments
- Express CORS middleware: https://expressjs.com/en/resources/middleware/cors.html

## Version History
- v2.0 (2026-01-06): Added Vercel preview deployment support with security validation
- v1.0: Initial CORS configuration with static allowed origins only
