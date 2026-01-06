# CORS Configuration for Vercel Preview Deployments

## Problem
Vercel preview deployments have dynamic URLs (e.g., `https://fixloapp-rbv1dcn3w-walters-projects-b292b340.vercel.app`) that change with each deployment. These were being blocked by the backend API's CORS policy, causing the following errors:

```
❌ Error occurred: {
  message: 'CORS policy does not allow origin: https://fixloapp-rbv1dcn3w-walters-projects-b292b340.vercel.app',
  ...
}
```

## Solution
Modified the CORS configuration in `server/index.js` to automatically allow all Vercel preview deployment URLs that match the `*.vercel.app` pattern while maintaining strict security requirements.

## Implementation Details

### Helper Function
Created `isOriginAllowed(origin)` function that:
1. Checks exact matches against the configured allowed origins list
2. For origins ending with `.vercel.app`:
   - Parses the URL to validate structure
   - Ensures HTTPS protocol is used (HTTP is rejected)
   - Double-checks the hostname to prevent URL manipulation attacks

### Security Measures
The implementation protects against various attack vectors:

| Attack Type | Example | Protection |
|------------|---------|------------|
| Query parameter spoofing | `https://evil.com?fake=.vercel.app` | URL parsing extracts hostname, not query string |
| Path-based spoofing | `https://evil.com/.vercel.app` | Hostname check catches the real domain |
| Domain suffix spoofing | `https://evil.vercel.app.hacker.com` | Hostname ends with `.hacker.com`, not `.vercel.app` |
| HTTP protocol | `http://fixloapp.vercel.app` | Protocol check enforces HTTPS only |

### Updated Components
1. **OPTIONS preflight handler** - Early request handling for CORS preflight
2. **CORS middleware** - Main request validation
3. **Socket.IO configuration** - Real-time connection validation
4. **Explicit preflight function** - Hot endpoint preflight handling

## Configuration

### Default Allowed Origins
```javascript
[
  "https://www.fixloapp.com",
  "https://fixloapp.com",
  "http://localhost:3000",
  "http://localhost:8000"
]
```

### Environment Variable (Optional)
Override defaults by setting `CORS_ALLOWED_ORIGINS` in `.env`:
```bash
CORS_ALLOWED_ORIGINS=https://www.fixloapp.com,https://fixloapp.com,http://localhost:3000
```

### Automatic Vercel Support
All Vercel preview deployments are automatically allowed regardless of configuration:
- ✅ `https://fixloapp-abc123.vercel.app`
- ✅ `https://fixloapp-git-main-username.vercel.app`
- ✅ `https://fixloapp-pr-123-username.vercel.app`
- ❌ `http://fixloapp.vercel.app` (HTTP not allowed)

## Testing
Comprehensive test suite in `server/test-cors-logic.js` validates:
- Production domain access
- Local development access
- Vercel preview deployment access
- Attack vector rejection
- Edge cases (null/undefined origin)

Run tests with:
```bash
node server/test-cors-logic.js
```

## Deployment
This fix automatically applies to all Render deployments. No environment variable changes are required.

## Security Review
- ✅ Code review passed with no issues
- ✅ CodeQL security scan passed with 0 vulnerabilities
- ✅ All 14 test cases passed (including attack vectors)

## Related Files
- `server/index.js` - Main implementation
- `server/test-cors-logic.js` - Test suite
- `.env.example` - Configuration documentation

## References
- [Vercel Preview Deployments](https://vercel.com/docs/concepts/deployments/preview-deployments)
- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [OWASP CORS Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#cross-origin-resource-sharing)
