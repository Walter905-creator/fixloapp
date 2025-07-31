# Vercel Analytics Setup and Troubleshooting

## Overview
Fixlo uses Vercel Analytics to track page views, visitors, and user interactions. This document covers setup, configuration, and common troubleshooting steps.

## Setup Status
- ✅ `@vercel/analytics` package installed
- ✅ Analytics component properly imported and configured
- ✅ Environment-specific configuration added
- ✅ Error handling and debugging implemented

## Analytics Configuration

### Environment Variables
```bash
# Enable analytics in development (optional, for testing)
REACT_APP_ENABLE_ANALYTICS=false
```

### Analytics Behavior
- **Production**: Analytics automatically enabled on Vercel deployments
- **Development**: Analytics disabled by default (set `REACT_APP_ENABLE_ANALYTICS=true` to enable)
- **Custom Domains**: Works on `fixloapp.vercel.app` and configured custom domains

## Common Issues and Solutions

### 1. "No data found for selected period"
**Symptoms**: Vercel Analytics dashboard shows no data
**Causes**:
- Content blockers/ad blockers blocking analytics scripts
- Analytics not enabled for the domain
- Recent deployment (data takes time to appear)

**Solutions**:
1. **Disable content blockers**: Turn off ad blockers, privacy extensions, or content blockers
2. **Visit the live site**: Analytics only work on deployed domains, not localhost
3. **Wait for data**: Initial data collection may take 5-30 minutes
4. **Check domain configuration**: Ensure analytics are enabled for your domain in Vercel dashboard

### 2. Script Loading Errors
**Symptoms**: Console errors about `va.vercel-scripts.com` being blocked
**Cause**: Content blockers preventing analytics script from loading

**Solution**:
```bash
# Common console error:
Failed to load resource: net::ERR_BLOCKED_BY_CLIENT
https://va.vercel-scripts.com/v1/script.debug.js

# To fix:
1. Disable ad blockers/content blockers
2. Add vercel-scripts.com to allowlist
3. Test on different browser/incognito mode
```

### 3. Development Mode Testing
**Issue**: Analytics don't work in development
**Solution**:
```bash
# Enable analytics in development (optional)
echo "REACT_APP_ENABLE_ANALYTICS=true" >> .env

# Then restart development server
npm start
```

### 4. Domain Configuration
**Issue**: Analytics not working on custom domain
**Steps to verify**:
1. Check Vercel project settings
2. Ensure analytics are enabled for your domain
3. Verify domain is properly connected to Vercel project

## Testing Analytics

### Manual Testing
1. **Deploy to production**: `npm run build` and deploy to Vercel
2. **Visit the live site**: Navigate to your deployed URL
3. **Disable content blockers**: Turn off any ad/content blocking extensions
4. **Navigate between pages**: Click on different services, buttons, etc.
5. **Wait for data**: Check Vercel Analytics dashboard after 5-30 minutes

### Debug Mode
In development with `REACT_APP_ENABLE_ANALYTICS=true`, check browser console for debug messages:
```
[Fixlo Analytics] Development mode - Analytics may not collect data
[Fixlo Analytics] For full analytics testing, deploy to production
```

## Deployment Checklist
- [ ] Build successfully completes
- [ ] Analytics component included in build
- [ ] No console errors related to analytics (except content blocker warnings)
- [ ] Deployed to Vercel domain
- [ ] Analytics enabled in Vercel project settings
- [ ] Domain properly configured

## Support
If analytics still don't work after following this guide:
1. Check browser console for errors
2. Verify in incognito mode without extensions
3. Test on mobile device
4. Contact Vercel support for domain-specific issues

## Implementation Details
The analytics implementation uses:
- `@vercel/analytics/react` for React apps
- Environment-specific configuration
- Error handling for blocked scripts
- Debug mode for development testing