# Admin Access Control Implementation

## Overview

This document describes the implementation of comprehensive access control for the Admin Dashboard and Social Media Manager, ensuring these tools are only accessible to authorized admin users.

## Problem Statement

Previously, admin routes were publicly visible at `/admin` paths, which posed security and SEO concerns:
- Admin routes could appear in search results
- Admin UI was visible to non-admin users
- Social Media Manager was treated as a public feature
- No clear separation between public marketplace and internal tools

## Solution

### 1. Route Restructuring

**Old Routes (Public):**
- `/admin` - Admin Dashboard
- `/admin/jobs` - Job Control Center
- `/admin/social-media` - Social Media Manager

**New Routes (Private):**
- `/dashboard/admin` - Admin Dashboard
- `/dashboard/admin/jobs` - Job Control Center
- `/dashboard/admin/social` - Social Media Manager

### 2. Frontend Security

#### RequireAdmin Component
Created `client/src/components/RequireAdmin.jsx`:
```jsx
// Protects admin routes with:
// 1. Authentication check (redirects to /pro-sign-in if not logged in)
// 2. Admin role check (redirects to / if not admin)
// 3. No hints that admin exists for non-admin users
```

#### Route Protection
Updated `client/src/App.jsx`:
```jsx
// Protected admin routes
<Route path="/dashboard/admin" element={
  <RequireAdmin>
    <AdminPage/>
  </RequireAdmin>
}/>

// Old routes redirect to prevent 404 hints
<Route path="/admin/*" element={<Navigate to="/" replace/>}/>
<Route path="/services/admin" element={<Navigate to="/" replace/>}/>
```

#### Navbar Updates
Updated `client/src/components/Navbar.jsx`:
- Admin link only visible to authenticated admin users
- Uses new route: `/dashboard/admin`
- Not visible in public navigation

### 3. Backend Security

#### Admin Routes Protection
All admin routes already protected with:
```javascript
// server/routes/admin.js & adminJobs.js
router.use(requireAuth);
router.use((req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
});
```

#### Social Manager Routes Protection
Updated `server/modules/social-manager/routes/index.js`:
```javascript
// OAuth callback remains public (required by OAuth providers)
router.get('/oauth/meta/callback', ...);

// All other routes require admin authentication
router.use(requireAuth);
router.use((req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      error: 'Forbidden - Admin access required' 
    });
  }
  next();
});
```

#### OAuth Callback Updates
Updated redirect URLs in `server/modules/social-manager/routes/index.js`:
- Success: `${clientUrl}/dashboard/admin/social?connected=true`
- Error: `${clientUrl}/dashboard/admin/social?error={code}`

### 4. SEO Protection

#### robots.txt
Updated both `/robots.txt` and `/client/public/robots.txt`:
```
User-agent: *
Allow: /

# Block admin routes from indexing
Disallow: /admin
Disallow: /admin/
Disallow: /dashboard/admin
Disallow: /dashboard/admin/
```

#### Meta Tags
All admin pages have:
```jsx
<HelmetSEO 
  title="Admin Dashboard | Fixlo" 
  canonicalPathname="/dashboard/admin" 
  robots="noindex, nofollow" 
/>
```

#### Sitemap
Admin routes are NOT included in `sitemap.xml`

#### Services List
Admin is NOT in `client/src/data/services.json`

### 5. Access Behavior

#### Public Users (Not Logged In)
- Accessing `/dashboard/admin/*` → Redirected to `/pro-sign-in`
- Accessing `/admin/*` → Redirected to `/`
- Accessing `/services/admin` → Redirected to `/`
- No admin links visible in navbar
- No admin routes in sitemap
- No admin routes indexed by search engines

#### Authenticated Non-Admin Users
- Accessing `/dashboard/admin/*` → Redirected to `/`
- No admin links visible in navbar
- No hints that admin exists

#### Authenticated Admin Users
- Full access to `/dashboard/admin/*`
- Admin link visible in navbar
- Can access Social Media Manager at `/dashboard/admin/social`
- Can access Job Control Center at `/dashboard/admin/jobs`

### 6. API Security

#### Admin API Routes
- `GET /api/admin/*` - Returns 401 if not authenticated
- `GET /api/admin/*` - Returns 403 if not admin
- All routes protected with `requireAuth` + admin role check

#### Social Manager API Routes
- `GET /api/social/oauth/meta/callback` - Public (OAuth callback)
- All other `/api/social/*` routes - Returns 401 if not authenticated
- All other `/api/social/*` routes - Returns 403 if not admin
- Protected with `requireAuth` + admin role check

## Testing

### Manual Testing

1. **Test Admin Access (Not Authenticated):**
   ```bash
   curl http://localhost:3001/api/admin/test
   # Expected: {"error":"Missing token"} (401)
   ```

2. **Test Public Routes:**
   ```bash
   curl http://localhost:3000/
   # Expected: 200 OK
   
   curl http://localhost:3000/robots.txt
   # Expected: Contains "Disallow: /admin"
   ```

3. **Test Frontend Redirects:**
   - Visit `http://localhost:3000/admin` → Should redirect to `/`
   - Visit `http://localhost:3000/dashboard/admin` (not logged in) → Should redirect to `/pro-sign-in`
   - Visit `http://localhost:3000/dashboard/admin` (logged in as non-admin) → Should redirect to `/`
   - Visit `http://localhost:3000/dashboard/admin` (logged in as admin) → Should show admin dashboard

### Build Verification
```bash
npm run build
# Expected: Build completes successfully
# Verify: robots.txt contains admin blocks
# Verify: sitemap.xml does not contain admin routes
```

## Files Modified

### Frontend
- `client/src/components/RequireAdmin.jsx` (new)
- `client/src/components/Navbar.jsx`
- `client/src/App.jsx`
- `client/src/routes/AdminPage.jsx`
- `client/src/routes/AdminJobsPage.jsx`
- `client/src/routes/AdminSocialMediaPage.jsx`
- `client/public/robots.txt`

### Backend
- `server/index.js`
- `server/modules/social-manager/routes/index.js`

### Root
- `robots.txt`

## Security Checklist

- [x] Admin routes not publicly accessible
- [x] Admin routes not visible to non-admin users
- [x] Admin routes not indexed by search engines
- [x] Admin routes not in sitemap
- [x] Admin not treated as a service
- [x] Backend validates admin permissions
- [x] OAuth callbacks remain functional
- [x] No hints that admin exists for public users
- [x] Proper authentication required for all admin API routes
- [x] Proper error responses (401/403) for unauthorized access

## Future Improvements

1. Consider adding rate limiting specifically for admin routes
2. Add audit logging for admin access attempts
3. Consider adding IP allowlist for admin access in production
4. Add admin session timeout/refresh mechanism
5. Consider adding multi-factor authentication for admin users

## Deployment

When deploying this change:
1. Ensure environment variables are set (JWT_SECRET, etc.)
2. Update admin user records to have `role: 'admin'`
3. Test admin login flow in production
4. Verify OAuth callbacks work with new URLs
5. Submit updated sitemap to Google Search Console
6. Monitor server logs for any 401/403 errors

## Owner Access

As the owner (Walter), you can access the admin dashboard by:
1. Sign in as a Pro/Admin user at `/pro/sign-in`
2. Navigate to: `https://fixloapp.com/dashboard/admin`
3. The admin link will appear in the navbar once logged in as admin
