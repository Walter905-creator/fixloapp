# Vercel API Routing Fix - Deployment Checklist

This checklist will help you deploy and verify the API routing fixes.

## Pre-Deployment Checklist

- [x] Code changes committed
- [x] Integration tests created
- [x] Documentation updated
- [x] Security review passed
- [x] Code review feedback addressed

## Deployment Steps

### 1. Merge Pull Request

```bash
# After PR is approved, merge to main branch
# This will trigger automatic deployment to Vercel
```

### 2. Configure Environment Variables (If Not Already Set)

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Optional** (for /api/social/force-status to work with database):
- **Name**: `MONGODB_URI`
- **Value**: Your MongoDB connection string (e.g., `mongodb+srv://...`)
- **Environments**: Production, Preview, Development

**Note**: Both endpoints work without this variable (with graceful degradation).

### 3. Monitor Deployment

1. Go to Vercel Dashboard → Deployments
2. Wait for deployment to complete (usually 2-5 minutes)
3. Check deployment logs for any errors

### 4. Verify API Endpoints

Once deployment is complete, test the endpoints:

#### Test /api/ping

```bash
# Using curl
curl -i https://fixloapp.com/api/ping

# Expected response:
# HTTP/2 200
# content-type: application/json
# 
# {"status":"ok","timestamp":"...","message":"Fixlo API is operational","environment":"production","region":"..."}
```

#### Test /api/social/force-status

```bash
# Using curl
curl -i https://fixloapp.com/api/social/force-status

# Expected response:
# HTTP/2 200
# content-type: application/json
# x-request-id: ...
# 
# {"success":true,"facebookConnected":...,"instagramConnected":...,...}
```

#### Run Automated Tests

```bash
# From your local machine (in project root)
npm run test:api:production
```

Expected output:
```
╔═══════════════════════════════════════════════════════╗
║   Fixlo API Endpoint Integration Tests               ║
╚═══════════════════════════════════════════════════════╝

Test Suite: /api/ping
  ✓ Returns 200 status code
  ✓ Returns JSON content type
  ✓ Response is valid JSON
  ✓ Response contains status: "ok"
  ✓ Response contains timestamp field
  ✓ Response contains message field
  ✓ Response is not HTML (confirming JSON)

Test Suite: /api/social/force-status
  ✓ Returns 200 status code
  ✓ Returns JSON content type
  ✓ Response is valid JSON
  ✓ Response contains success field
  ✓ Response contains facebookConnected field
  ✓ Response contains instagramConnected field
  ✓ Response contains requestId field
  ✓ Response is not HTML (confirming JSON)
  ✓ Response includes X-Request-ID header

═══════════════════════════════════════════════════════

✓ All tests passed! (16/16)
```

### 5. Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project → Functions
2. Click on `/api/ping` → View Logs
3. Click on `/api/social/force-status` → View Logs
4. Verify requests are being logged correctly

Expected log entries:
```
[API /ping] Health check request { method: 'GET', timestamp: '...', origin: '...' }
[API /api/social/force-status] Request received { requestId: '...', method: 'GET', ... }
```

## Post-Deployment Verification

### Test from Different Origins

1. **Production domain**:
   ```bash
   curl https://fixloapp.com/api/ping
   ```

2. **WWW subdomain**:
   ```bash
   curl https://www.fixloapp.com/api/ping
   ```

3. **Browser DevTools**:
   - Open https://fixloapp.com
   - Open DevTools (F12) → Console
   - Run:
     ```javascript
     fetch('/api/ping').then(r => r.json()).then(console.log)
     ```
   - Should see JSON response (not HTML)

### Verify CORS

Test from browser on allowed origin:
```javascript
// In browser console on fixloapp.com
fetch('/api/ping', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('Status:', response.status);
  console.log('Headers:', response.headers);
  return response.json();
})
.then(data => console.log('Data:', data))
.catch(error => console.error('Error:', error));
```

Should succeed with no CORS errors.

## Troubleshooting

### Issue: API returns HTML instead of JSON

**Check**:
1. Verify deployment completed successfully
2. Check Vercel function logs for errors
3. Verify `api/ping.js` and `api/social/force-status.js` exist in deployment

**Fix**:
- Force redeployment: `vercel --prod --force`

### Issue: 404 on API routes

**Check**:
1. Verify files exist in `/api` directory on GitHub
2. Check Vercel build logs

**Fix**:
- Verify files were committed: `git ls-files api/`
- Redeploy if needed

### Issue: Database connection timeout

**Check**:
1. Verify `MONGODB_URI` is set in Vercel environment variables
2. Check MongoDB Atlas network access allows Vercel IPs (use `0.0.0.0/0` or add Vercel IP range)

**Note**: `/api/ping` doesn't need database, so it should always work.

### Issue: CORS errors

**Check**:
1. Origin is in allowed list: `fixloapp.com`, `www.fixloapp.com`, `localhost:3000`, `*.vercel.app`
2. Request includes proper headers

**Fix**:
- Add origin to `allowedOrigins` array in function code
- Redeploy

## Success Criteria

All of these should be true:

- ✅ Deployment completed without errors
- ✅ `/api/ping` returns JSON (200 OK)
- ✅ `/api/social/force-status` returns JSON (200 OK)
- ✅ Both endpoints return `content-type: application/json`
- ✅ Neither endpoint returns HTML
- ✅ Integration tests pass
- ✅ Function logs show requests
- ✅ No CORS errors in browser
- ✅ Response times < 1 second (after cold start)

## Rollback Plan

If issues occur and need to rollback:

1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → Promote to Production

Or revert the PR:
```bash
git revert <commit-hash>
git push origin main
```

## Monitoring

### Set Up Alerts (Optional)

1. Go to Vercel Dashboard → Integrations
2. Add monitoring service (e.g., Sentry)
3. Configure alerts for:
   - 5xx errors
   - High response times
   - Function failures

### Check Metrics

1. Go to Vercel Dashboard → Analytics
2. Review:
   - Function invocations
   - Error rate
   - Response times
   - Data transfer

## Next Steps After Deployment

1. **Monitor for 24 hours** - Watch for any errors or issues
2. **Update documentation** - Note any production-specific behavior
3. **Migrate more routes** (optional) - Move other API routes to serverless functions
4. **Set up monitoring** - Configure alerts for production issues

## Support

If you encounter any issues:

1. Check Vercel function logs
2. Review `docs/VERCEL_API_ROUTING.md`
3. Review `api/README.md`
4. Check GitHub issues in the repo

## Documentation References

- **API Documentation**: `/api/README.md`
- **Routing Configuration**: `/docs/VERCEL_API_ROUTING.md`
- **Implementation Summary**: `/docs/IMPLEMENTATION_SUMMARY.md`
- **Integration Tests**: `/test-api-endpoints.js`

---

**Deployment Date**: _______________

**Deployed By**: _______________

**Deployment Status**: 
- [ ] Successful
- [ ] Failed (see notes)

**Notes**:
_______________________________________
_______________________________________
_______________________________________
