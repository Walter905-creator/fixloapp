#!/usr/bin/env node

/**
 * Production Indexing Verification Script
 * 
 * This script implements the comprehensive production indexing checklist
 * as specified in the Google Search Console optimization requirements.
 * 
 * Validates:
 * - Canonical URL implementation
 * - Robots.txt and sitemap.xml
 * - Host canonicalization (www vs non-www)
 * - Parameter handling and redirects
 * - Meta tags (no unintentional noindex)
 * - Server-side rendering for key routes
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const PRODUCTION_URL = 'https://www.fixloapp.com';
const NON_WWW_URL = 'https://fixloapp.com';

class ProductionIndexingVerifier {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      checks: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      },
      issues: [],
      manualChecklist: []
    };
  }

  async init() {
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
    
    // Set user agent to simulate search bot
    await this.page.setUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
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
      '/services/plumbing',
      '/pro/test-professional-sf'
    ];

    let canonicalIssues = 0;
    
    for (const route of testRoutes) {
      try {
        const url = `${PRODUCTION_URL}${route}`;
        const response = await this.page.goto(url, { waitUntil: 'networkidle' });
        
        if (response.status() !== 200) {
          await this.addCheck(
            `Route ${route} accessibility`,
            false,
            `Route returned ${response.status()}`,
            'warning'
          );
          continue;
        }

        // Check for canonical tag
        const canonicalUrl = await this.page.getAttribute('link[rel="canonical"]', 'href');
        const expectedCanonical = url.endsWith('/') ? url : url + (route === '/' ? '' : '/');
        
        if (!canonicalUrl) {
          await this.addCheck(
            `Canonical tag presence (${route})`,
            false,
            'No canonical tag found',
            'critical'
          );
          canonicalIssues++;
        } else if (canonicalUrl !== expectedCanonical.replace(/\/$/, route === '/' ? '/' : '')) {
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
        const robotsMeta = await this.page.getAttribute('meta[name="robots"]', 'content');
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
      // Test non-www to www redirect
      const response = await this.page.goto(NON_WWW_URL, { waitUntil: 'networkidle' });
      const finalUrl = this.page.url();
      
      if (finalUrl.startsWith('https://www.fixloapp.com')) {
        await this.addCheck(
          'Non-www to www redirect',
          true,
          `${NON_WWW_URL} → ${finalUrl}`
        );
      } else {
        await this.addCheck(
          'Non-www to www redirect',
          false,
          `Expected redirect to www, got: ${finalUrl}`,
          'critical'
        );
      }

      // Check canonical consistency
      const canonicalUrl = await this.page.getAttribute('link[rel="canonical"]', 'href');
      if (canonicalUrl && canonicalUrl.startsWith('https://www.fixloapp.com')) {
        await this.addCheck(
          'Canonical host consistency',
          true,
          `Canonical uses www: ${canonicalUrl}`
        );
      } else {
        await this.addCheck(
          'Canonical host consistency',
          false,
          `Canonical should use www: ${canonicalUrl}`,
          'critical'
        );
      }

    } catch (error) {
      await this.addCheck(
        'Host canonicalization',
        false,
        `Error testing redirects: ${error.message}`,
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
        const response = await this.page.goto(`${PRODUCTION_URL}${testUrl}`, { 
          waitUntil: 'networkidle' 
        });
        
        const finalUrl = this.page.url();
        const canonicalUrl = await this.page.getAttribute('link[rel="canonical"]', 'href');
        
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

        // Ideally should also test for 301 redirects, but that's harder with SPA
        
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
      const response = await this.page.goto(`${PRODUCTION_URL}/robots.txt`);
      
      if (response.status() !== 200) {
        await this.addCheck(
          'Robots.txt accessibility',
          false,
          `robots.txt returned ${response.status()}`,
          'critical'
        );
        return;
      }

      const robotsContent = await this.page.textContent('body');
      
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

      // Check that public routes are allowed
      if (!robotsContent.includes('Disallow: /')) {
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
      const response = await this.page.goto(`${PRODUCTION_URL}/sitemap.xml`);
      
      if (response.status() !== 200) {
        await this.addCheck(
          'Sitemap accessibility',
          false,
          `sitemap.xml returned ${response.status()}`,
          'critical'
        );
        return;
      }

      const sitemapContent = await this.page.textContent('body');
      
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
        const response = await this.page.goto(`${PRODUCTION_URL}${route}`, {
          waitUntil: 'domcontentloaded' // Don't wait for JS
        });

        if (response.status() !== 200) {
          await this.addCheck(
            `SSR route accessibility (${route})`,
            false,
            `Route returned ${response.status()}`,
            'warning'
          );
          continue;
        }

        // Get raw HTML before JS execution
        const htmlContent = await response.text();
        
        // Check if it's just the SPA shell
        const hasUniqueContent = !htmlContent.includes('JavaScript Required') && 
                                htmlContent.includes('<title>') &&
                                !htmlContent.includes('Fixlo – Book Trusted Home Services Near You'); // Generic title

        const hasCorrectCanonical = htmlContent.includes(`https://www.fixloapp.com${route}`);

        if (hasUniqueContent && hasCorrectCanonical) {
          await this.addCheck(
            `SSR implementation (${route})`,
            true,
            'Route returns unique server-rendered content'
          );
        } else {
          await this.addCheck(
            `SSR implementation (${route})`,
            false,
            'Route returns generic SPA shell - may impact indexing',
            'warning'
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

  // Check 7: Headers and Response Validation
  async checkResponseHeaders() {
    console.log('\n📡 Check 7: Response Headers Validation');
    
    try {
      const response = await this.page.goto(PRODUCTION_URL);
      const headers = response.headers();
      
      // Check for X-Robots-Tag header
      if (headers['x-robots-tag'] && headers['x-robots-tag'].includes('noindex')) {
        await this.addCheck(
          'X-Robots-Tag header',
          false,
          `Found noindex header: ${headers['x-robots-tag']}`,
          'critical'
        );
      } else {
        await this.addCheck(
          'X-Robots-Tag header',
          true,
          'No problematic X-Robots-Tag headers'
        );
      }

      // Check status code
      if (response.status() === 200) {
        await this.addCheck(
          'Primary route status',
          true,
          'Returns 200 OK'
        );
      } else {
        await this.addCheck(
          'Primary route status',
          false,
          `Returns ${response.status()}`,
          'critical'
        );
      }

    } catch (error) {
      await this.addCheck(
        'Response headers',
        false,
        `Error: ${error.message}`,
        'warning'
      );
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

  generateTextReport() {
    const { checks, summary, issues } = this.results;
    
    let report = `# 🔍 Production Indexing Verification Report
Generated: ${this.results.timestamp}
Production URL: ${PRODUCTION_URL}

## 📊 Summary
- Total Checks: ${summary.total}
- Passed: ${summary.passed} ✅
- Failed: ${summary.failed} ❌
- Success Rate: ${((summary.passed / summary.total) * 100).toFixed(1)}%

`;

    // Add issues section
    if (issues.length > 0) {
      report += `## 🚨 Critical Issues to Fix\n\n`;
      issues.forEach((issue, index) => {
        report += `${index + 1}. **${issue.type}**: ${issue.name}
   Problem: ${issue.details}
   Solution: ${issue.solution}

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

- Facebook Debugger: https://developers.facebook.com/tools/debug/sharing/?q=https%3A%2F%2Fwww.fixloapp.com
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- Google Search Console: Submit sitemap and monitor indexing status
- Rich Results Test: https://search.google.com/test/rich-results

`;

    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      console.log('🔍 Starting Production Indexing Verification...\n');
      
      await this.init();

      // Run all checks
      await this.checkCanonicalImplementation();
      await this.checkHostCanonicalization();
      await this.checkParameterHandling();
      await this.checkRobotsValidation();
      await this.checkSitemapValidation();
      await this.checkServerSideRendering();
      await this.checkResponseHeaders();

      // Generate reports
      const reports = await this.generateReport();
      
      console.log(`\n🎯 Verification Complete!`);
      console.log(`📊 Results: ${this.results.summary.passed}/${this.results.summary.total} checks passed`);
      
      if (this.results.issues.length > 0) {
        console.log(`🚨 Found ${this.results.issues.length} issues that need attention`);
      } else {
        console.log(`✅ No critical issues found!`);
      }

      return reports;

    } catch (error) {
      console.error('❌ Verification failed:', error);
      throw error;
    } finally {
      await this.cleanup();
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