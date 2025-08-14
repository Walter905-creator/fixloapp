# Production Indexing Verification Checklist

## ✅ Do Not Merge Until All Pass

Copy this checklist to your PR and verify each item before merging:

```
Production Indexing Verification — Do Not Merge Until All Pass

☐ robots.txt present, allows public routes, and lists sitemap (200 OK).
☐ sitemap.xml valid & only canonical, 200 URLs (no redirects/noindex/params).
☐ All core routes return an absolute self-canonical and no noindex.
☐ Host canonicalization: non-www → www (or vice-versa) via 301; Sitemap/Canonical match host.
☐ Parameter handling: utm*, fbclid, etc. 301 to clean; canonicals = clean; not in sitemap.
☐ Sample routes return route-specific head/meta in server HTML (or prerendered), not just a JS loader.
☐ Re-submit affected patterns in GSC; monitor "Duplicate without user-selected canonical" and "Discovered/Crawled – not indexed".
```

## 🔧 Quick Validation Commands

Run these commands to verify production status:

```bash
# Run comprehensive indexing verification
npm run verify-production-indexing

# Quick command-line checks
./scripts/quick-production-indexing-check.sh

# Manual spot checks
curl -sI https://www.fixloapp.com | sed -n '1,20p'
curl -s https://www.fixloapp.com | grep -i -E 'canonical|robots'
curl -s https://www.fixloapp.com/services/plumbing | head -n 60
```

## 🎯 Priority Issues to Address

Based on verification results, here are the critical issues that need fixing:

### 1. **CRITICAL**: Canonical URL Implementation
- **Problem**: All SPA routes return homepage canonical (`https://www.fixloapp.com/`) instead of route-specific canonicals
- **Impact**: Google sees all pages as duplicates of homepage
- **Solution**: Update React routing to dynamically set canonical URLs per route

### 2. **CRITICAL**: Server-Side Rendering for Key Routes  
- **Problem**: Routes like `/services/plumbing` and `/pro/*` return generic SPA shell
- **Impact**: Poor indexability, "Crawled - currently not indexed" status
- **Solution**: Implement SSR/prerendering or static HTML for key routes

### 3. **WARNING**: Static Page Configuration
- **Problem**: Static HTML pages have incorrect canonicals and generic titles
- **Impact**: Reduced SEO effectiveness for service pages
- **Solution**: Fix static HTML pages to have route-specific meta tags

## 📋 Implementation Guide

### Fix Canonical URLs

1. **React App Router Updates**:
   ```jsx
   // In your SEOHead component or routing logic
   const getCurrentCanonical = (pathname) => {
     const cleanPath = pathname.endsWith('/') && pathname !== '/' 
       ? pathname.slice(0, -1) 
       : pathname;
     return `https://www.fixloapp.com${cleanPath}`;
   };
   ```

2. **Vercel Rewrites Enhancement**:
   ```json
   // Consider adding route-specific prerendering
   {
     "source": "/services/:service",
     "destination": "/services/[service].html"
   }
   ```

### Add Route-Specific SSR

1. **Static Generation for Services**:
   ```bash
   # Generate static HTML for key routes
   npm run build-static-routes
   ```

2. **Middleware Enhancement**:
   ```javascript
   // Extend middleware.js to handle more bot traffic
   // with route-specific meta injection
   ```

### Parameter Handling

1. **Clean URL Redirects**:
   ```javascript
   // Add client-side parameter cleanup
   if (window.location.search.includes('utm_')) {
     window.history.replaceState({}, '', window.location.pathname);
   }
   ```

## 🌐 Testing Checklist

After implementation, verify:

- [ ] Each route returns its own canonical URL
- [ ] No routes have unintentional noindex tags  
- [ ] Parameter URLs redirect or canonicalize to clean versions
- [ ] Static HTML pages have route-specific meta tags
- [ ] Sitemap only contains canonical URLs (no parameters)
- [ ] All URLs in sitemap return 200 status codes

## 📊 Google Search Console Actions

After fixing issues:

1. **Re-submit Sitemap**: Submit updated sitemap.xml to GSC
2. **Request Indexing**: Use URL inspection tool for key pages  
3. **Monitor Coverage**: Watch for improvements in:
   - "Duplicate without user-selected canonical" (should decrease)
   - "Discovered – currently not indexed" (should decrease)
   - "Valid" pages (should increase)

## 🔍 Ongoing Monitoring

Set up alerts for:
- New "Duplicate without canonical" issues
- Crawl errors on important pages  
- Changes in indexed page counts
- Core Web Vitals for key routes

---

**Note**: This checklist addresses the specific GSC issues mentioned in the requirements:
- A) Duplicate without user-selected canonical (408)
- B) Alternate page with proper canonical tag (39)  
- C) Excluded by 'noindex' tag (14)
- D) Page with redirect (3)
- E) Discovered – currently not indexed (6)
- F) Crawled – currently not indexed