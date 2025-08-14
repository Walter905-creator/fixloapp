#!/usr/bin/env node

/**
 * Production Indexing Verification Script (Lightweight)
 * 
 * This script implements the comprehensive production indexing checklist
 * using curl and Node.js built-in modules for maximum compatibility.
 * 
 * Validates:
 * - Canonical URL implementation
 * - Robots.txt and sitemap.xml
 * - Host canonicalization (www vs non-www)
 * - Parameter handling and redirects
 * - Meta tags (no unintentional noindex)
 * - Server-side rendering for key routes
 */

const https = require('https');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { URL } = require('url');

const PRODUCTION_URL = 'https://www.fixloapp.com';
const NON_WWW_URL = 'https://fixloapp.com';

class ProductionIndexingVerifier {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      checks: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      },
      issues: [],
      recommendations: []
    };
  }

  async addCheck(name, passed, details, severity = 'normal') {
    const check = {
      name,
      passed,
      details,
      severity,
      timestamp: new Date().toISOString()
    };
    
    this.results.checks.push(check);
    this.results.summary.total++;
    
    if (passed) {
      this.results.summary.passed++;
      console.log(`✅ ${name}: ${details}`);
    } else {
      this.results.summary.failed++;
      console.log(`❌ ${name}: ${details}`);
      
      if (severity === 'critical') {
        this.results.issues.push({
          type: 'CRITICAL',
          name,
          details,
          solution: this.getSolution(name)
        });
      } else if (severity === 'warning') {
        this.results.issues.push({
          type: 'WARNING', 
          name,
          details,
          solution: this.getSolution(name)
        });
      }
    }
  }

  getSolution(checkName) {
    const solutions = {
      'Canonical URL Implementation': 'Ensure each page has a self-referential canonical tag pointing to its own URL',
      'Host Canonicalization': 'Implement 301 redirects from non-www to www (or vice versa) consistently',
      'Parameter Handling': 'Add 301 redirects for UTM/tracking parameters to clean URLs',
      'Robots Meta Tags': 'Remove any unintentional noindex meta tags or X-Robots-Tag headers',
      'Server-Side Rendering': 'Implement SSR or prerendering for key routes to provide unique content',
      'Sitemap Validation': 'Ensure sitemap contains only canonical, 200-status URLs'
    };
    
    return solutions[checkName] || 'Review implementation and follow Google\'s indexing guidelines';
  }

  // Fetch URL with detailed response info
  async fetchUrl(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          ...options.headers
        }
      };

      const req = client.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            redirected: res.statusCode >= 300 && res.statusCode < 400,
            location: res.headers.location
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  // Check 1: Canonical URL Implementation
  async checkCanonicalImplementation() {
    console.log('\n🔗 Check 1: Canonical URL Implementation');
    
    const testRoutes = [
      '/',
      '/how-it-works',
      '/contact', 
      '/signup',
      '/pro/signup',
      '/services/',
      '/services/plumbing'
    ];

    let canonicalIssues = 0;
    
    for (const route of testRoutes) {
      try {
        const url = `${PRODUCTION_URL}${route}`;
        const response = await this.fetchUrl(url);
        
        if (response.statusCode !== 200) {
          await this.addCheck(
            `Route ${route} accessibility`,
            false,
            `Route returned ${response.statusCode}`,
            'warning'
          );
          continue;
        }

        // Extract canonical URL from HTML
        const canonicalMatch = response.data.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
        const canonicalUrl = canonicalMatch ? canonicalMatch[1] : null;
        
        // Determine expected canonical
        const expectedCanonical = route === '/' ? 
          'https://www.fixloapp.com/' : 
          `https://www.fixloapp.com${route.endsWith('/') ? route.slice(0, -1) : route}`;
        
        if (!canonicalUrl) {
          await this.addCheck(
            `Canonical tag presence (${route})`,
            false,
            'No canonical tag found',
            'critical'
          );
          canonicalIssues++;
        } else if (canonicalUrl !== expectedCanonical && canonicalUrl !== `${expectedCanonical}/`) {
          await this.addCheck(
            `Canonical URL correctness (${route})`,
            false,
            `Expected: ${expectedCanonical}, Found: ${canonicalUrl}`,
            'critical'
          );
          canonicalIssues++;
        } else {
          await this.addCheck(
            `Canonical implementation (${route})`,
            true,
            `Correct canonical: ${canonicalUrl}`
          );
        }

        // Check for robots meta tag
        const robotsMatch = response.data.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i);
        const robotsMeta = robotsMatch ? robotsMatch[1] : null;
        
        if (robotsMeta && robotsMeta.includes('noindex')) {
          await this.addCheck(
            `Robots meta (${route})`,
            false,
            `Found noindex: ${robotsMeta}`,
            'critical'
          );
        } else {
          await this.addCheck(
            `Robots meta (${route})`,
            true,
            robotsMeta ? `Robots meta: ${robotsMeta}` : 'No robots meta (default: index, follow)'
          );
        }

        // Check for X-Robots-Tag header
        if (response.headers['x-robots-tag'] && response.headers['x-robots-tag'].includes('noindex')) {
          await this.addCheck(
            `X-Robots-Tag header (${route})`,
            false,
            `Found noindex header: ${response.headers['x-robots-tag']}`,
            'critical'
          );
        } else {
          await this.addCheck(
            `X-Robots-Tag header (${route})`,
            true,
            'No problematic X-Robots-Tag headers'
          );
        }

      } catch (error) {
        await this.addCheck(
          `Route testing (${route})`,
          false,
          `Error: ${error.message}`,
          'warning'
        );
      }
    }

    return canonicalIssues === 0;
  }

  // Check 2: Host Canonicalization (www vs non-www)
  async checkHostCanonicalization() {
    console.log('\n🌐 Check 2: Host Canonicalization');
    
    try {
      const response = await this.fetchUrl(NON_WWW_URL);
      
      // Check for redirect
      if (response.redirected && response.location && response.location.includes('www.fixloapp.com')) {
        await this.addCheck(
          'Non-www to www redirect',
          true,
          `${NON_WWW_URL} → ${response.location} (${response.statusCode})`
        );
      } else if (response.statusCode === 200) {
        // Check if content redirects to www via canonical
        const canonicalMatch = response.data.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
        const canonicalUrl = canonicalMatch ? canonicalMatch[1] : null;
        
        if (canonicalUrl && canonicalUrl.startsWith('https://www.fixloapp.com')) {
          await this.addCheck(
            'Host canonicalization via canonical tag',
            true,
            `Non-www serves www canonical: ${canonicalUrl}`
          );
        } else {
          await this.addCheck(
            'Host canonicalization',
            false,
            'Non-www domain should redirect or canonicalize to www',
            'critical'
          );
        }
      } else {
        await this.addCheck(
          'Non-www accessibility',
          false,
          `Non-www domain returned ${response.statusCode}`,
          'warning'
        );
      }

    } catch (error) {
      await this.addCheck(
        'Host canonicalization',
        false,
        `Error testing non-www domain: ${error.message}`,
        'warning'
      );
    }
  }

  // Check 3: Parameter Handling
  async checkParameterHandling() {
    console.log('\n🔗 Check 3: Parameter Handling');
    
    const parameterTests = [
      '/?utm_source=google&utm_medium=cpc',
      '/?ref=social&campaign=test',
      '/how-it-works?utm_campaign=brand',
      '/?fbclid=test123'
    ];

    for (const testUrl of parameterTests) {
      try {
        const response = await this.fetchUrl(`${PRODUCTION_URL}${testUrl}`);
        
        if (response.statusCode !== 200) {
          await this.addCheck(
            `Parameter test accessibility (${testUrl})`,
            false,
            `Returned ${response.statusCode}`,
            'warning'
          );
          continue;
        }

        // Check canonical URL
        const canonicalMatch = response.data.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
        const canonicalUrl = canonicalMatch ? canonicalMatch[1] : null;
        
        // Check if parameters are stripped from canonical
        if (canonicalUrl && !canonicalUrl.includes('?') && !canonicalUrl.includes('utm') && !canonicalUrl.includes('ref') && !canonicalUrl.includes('fbclid')) {
          await this.addCheck(
            `Parameter handling (${testUrl})`,
            true,
            `Clean canonical: ${canonicalUrl}`
          );
        } else {
          await this.addCheck(
            `Parameter handling (${testUrl})`,
            false,
            `Canonical contains parameters: ${canonicalUrl}`,
            'warning'
          );
        }

      } catch (error) {
        await this.addCheck(
          `Parameter test (${testUrl})`,
          false,
          `Error: ${error.message}`,
          'warning'
        );
      }
    }
  }

  // Check 4: Robots.txt Validation
  async checkRobotsValidation() {
    console.log('\n🤖 Check 4: Robots.txt Validation');
    
    try {
      const response = await this.fetchUrl(`${PRODUCTION_URL}/robots.txt`);
      
      if (response.statusCode !== 200) {
        await this.addCheck(
          'Robots.txt accessibility',
          false,
          `robots.txt returned ${response.statusCode}`,
          'critical'
        );
        return;
      }

      const robotsContent = response.data;
      
      // Check for sitemap reference
      if (robotsContent.includes('Sitemap:')) {
        await this.addCheck(
          'Robots.txt sitemap reference',
          true,
          'Contains sitemap reference'
        );
      } else {
        await this.addCheck(
          'Robots.txt sitemap reference',
          false,
          'Missing sitemap reference',
          'warning'
        );
      }

      // Check for proper domain
      if (robotsContent.includes('fixloapp.com')) {
        await this.addCheck(
          'Robots.txt domain reference',
          true,
          'Contains correct domain'
        );
      } else {
        await this.addCheck(
          'Robots.txt domain reference',
          false,
          'Missing or incorrect domain reference',
          'warning'
        );
      }

      // Check that public routes are allowed (not completely disallowed)
      if (!robotsContent.match(/^Disallow:\s*\/\s*$/m)) {
        await this.addCheck(
          'Robots.txt public access',
          true,
          'Public routes are allowed'
        );
      } else {
        await this.addCheck(
          'Robots.txt public access',
          false,
          'May be blocking all content',
          'critical'
        );
      }

    } catch (error) {
      await this.addCheck(
        'Robots.txt validation',
        false,
        `Error: ${error.message}`,
        'warning'
      );
    }
  }

  // Check 5: Sitemap Validation
  async checkSitemapValidation() {
    console.log('\n🗺️ Check 5: Sitemap Validation');
    
    try {
      const response = await this.fetchUrl(`${PRODUCTION_URL}/sitemap.xml`);
      
      if (response.statusCode !== 200) {
        await this.addCheck(
          'Sitemap accessibility',
          false,
          `sitemap.xml returned ${response.statusCode}`,
          'critical'
        );
        return;
      }

      const sitemapContent = response.data;
      
      // Check XML structure
      if (sitemapContent.includes('<urlset') && sitemapContent.includes('</urlset>')) {
        await this.addCheck(
          'Sitemap XML structure',
          true,
          'Valid XML structure'
        );
      } else {
        await this.addCheck(
          'Sitemap XML structure',
          false,
          'Invalid XML structure',
          'critical'
        );
        return;
      }

      // Count URLs
      const urlCount = (sitemapContent.match(/<url>/g) || []).length;
      await this.addCheck(
        'Sitemap URL count',
        urlCount > 0,
        `${urlCount} URLs found`
      );

      // Check for canonical URLs only (no parameters)
      const parameterUrls = sitemapContent.match(/<loc>[^<]*[?&](utm|ref|fbclid|campaign)[^<]*<\/loc>/g);
      if (!parameterUrls || parameterUrls.length === 0) {
        await this.addCheck(
          'Sitemap canonical URLs',
          true,
          'No parameter URLs found in sitemap'
        );
      } else {
        await this.addCheck(
          'Sitemap canonical URLs',
          false,
          `Found ${parameterUrls.length} URLs with parameters`,
          'warning'
        );
      }

      // Check for consistent host usage
      const nonWwwUrls = sitemapContent.match(/<loc>https:\/\/fixloapp\.com[^<]*<\/loc>/g);
      if (!nonWwwUrls || nonWwwUrls.length === 0) {
        await this.addCheck(
          'Sitemap host consistency',
          true,
          'All URLs use www subdomain'
        );
      } else {
        await this.addCheck(
          'Sitemap host consistency',
          false,
          `Found ${nonWwwUrls.length} non-www URLs`,
          'warning'
        );
      }

      // Check for proper lastmod dates
      const lastmodDates = sitemapContent.match(/<lastmod>([^<]+)<\/lastmod>/g);
      if (lastmodDates && lastmodDates.length > 0) {
        await this.addCheck(
          'Sitemap lastmod dates',
          true,
          `${lastmodDates.length} URLs have lastmod dates`
        );
      } else {
        await this.addCheck(
          'Sitemap lastmod dates',
          false,
          'No lastmod dates found - consider adding for better crawling',
          'warning'
        );
      }

    } catch (error) {
      await this.addCheck(
        'Sitemap validation',
        false,
        `Error: ${error.message}`,
        'warning'
      );
    }
  }

  // Check 6: Server-Side Rendering for Key Routes
  async checkServerSideRendering() {
    console.log('\n🖥️ Check 6: Server-Side Rendering for Key Routes');
    
    const keyRoutes = [
      '/services/plumbing',
      '/pro/test-professional-sf'
    ];

    for (const route of keyRoutes) {
      try {
        const response = await this.fetchUrl(`${PRODUCTION_URL}${route}`);

        if (response.statusCode !== 200) {
          await this.addCheck(
            `SSR route accessibility (${route})`,
            false,
            `Route returned ${response.statusCode}`,
            'warning'
          );
          continue;
        }

        const htmlContent = response.data;
        
        // Check if it's just the SPA shell
        const hasGenericTitle = htmlContent.includes('Fixlo – Book Trusted Home Services Near You');
        const hasJavaScriptRequired = htmlContent.includes('JavaScript Required');
        const hasSpecificCanonical = htmlContent.includes(`https://www.fixloapp.com${route}`);

        if (!hasGenericTitle && !hasJavaScriptRequired && hasSpecificCanonical) {
          await this.addCheck(
            `SSR implementation (${route})`,
            true,
            'Route returns unique server-rendered content with proper canonical'
          );
        } else if (hasSpecificCanonical) {
          await this.addCheck(
            `SSR partial implementation (${route})`,
            false,
            'Route has correct canonical but may return generic content',
            'warning'
          );
        } else {
          await this.addCheck(
            `SSR implementation (${route})`,
            false,
            'Route returns generic SPA shell - may impact indexing',
            'critical'
          );
        }

      } catch (error) {
        await this.addCheck(
          `SSR test (${route})`,
          false,
          `Error: ${error.message}`,
          'warning'
        );
      }
    }
  }

  // Check 7: Static HTML Pages
  async checkStaticPages() {
    console.log('\n📄 Check 7: Static HTML Pages');
    
    const staticPages = [
      '/services/index.html',
      '/services/'
    ];

    for (const page of staticPages) {
      try {
        const response = await this.fetchUrl(`${PRODUCTION_URL}${page}`);

        if (response.statusCode === 200) {
          const htmlContent = response.data;
          
          // Check for proper title
          const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/i);
          const title = titleMatch ? titleMatch[1] : null;
          
          // Check for canonical
          const canonicalMatch = htmlContent.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
          const canonical = canonicalMatch ? canonicalMatch[1] : null;
          
          if (title && title !== 'Fixlo – Book Trusted Home Services Near You') {
            await this.addCheck(
              `Static page title (${page})`,
              true,
              `Unique title: "${title}"`
            );
          } else {
            await this.addCheck(
              `Static page title (${page})`,
              false,
              'Generic or missing title',
              'warning'
            );
          }

          if (canonical && canonical.includes(page.replace('index.html', ''))) {
            await this.addCheck(
              `Static page canonical (${page})`,
              true,
              `Proper canonical: ${canonical}`
            );
          } else {
            await this.addCheck(
              `Static page canonical (${page})`,
              false,
              `Incorrect canonical: ${canonical}`,
              'warning'
            );
          }

        } else {
          await this.addCheck(
            `Static page accessibility (${page})`,
            false,
            `Page returned ${response.statusCode}`,
            'warning'
          );
        }

      } catch (error) {
        await this.addCheck(
          `Static page test (${page})`,
          false,
          `Error: ${error.message}`,
          'warning'
        );
      }
    }
  }

  // Generate comprehensive report
  async generateReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportDir = path.join(__dirname, '..', 'verification-results');
    
    try {
      await fs.mkdir(reportDir, { recursive: true });
    } catch (error) {
      console.log('Report directory already exists');
    }

    // Add recommendations
    this.generateRecommendations();

    // Generate text report
    const textReport = this.generateTextReport();
    const textPath = path.join(reportDir, `production-indexing-verification-${timestamp}.txt`);
    await fs.writeFile(textPath, textReport);

    // Generate JSON report
    const jsonPath = path.join(reportDir, `production-indexing-verification-${timestamp}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(this.results, null, 2));

    console.log(`\n📄 Reports generated:`);
    console.log(`   Text: ${textPath}`);
    console.log(`   JSON: ${jsonPath}`);

    return { textPath, jsonPath };
  }

  generateRecommendations() {
    const { checks } = this.results;
    
    // Analyze results and generate specific recommendations
    const failedCanonical = checks.filter(c => 
      c.name.includes('Canonical') && !c.passed
    ).length;
    
    const failedSSR = checks.filter(c => 
      c.name.includes('SSR') && !c.passed
    ).length;

    if (failedCanonical > 0) {
      this.results.recommendations.push({
        priority: 'HIGH',
        area: 'Canonical URLs',
        recommendation: 'Implement dynamic canonical URL generation in your React app routing to ensure each route serves its own canonical URL instead of the homepage canonical.',
        implementation: 'Update your SEOHead component or routing logic to dynamically set canonical URLs based on the current route.'
      });
    }

    if (failedSSR > 0) {
      this.results.recommendations.push({
        priority: 'MEDIUM',
        area: 'Server-Side Rendering',
        recommendation: 'Consider implementing SSR or static generation for key routes (/services/*, /pro/*) to improve indexability.',
        implementation: 'Use Next.js, implement middleware-based prerendering, or create static HTML pages for critical routes.'
      });
    }
  }

  generateTextReport() {
    const { checks, summary, issues, recommendations } = this.results;
    
    let report = `# 🔍 Production Indexing Verification Report
Generated: ${this.results.timestamp}
Production URL: ${PRODUCTION_URL}

## 📊 Summary
- Total Checks: ${summary.total}
- Passed: ${summary.passed} ✅
- Failed: ${summary.failed} ❌
- Success Rate: ${((summary.passed / summary.total) * 100).toFixed(1)}%

`;

    // Add critical issues section
    if (issues.length > 0) {
      report += `## 🚨 Critical Issues to Fix\n\n`;
      issues.forEach((issue, index) => {
        report += `${index + 1}. **${issue.type}**: ${issue.name}
   Problem: ${issue.details}
   Solution: ${issue.solution}

`;
      });
    }

    // Add recommendations section
    if (recommendations.length > 0) {
      report += `## 💡 Implementation Recommendations\n\n`;
      recommendations.forEach((rec, index) => {
        report += `${index + 1}. **${rec.priority} PRIORITY**: ${rec.area}
   Recommendation: ${rec.recommendation}
   Implementation: ${rec.implementation}

`;
      });
    }

    // Add detailed results
    report += `## 📋 Detailed Results\n\n`;
    checks.forEach((check, index) => {
      const status = check.passed ? '✅' : '❌';
      const severity = check.severity === 'critical' ? ' 🚨' : check.severity === 'warning' ? ' ⚠️' : '';
      report += `${index + 1}. ${status} ${check.name}${severity}
   ${check.details}

`;
    });

    // Add manual checklist
    report += `## ✋ Manual Verification Checklist

Copy this checklist to your PR:

\`\`\`
Production Indexing Verification — Do Not Merge Until All Pass

☐ robots.txt present, allows public routes, and lists sitemap (200 OK).
☐ sitemap.xml valid & only canonical, 200 URLs (no redirects/noindex/params).
☐ All core routes return an absolute self-canonical and no noindex.
☐ Host canonicalization: non-www → www (or vice-versa) via 301; Sitemap/Canonical match host.
☐ Parameter handling: utm*, fbclid, etc. 301 to clean; canonicals = clean; not in sitemap.
☐ Sample routes return route-specific head/meta in server HTML (or prerendered), not just a JS loader.
☐ Re-submit affected patterns in GSC; monitor "Duplicate without user-selected canonical" and "Discovered/Crawled – not indexed".
\`\`\`

## 🔧 Implementation Guidelines

### A) "Duplicate without user-selected canonical" (408)
- Add self-referential canonical on each canonical page
- Enforce one host (www vs root) and one URL shape (trailing slash consistency)
- 301 redirect all alternates to canonical version
- Canonicalize away tracking parameters (utm, fbclid)
- Remove variants from sitemap

### B) "Alternate page with proper canonical tag" (39)
- Usually means Google correctly ignored the duplicate
- No action required unless alternates should be indexed
- If alternates should rank, point canonical to themselves and link internally

### C) "Excluded by 'noindex' tag" (14)
- Remove noindex (meta or header) from pages that should rank
- Ensure build/headers don't inject X-Robots-Tag: noindex accidentally

### D) "Page with redirect" (3)
- Keep redirects (that's fine)
- Remove redirected URLs from sitemap so Google focuses on final URLs only

### E) "Discovered – currently not indexed" (6)
- Improve internal linking
- Include in sitemap
- Ensure robots.txt doesn't block
- Serve fast, content-rich page

### F) "Crawled – currently not indexed"
- Usually a quality/duplication signal
- Make page more unique (content, media, reviews)
- Ensure canonical points to itself
- Link to it from relevant hubs

## 🌐 Testing URLs for Manual Verification

- Current Production Quick Checks:
  curl -sI https://www.fixloapp.com | sed -n '1,20p'
  curl -s https://www.fixloapp.com | grep -i -E 'canonical|robots'
  curl -s https://www.fixloapp.com/services/plumbing | head -n 60

- Facebook Debugger: https://developers.facebook.com/tools/debug/sharing/?q=https%3A%2F%2Fwww.fixloapp.com
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- Google Search Console: Submit sitemap and monitor indexing status
- Rich Results Test: https://search.google.com/test/rich-results

## 🎯 Priority Action Items

1. **Fix canonical URLs for SPA routes** - Highest priority
2. **Verify parameter handling redirects** - High priority  
3. **Implement route-specific SSR/prerendering** - Medium priority
4. **Submit updated sitemap to GSC** - Medium priority
5. **Monitor indexing improvements** - Ongoing

`;

    return report;
  }

  async run() {
    try {
      console.log('🔍 Starting Production Indexing Verification...\n');

      // Run all checks
      await this.checkCanonicalImplementation();
      await this.checkHostCanonicalization();
      await this.checkParameterHandling();
      await this.checkRobotsValidation();
      await this.checkSitemapValidation();
      await this.checkServerSideRendering();
      await this.checkStaticPages();

      // Generate reports
      const reports = await this.generateReport();
      
      console.log(`\n🎯 Verification Complete!`);
      console.log(`📊 Results: ${this.results.summary.passed}/${this.results.summary.total} checks passed`);
      
      if (this.results.issues.length > 0) {
        console.log(`🚨 Found ${this.results.issues.length} issues that need attention`);
        console.log(`📋 See report for detailed solutions and implementation guidance`);
      } else {
        console.log(`✅ No critical issues found!`);
      }

      return reports;

    } catch (error) {
      console.error('❌ Verification failed:', error);
      throw error;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const verifier = new ProductionIndexingVerifier();
  verifier.run()
    .then((reports) => {
      console.log('\n✅ Production indexing verification completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Production indexing verification failed:', error);
      process.exit(1);
    });
}

module.exports = ProductionIndexingVerifier;