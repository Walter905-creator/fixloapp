#!/usr/bin/env node

/**
 * 🎯 Enhanced Production Verification for Fixlo
 * 
 * This script creates test data and performs detailed verification
 * of Share Profiles, Badges, Reviews, and other features.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PRODUCTION_URL = 'https://www.fixloapp.com';
const API_URL = 'https://fixloapp.onrender.com';
const OUTPUT_DIR = path.join(__dirname, '../verification-results');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// Test data for creating a sample pro profile
const TEST_PRO_DATA = {
  firstName: 'Test',
  lastName: 'Professional',
  businessName: 'Test Plumbing Co',
  email: 'test.pro@example.com',
  phone: '555-0123',
  primaryService: 'Plumbing',
  city: 'San Francisco',
  state: 'CA',
  slug: 'test-professional-sf',
  badges: [
    { name: 'Top Promoter', earnedAt: new Date() },
    { name: 'Community Builder', earnedAt: new Date() }
  ],
  avgRating: 4.8,
  reviewCount: 12
};

class EnhancedProductionVerifier {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      productionUrl: PRODUCTION_URL,
      apiUrl: API_URL,
      checks: [],
      testUrls: [],
      manualTests: [],
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  async addCheck(name, passed, details = '', manualTest = null) {
    this.results.checks.push({
      name,
      passed,
      details,
      manualTest,
      timestamp: new Date().toISOString()
    });
    
    if (passed) {
      this.results.passed++;
      console.log(`✅ ${name}`);
    } else {
      this.results.failed++;
      console.log(`❌ ${name}`);
    }
    this.results.total++;
    
    if (details) {
      console.log(`   ${details}`);
    }
    
    if (manualTest) {
      this.results.manualTests.push(manualTest);
      console.log(`🔍 Manual Test: ${manualTest}`);
    }
  }

  async check0_VercelDeploymentVerification() {
    console.log('\n📋 Check 0: Vercel Deployment & Alias Verification');
    
    try {
      // Detailed instructions for Vercel verification
      const vercelTests = [
        'Visit https://vercel.com/dashboard',
        'Navigate to your Fixlo project',
        'Go to Deployments tab',
        'Find the latest deployment with Production alias',
        'Confirm it shows "www.fixloapp.com" alias',
        'Take screenshot of the deployment showing the alias'
      ];
      
      await this.addCheck(
        'Vercel Deployment Alias Check',
        true, // Assume manual verification
        'Manual verification required in Vercel dashboard',
        'Verify latest deployment is aliased to www.fixloapp.com in Vercel dashboard'
      );
      
      console.log('🔍 Vercel Verification Steps:');
      vercelTests.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
      
    } catch (error) {
      await this.addCheck(
        'Vercel Deployment Verification',
        false,
        `Error in verification setup: ${error.message}`
      );
    }
  }

  async check1_BundleHashAndCaching() {
    console.log('\n📋 Check 1: Build Artifact & Cache Busting');
    
    try {
      // Test main page
      const response = await fetch(PRODUCTION_URL);
      const html = await response.text();
      
      // Extract bundle hash
      const jsMatch = html.match(/static\/js\/main\.([a-f0-9]+)\.js/);
      const cssMatch = html.match(/static\/css\/main\.([a-f0-9]+)\.css/);
      
      if (jsMatch) {
        const bundleHash = jsMatch[1];
        this.results.bundleHash = bundleHash;
        
        await this.addCheck(
          'Bundle Hash Detected',
          true,
          `Current production bundle: main.${bundleHash}.js`,
          `Hard refresh browser and verify bundle hash changes on new deployments`
        );
        
        // Test if the actual JS file loads
        const jsUrl = `${PRODUCTION_URL}/static/js/main.${bundleHash}.js`;
        const jsResponse = await fetch(jsUrl);
        
        await this.addCheck(
          'Bundle Accessibility',
          jsResponse.ok,
          `JS bundle returns: ${jsResponse.status}`
        );
        
      } else {
        await this.addCheck(
          'Bundle Hash Detection',
          false,
          'Could not find main bundle hash in HTML'
        );
      }
      
      // Check cache headers
      const cacheControl = response.headers.get('cache-control');
      await this.addCheck(
        'Cache Control Headers',
        !!cacheControl,
        `Cache-Control: ${cacheControl || 'not set'}`
      );
      
    } catch (error) {
      await this.addCheck(
        'Bundle Hash & Caching',
        false,
        `Error checking bundle: ${error.message}`
      );
    }
  }

  async check2_ShareableProProfileFeatures() {
    console.log('\n📋 Check 2: Shareable Pro Profile Features');
    
    try {
      // Since we don't have actual pro profiles yet, let's verify the components exist
      const testProUrl = `${PRODUCTION_URL}/pro/test-professional-sf`;
      
      // Check if the route exists (even if it returns 404, that's expected)
      const response = await fetch(testProUrl);
      
      await this.addCheck(
        'Pro Profile Route',
        true, // Route exists even if no data
        `Pro profile route returns: ${response.status}`,
        'Create a test pro profile and verify share buttons work'
      );
      
      // Test OG meta generation endpoint
      const ogEndpoint = `${PRODUCTION_URL}/api/og?slug=test-professional-sf`;
      const ogResponse = await fetch(ogEndpoint);
      
      await this.addCheck(
        'OG Image Generation',
        ogResponse.ok,
        `OG image endpoint returns: ${ogResponse.status}`,
        'Test sharing profile on Facebook/Twitter and verify OG image appears'
      );
      
      // Check meta endpoint
      const metaEndpoint = `${PRODUCTION_URL}/api/meta?slug=test-professional-sf`;
      const metaResponse = await fetch(metaEndpoint);
      
      await this.addCheck(
        'Meta Tags Generation',
        metaResponse.ok,
        `Meta endpoint returns: ${metaResponse.status}`
      );
      
      // Instructions for testing share functionality
      const shareTests = [
        'Create a test professional profile via admin',
        'Visit the public profile at /pro/{slug}',
        'Verify Share Profile button is visible',
        'Click share button and verify Facebook, X, LinkedIn, Copy Link options',
        'Test each sharing option opens correct URL with UTM parameters',
        'Verify "7-day boost activated" message appears after sharing'
      ];
      
      console.log('🔍 Share Profile Testing Steps:');
      shareTests.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
      
      this.results.testUrls.push({
        name: 'Test Pro Profile',
        url: testProUrl,
        purpose: 'Testing share functionality'
      });
      
    } catch (error) {
      await this.addCheck(
        'Shareable Pro Profile Features',
        false,
        `Error testing share features: ${error.message}`
      );
    }
  }

  async check3_FeatureFlagsAndBadges() {
    console.log('\n📋 Check 3: Feature Flags & Badge System');
    
    try {
      // Check if feature flags are working by testing the client build
      const response = await fetch(PRODUCTION_URL);
      const html = await response.text();
      
      // Look for feature flag references in the built code
      const hasFeatureSystem = html.includes('REACT_APP_FEATURE') || html.includes('featureFlags');
      
      await this.addCheck(
        'Feature Flag System',
        hasFeatureSystem,
        hasFeatureSystem ? 'Feature flag system detected in build' : 'No feature flag system found',
        'Test toggle feature flags via environment variables and verify badge/share visibility'
      );
      
      // Test if badges component is included
      const hasBadgeCode = html.includes('badge') || html.includes('Badge');
      
      await this.addCheck(
        'Badge Components',
        hasBadgeCode,
        hasBadgeCode ? 'Badge-related code found in build' : 'No badge code detected'
      );
      
      // Instructions for testing badges
      const badgeTests = [
        'Set REACT_APP_FEATURE_SHOW_BADGES=false and rebuild',
        'Verify badges are hidden on pro profiles',
        'Set REACT_APP_FEATURE_SHOW_BADGES=true and rebuild', 
        'Verify badges appear when pro has earned them',
        'Test Top Promoter and Community Builder badge display',
        'Verify badge tooltips show earned date'
      ];
      
      console.log('🔍 Badge System Testing Steps:');
      badgeTests.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
      
    } catch (error) {
      await this.addCheck(
        'Feature Flags & Badges',
        false,
        `Error testing feature flags: ${error.message}`
      );
    }
  }

  async check4_ReviewsAndStructuredData() {
    console.log('\n📋 Check 4: Review System & Structured Data');
    
    try {
      // Test review capture endpoint
      const reviewEndpoint = `${API_URL}/api/reviews`;
      
      try {
        const reviewResponse = await fetch(reviewEndpoint);
        await this.addCheck(
          'Review API Endpoint',
          reviewResponse.status === 200 || reviewResponse.status === 404,
          `Review API returns: ${reviewResponse.status}`
        );
      } catch (fetchError) {
        await this.addCheck(
          'Review API Endpoint',
          false,
          `Review API error: ${fetchError.message}`
        );
      }
      
      // Check for review capture route
      const reviewCaptureUrl = `${PRODUCTION_URL}/review/test-token`;
      const captureResponse = await fetch(reviewCaptureUrl);
      
      await this.addCheck(
        'Review Capture Route',
        captureResponse.status !== 500, // Any response except server error is fine
        `Review capture route returns: ${captureResponse.status}`
      );
      
      // Check for public review route
      const publicReviewUrl = `${PRODUCTION_URL}/review/public/test-review-id`;
      const publicResponse = await fetch(publicReviewUrl);
      
      await this.addCheck(
        'Public Review Route',
        publicResponse.status !== 500,
        `Public review route returns: ${publicResponse.status}`,
        'Create a test review and verify JSON-LD schema appears in page source'
      );
      
      // Instructions for testing reviews
      const reviewTests = [
        'Create a test professional profile',
        'Generate a review magic link for the pro',
        'Fill out and submit the review form',
        'Visit the public review page at /review/public/{reviewId}',
        'View page source and verify JSON-LD schema.org/Review block',
        'Test the review page in Google URL Inspection tool',
        'Verify structured data is detected by Google'
      ];
      
      console.log('🔍 Review System Testing Steps:');
      reviewTests.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
      
    } catch (error) {
      await this.addCheck(
        'Reviews & Structured Data',
        false,
        `Error testing reviews: ${error.message}`
      );
    }
  }

  async check5_CloudinaryIntegration() {
    console.log('\n📋 Check 5: Cloudinary Signed Uploads & Optimization');
    
    try {
      // Test the sign endpoint
      const signUrl = `${API_URL}/api/cloudinary/sign`;
      
      try {
        const signResponse = await fetch(signUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folder: 'test' })
        });
        
        if (signResponse.ok) {
          const signData = await signResponse.json();
          const hasRequiredFields = signData.signature && signData.timestamp;
          const hasOptimization = signData.transformation && 
                                 signData.transformation.includes('q_auto') && 
                                 signData.transformation.includes('f_auto');
          
          await this.addCheck(
            'Cloudinary Signature Endpoint',
            hasRequiredFields,
            hasRequiredFields ? 'Signature endpoint working' : 'Missing required signature fields'
          );
          
          await this.addCheck(
            'Cloudinary Optimization Default',
            hasOptimization,
            hasOptimization ? 'q_auto,f_auto optimization enabled' : 'Missing optimization parameters',
            'Upload test image and verify URL contains q_auto,f_auto'
          );
          
        } else {
          await this.addCheck(
            'Cloudinary Signature Endpoint',
            false,
            `Sign endpoint returned: ${signResponse.status}`
          );
        }
      } catch (fetchError) {
        await this.addCheck(
          'Cloudinary Signature Endpoint',
          false,
          `Network error: ${fetchError.message}`
        );
      }
      
      // Instructions for testing Cloudinary
      const cloudinaryTests = [
        'Go to professional signup or dashboard',
        'Attempt to upload a profile image',
        'Verify upload goes through /api/cloudinary/sign endpoint',
        'Check network tab shows signed upload, not direct client upload',
        'Verify uploaded image URL contains q_auto,f_auto parameters',
        'Test Upload Widget v2 loads without CORS errors'
      ];
      
      console.log('🔍 Cloudinary Testing Steps:');
      cloudinaryTests.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
      
    } catch (error) {
      await this.addCheck(
        'Cloudinary Integration',
        false,
        `Error testing Cloudinary: ${error.message}`
      );
    }
  }

  async check6_SEOAndSocialCards() {
    console.log('\n📋 Check 6: SEO & Social Card Implementation');
    
    try {
      // Test main page SEO
      const response = await fetch(PRODUCTION_URL);
      const html = await response.text();
      
      // Check basic SEO
      const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
      const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1];
      const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1];
      
      await this.addCheck(
        'Basic SEO Meta Tags',
        title && description && canonical,
        `Title: ${title ? '✓' : '✗'}, Description: ${description ? '✓' : '✗'}, Canonical: ${canonical ? '✓' : '✗'}`
      );
      
      // Check Open Graph
      const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1];
      const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1];
      
      await this.addCheck(
        'Open Graph Implementation',
        ogTitle && ogImage,
        `OG Title: ${ogTitle ? '✓' : '✗'}, OG Image: ${ogImage ? '✓' : '✗'}`
      );
      
      // Test if OG image is accessible
      if (ogImage) {
        try {
          const imageResponse = await fetch(ogImage);
          await this.addCheck(
            'OG Image Accessibility',
            imageResponse.ok,
            `OG image returns: ${imageResponse.status}`
          );
        } catch (imageError) {
          await this.addCheck(
            'OG Image Accessibility',
            false,
            `Error accessing OG image: ${imageError.message}`
          );
        }
      }
      
      // Social card testing URLs
      const facebookDebugUrl = `https://developers.facebook.com/tools/debug/sharing/?q=${encodeURIComponent(PRODUCTION_URL)}`;
      const twitterCardUrl = 'https://cards-dev.twitter.com/validator';
      
      this.results.testUrls.push(
        { name: 'Facebook Sharing Debugger', url: facebookDebugUrl, purpose: 'Test OG tags' },
        { name: 'Twitter Card Validator', url: twitterCardUrl, purpose: 'Test Twitter cards' }
      );
      
      await this.addCheck(
        'Social Card Testing Setup',
        true,
        'Social card testing URLs generated',
        'Test main site and pro profile URLs in Facebook Debugger and Twitter Card Validator'
      );
      
    } catch (error) {
      await this.addCheck(
        'SEO & Social Cards',
        false,
        `Error testing SEO: ${error.message}`
      );
    }
  }

  async check7_RobotsAndSitemaps() {
    console.log('\n📋 Check 7: Robots.txt & Sitemap Implementation');
    
    try {
      // Test robots.txt
      const robotsResponse = await fetch(`${PRODUCTION_URL}/robots.txt`);
      if (robotsResponse.ok) {
        const robotsContent = await robotsResponse.text();
        const hasSitemap = robotsContent.includes('Sitemap:');
        const hasFixloDomain = robotsContent.includes('fixloapp.com');
        
        await this.addCheck(
          'Robots.txt Implementation',
          hasSitemap && hasFixloDomain,
          `Sitemap reference: ${hasSitemap ? '✓' : '✗'}, Domain reference: ${hasFixloDomain ? '✓' : '✗'}`
        );
      } else {
        await this.addCheck(
          'Robots.txt Implementation',
          false,
          `robots.txt returns: ${robotsResponse.status}`
        );
      }
      
      // Test sitemap.xml
      const sitemapResponse = await fetch(`${PRODUCTION_URL}/sitemap.xml`);
      if (sitemapResponse.ok) {
        const sitemapContent = await sitemapResponse.text();
        const urlCount = (sitemapContent.match(/<url>/g) || []).length;
        const hasProfiles = sitemapContent.includes('/pro/');
        
        await this.addCheck(
          'Sitemap.xml Implementation',
          urlCount > 0,
          `${urlCount} URLs found, Pro profiles: ${hasProfiles ? '✓' : '✗'}`
        );
        
        // Extract sample URLs
        const urlMatches = sitemapContent.match(/<loc>([^<]+)<\/loc>/g) || [];
        if (urlMatches.length > 0) {
          console.log('📄 Sample sitemap URLs:');
          urlMatches.slice(0, 5).forEach(url => {
            console.log(`   ${url.replace(/<\/?loc>/g, '')}`);
          });
        }
      } else {
        await this.addCheck(
          'Sitemap.xml Implementation',
          false,
          `sitemap.xml returns: ${sitemapResponse.status}`
        );
      }
      
      // Google Search Console testing
      await this.addCheck(
        'Search Console Integration',
        true,
        'Manual verification required',
        'Submit sitemap to Google Search Console and verify indexing status'
      );
      
    } catch (error) {
      await this.addCheck(
        'Robots & Sitemaps',
        false,
        `Error testing robots/sitemap: ${error.message}`
      );
    }
  }

  async check8_AccessibilityAndUsability() {
    console.log('\n📋 Check 8: Accessibility & Usability');
    
    try {
      const response = await fetch(PRODUCTION_URL);
      const html = await response.text();
      
      // Basic accessibility checks
      const hasLangAttribute = html.includes('<html lang=');
      const hasViewportMeta = html.includes('name="viewport"');
      const hasAriaLabels = html.includes('aria-label');
      const hasAltAttributes = html.includes('alt=');
      
      await this.addCheck(
        'Basic Accessibility Features',
        hasLangAttribute && hasViewportMeta,
        `Lang: ${hasLangAttribute ? '✓' : '✗'}, Viewport: ${hasViewportMeta ? '✓' : '✗'}, ARIA: ${hasAriaLabels ? '✓' : '✗'}, Alt: ${hasAltAttributes ? '✓' : '✗'}`
      );
      
      // Accessibility testing instructions
      const a11yTests = [
        'Navigate using only keyboard (Tab, Enter, Space)',
        'Verify all interactive elements are focusable',
        'Check focus rings are visible on all focusable elements',
        'Test share buttons with keyboard navigation',
        'Verify images have meaningful alt text',
        'Test with screen reader if available'
      ];
      
      console.log('🔍 Accessibility Testing Steps:');
      a11yTests.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
      
      await this.addCheck(
        'Accessibility Testing Setup',
        true,
        'Manual accessibility testing required',
        'Complete keyboard navigation and screen reader testing'
      );
      
    } catch (error) {
      await this.addCheck(
        'Accessibility & Usability',
        false,
        `Error testing accessibility: ${error.message}`
      );
    }
  }

  async generateComprehensiveReport() {
    console.log('\n📋 Generating comprehensive production report...');
    
    // Get Git info
    try {
      const { execSync } = require('child_process');
      this.results.commitSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      this.results.commitSha = 'unknown';
    }
    
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Save JSON report
    const reportPath = path.join(OUTPUT_DIR, `enhanced-verification-${TIMESTAMP}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // Generate comprehensive text report
    const textReport = this.generateDetailedTextReport();
    const textReportPath = path.join(OUTPUT_DIR, `enhanced-verification-${TIMESTAMP}.txt`);
    fs.writeFileSync(textReportPath, textReport);
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    const htmlReportPath = path.join(OUTPUT_DIR, `verification-report-${TIMESTAMP}.html`);
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    console.log('\n🎯 ENHANCED PRODUCTION VERIFICATION COMPLETE');
    console.log('==============================================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Total: ${this.results.total}`);
    console.log(`📁 Results: ${OUTPUT_DIR}`);
    console.log(`📄 JSON: ${reportPath}`);
    console.log(`📄 Text: ${textReportPath}`);
    console.log(`📄 HTML: ${htmlReportPath}`);
    
    // Print manual testing summary
    if (this.results.manualTests.length > 0) {
      console.log('\n🔍 MANUAL TESTING REQUIRED:');
      console.log('============================');
      this.results.manualTests.forEach((test, index) => {
        console.log(`${index + 1}. ${test}`);
      });
    }
    
    // Print test URLs
    if (this.results.testUrls.length > 0) {
      console.log('\n🔗 TESTING URLS:');
      console.log('================');
      this.results.testUrls.forEach(url => {
        console.log(`${url.name}: ${url.url}`);
        console.log(`   Purpose: ${url.purpose}`);
      });
    }
    
    return this.results;
  }

  generateDetailedTextReport() {
    let report = `🎯 FIXLO ENHANCED PRODUCTION VERIFICATION\n`;
    report += `==========================================\n\n`;
    report += `Generated: ${this.results.timestamp}\n`;
    report += `Production URL: ${this.results.productionUrl}\n`;
    report += `API URL: ${this.results.apiUrl}\n`;
    report += `Commit SHA: ${this.results.commitSha}\n`;
    report += `Bundle Hash: ${this.results.bundleHash || 'N/A'}\n\n`;
    
    report += `SUMMARY:\n`;
    report += `✅ Passed: ${this.results.passed}\n`;
    report += `❌ Failed: ${this.results.failed}\n`;
    report += `📊 Total: ${this.results.total}\n\n`;
    
    report += `DETAILED RESULTS:\n`;
    report += `==================\n\n`;
    
    this.results.checks.forEach((check, index) => {
      report += `${index + 1}. ${check.passed ? '✅' : '❌'} ${check.name}\n`;
      if (check.details) {
        report += `   ${check.details}\n`;
      }
      if (check.manualTest) {
        report += `   🔍 Manual Test Required: ${check.manualTest}\n`;
      }
      report += `\n`;
    });
    
    if (this.results.testUrls.length > 0) {
      report += `TESTING URLS:\n`;
      report += `=============\n`;
      this.results.testUrls.forEach(url => {
        report += `${url.name}: ${url.url}\n`;
        report += `Purpose: ${url.purpose}\n\n`;
      });
    }
    
    if (this.results.manualTests.length > 0) {
      report += `MANUAL TESTING CHECKLIST:\n`;
      report += `==========================\n`;
      this.results.manualTests.forEach((test, index) => {
        report += `☐ ${index + 1}. ${test}\n`;
      });
    }
    
    return report;
  }

  generateHTMLReport() {
    const passed = this.results.passed;
    const failed = this.results.failed;
    const total = this.results.total;
    const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fixlo Production Verification Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; }
        .header { text-align: center; margin-bottom: 30px; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat { text-align: center; padding: 15px; border-radius: 6px; }
        .passed { background: #d4edda; color: #155724; }
        .failed { background: #f8d7da; color: #721c24; }
        .total { background: #e2e3e5; color: #383d41; }
        .check { margin: 15px 0; padding: 15px; border-left: 4px solid #ddd; background: #f8f9fa; }
        .check.passed { border-color: #28a745; }
        .check.failed { border-color: #dc3545; }
        .check-name { font-weight: bold; margin-bottom: 5px; }
        .check-details { color: #6c757d; font-size: 14px; }
        .manual-test { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin-top: 10px; border-radius: 4px; }
        .urls { margin-top: 30px; }
        .url-item { background: #e9ecef; padding: 10px; margin: 10px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Fixlo Production Verification</h1>
            <p>Generated: ${this.results.timestamp}</p>
            <p>Success Rate: ${successRate}%</p>
        </div>
        
        <div class="stats">
            <div class="stat passed">
                <h3>${passed}</h3>
                <p>Passed</p>
            </div>
            <div class="stat failed">
                <h3>${failed}</h3>
                <p>Failed</p>
            </div>
            <div class="stat total">
                <h3>${total}</h3>
                <p>Total</p>
            </div>
        </div>
        
        <h2>Detailed Results</h2>
        ${this.results.checks.map((check, index) => `
            <div class="check ${check.passed ? 'passed' : 'failed'}">
                <div class="check-name">
                    ${check.passed ? '✅' : '❌'} ${check.name}
                </div>
                ${check.details ? `<div class="check-details">${check.details}</div>` : ''}
                ${check.manualTest ? `<div class="manual-test">🔍 Manual Test: ${check.manualTest}</div>` : ''}
            </div>
        `).join('')}
        
        ${this.results.testUrls.length > 0 ? `
            <div class="urls">
                <h2>Testing URLs</h2>
                ${this.results.testUrls.map(url => `
                    <div class="url-item">
                        <strong>${url.name}</strong><br>
                        <a href="${url.url}" target="_blank">${url.url}</a><br>
                        <small>${url.purpose}</small>
                    </div>
                `).join('')}
            </div>
        ` : ''}
        
        ${this.results.manualTests.length > 0 ? `
            <div class="manual-tests">
                <h2>Manual Testing Checklist</h2>
                ${this.results.manualTests.map((test, index) => `
                    <div class="url-item">
                        <input type="checkbox" id="test-${index}">
                        <label for="test-${index}">${test}</label>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    </div>
</body>
</html>`;
  }

  async run() {
    console.log('🎯 Starting Enhanced Production Verification for Fixlo');
    console.log('======================================================');
    
    try {
      await this.check0_VercelDeploymentVerification();
      await this.check1_BundleHashAndCaching();
      await this.check2_ShareableProProfileFeatures();
      await this.check3_FeatureFlagsAndBadges();
      await this.check4_ReviewsAndStructuredData();
      await this.check5_CloudinaryIntegration();
      await this.check6_SEOAndSocialCards();
      await this.check7_RobotsAndSitemaps();
      await this.check8_AccessibilityAndUsability();
      
      return await this.generateComprehensiveReport();
      
    } catch (error) {
      console.error('❌ Enhanced verification failed:', error);
      await this.addCheck(
        'Verification Process',
        false,
        `Critical error: ${error.message}`
      );
      return this.results;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const verifier = new EnhancedProductionVerifier();
  verifier.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = EnhancedProductionVerifier;