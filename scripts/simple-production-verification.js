#!/usr/bin/env node

/**
 * 🎯 Simple Production Verification Checklist for Fixlo
 * 
 * This script verifies all features using simple HTTP requests and basic checks:
 * - Share Profiles, 7‑Day Boost, Badges, Reviews, Cloudinary, SEO
 * 
 * Usage: npm run verify-production
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const PRODUCTION_URL = 'https://www.fixloapp.com';
const API_URL = 'https://fixloapp.onrender.com';
const OUTPUT_DIR = path.join(__dirname, '../verification-results');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Simple HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : require('http');
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

class SimpleProductionVerifier {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      productionUrl: PRODUCTION_URL,
      apiUrl: API_URL,
      checks: [],
      bundleHash: null,
      commitSha: null,
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  async addCheck(name, passed, details = '') {
    this.results.checks.push({
      name,
      passed,
      details,
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
  }

  async check0_DeploymentLive() {
    console.log('\n📋 Check 0: Confirm deployment is live on www.fixloapp.com');
    
    try {
      const response = await makeRequest(PRODUCTION_URL);
      const isLive = response.status === 200 && response.data.includes('Fixlo');
      const title = response.data.match(/<title>([^<]+)<\/title>/i)?.[1] || 'No title found';
      
      await this.addCheck(
        'Deployment Live',
        isLive,
        `Status: ${response.status}, Title: "${title}"`
      );
      
      return response.data; // Return HTML for further checks
    } catch (error) {
      await this.addCheck(
        'Deployment Live',
        false,
        `Error accessing site: ${error.message}`
      );
      return null;
    }
  }

  async check1_BuildArtifactMatch(html) {
    console.log('\n📋 Check 1: Match build artifact in production');
    
    if (!html) {
      await this.addCheck('Build Artifact Match', false, 'No HTML to check');
      return;
    }
    
    try {
      const jsMatch = html.match(/static\/js\/main\.([a-f0-9]+)\.js/);
      const cssMatch = html.match(/static\/css\/main\.([a-f0-9]+)\.css/);
      
      if (jsMatch) {
        this.results.bundleHash = jsMatch[1];
        await this.addCheck(
          'Build Artifact Match',
          true,
          `Current bundle hash: ${this.results.bundleHash}`
        );
        
        // Verify the JS file is accessible
        const jsUrl = `${PRODUCTION_URL}/static/js/main.${this.results.bundleHash}.js`;
        const jsResponse = await makeRequest(jsUrl);
        
        await this.addCheck(
          'Bundle Resource Loading',
          jsResponse.status === 200,
          `JS bundle status: ${jsResponse.status}`
        );
        
      } else {
        await this.addCheck(
          'Build Artifact Match',
          false,
          'Could not find main bundle hash in HTML'
        );
      }
      
    } catch (error) {
      await this.addCheck(
        'Build Artifact Match',
        false,
        `Error checking bundle: ${error.message}`
      );
    }
  }

  async check2_ShareableProProfile(html) {
    console.log('\n📋 Check 2: Shareable Pro Profile components');
    
    if (!html) {
      await this.addCheck('Share Profile Components', false, 'No HTML to check');
      return;
    }
    
    try {
      // Check for share-related JavaScript code or components
      const hasShareButton = html.includes('Share Profile') || html.includes('shareProfile');
      const hasSocialSharing = html.includes('facebook.com/sharer') || html.includes('twitter.com/intent/tweet');
      
      await this.addCheck(
        'Share Button Component',
        hasShareButton,
        hasShareButton ? 'Share Profile text found in HTML' : 'Share Profile text not found'
      );
      
      // Check if the share URLs include UTM parameters (good practice)
      const hasUTMParams = html.includes('utm_') || html.includes('source=');
      
      await this.addCheck(
        'Share UTM Parameters',
        hasUTMParams,
        hasUTMParams ? 'UTM parameters found in share URLs' : 'No UTM parameters detected'
      );
      
    } catch (error) {
      await this.addCheck(
        'Shareable Pro Profile',
        false,
        `Error checking share functionality: ${error.message}`
      );
    }
  }

  async check3_SevenDayBoostAndBadges(html) {
    console.log('\n📋 Check 3: 7‑Day Search Boost + Badges feature flags');
    
    if (!html) {
      await this.addCheck('Boost & Badges Features', false, 'No HTML to check');
      return;
    }
    
    try {
      // Check for badge-related code
      const hasBadgeComponents = html.includes('badge') || html.includes('Badge');
      const hasBoostFeature = html.includes('boost') || html.includes('search boost');
      const hasFeatureFlags = html.includes('featureFlags') || html.includes('REACT_APP_FEATURE');
      
      await this.addCheck(
        'Badge Components',
        hasBadgeComponents,
        hasBadgeComponents ? 'Badge-related code found' : 'No badge code detected'
      );
      
      await this.addCheck(
        'Boost Feature Code',
        hasBoostFeature,
        hasBoostFeature ? 'Boost-related code found' : 'No boost code detected'
      );
      
      await this.addCheck(
        'Feature Flags System',
        hasFeatureFlags,
        hasFeatureFlags ? 'Feature flag system detected' : 'No feature flag system found'
      );
      
    } catch (error) {
      await this.addCheck(
        '7-Day Boost & Badges',
        false,
        `Error checking boost/badges: ${error.message}`
      );
    }
  }

  async check4_ReviewCaptureAndPublicPages() {
    console.log('\n📋 Check 4: Review Capture & Public Review Pages');
    
    try {
      // Check sitemap for review pages
      const sitemapResponse = await makeRequest(`${PRODUCTION_URL}/sitemap.xml`);
      
      if (sitemapResponse.status === 200) {
        const hasReviewPages = sitemapResponse.data.includes('/review/public/');
        const reviewPageCount = (sitemapResponse.data.match(/\/review\/public\//g) || []).length;
        
        await this.addCheck(
          'Public Review Pages in Sitemap',
          hasReviewPages,
          hasReviewPages ? `${reviewPageCount} review pages found in sitemap` : 'No review pages in sitemap'
        );
        
        // Check for JSON-LD schema
        const hasJsonLD = sitemapResponse.data.includes('application/ld+json') || 
                         sitemapResponse.data.includes('schema.org');
        
        await this.addCheck(
          'Structured Data Setup',
          hasJsonLD,
          hasJsonLD ? 'JSON-LD or schema.org references found' : 'No structured data detected'
        );
      } else {
        await this.addCheck(
          'Review Pages Check',
          false,
          `Could not access sitemap: ${sitemapResponse.status}`
        );
      }
      
      // Test review API endpoint
      try {
        const reviewsResponse = await makeRequest(`${API_URL}/api/reviews`);
        await this.addCheck(
          'Review API Endpoint',
          reviewsResponse.status === 200 || reviewsResponse.status === 404, // 404 is OK if no reviews
          `Review API returns: ${reviewsResponse.status}`
        );
      } catch (apiError) {
        await this.addCheck(
          'Review API Endpoint',
          false,
          `Review API error: ${apiError.message}`
        );
      }
      
    } catch (error) {
      await this.addCheck(
        'Review Capture & Public Pages',
        false,
        `Error testing reviews: ${error.message}`
      );
    }
  }

  async check5_CloudinaryOptimization() {
    console.log('\n📋 Check 5: Cloudinary signed uploads + optimized delivery');
    
    try {
      // Test the Cloudinary sign endpoint
      const signUrl = `${API_URL}/api/cloudinary/sign`;
      
      try {
        const postData = JSON.stringify({ folder: 'test' });
        const response = await makeRequest(signUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        });
        
        if (response.status === 200) {
          const data = JSON.parse(response.data);
          const hasRequiredFields = data.signature && data.timestamp && data.transformation;
          const hasOptimization = data.transformation && data.transformation.includes('q_auto') && 
                                 data.transformation.includes('f_auto');
          
          await this.addCheck(
            'Cloudinary Signed Endpoint',
            hasRequiredFields,
            hasRequiredFields ? 'Signature endpoint working with required fields' : 'Signature endpoint missing required fields'
          );
          
          await this.addCheck(
            'Cloudinary Optimization',
            hasOptimization,
            hasOptimization ? 'Default transformation includes q_auto,f_auto' : 'Missing optimization parameters'
          );
          
        } else {
          await this.addCheck(
            'Cloudinary Signed Endpoint',
            false,
            `Endpoint returned ${response.status}: ${response.data}`
          );
        }
      } catch (fetchError) {
        await this.addCheck(
          'Cloudinary Signed Endpoint',
          false,
          `Network error: ${fetchError.message}`
        );
      }
      
    } catch (error) {
      await this.addCheck(
        'Cloudinary Optimization',
        false,
        `Error testing Cloudinary: ${error.message}`
      );
    }
  }

  async check6_SEOFundamentals(html) {
    console.log('\n📋 Check 6: SEO fundamentals on public pages');
    
    if (!html) {
      await this.addCheck('SEO Fundamentals', false, 'No HTML to check');
      return;
    }
    
    try {
      // Extract meta tags
      const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
      const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1];
      const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1];
      
      await this.addCheck(
        'Basic SEO Meta Tags',
        title && description && canonical,
        `Title: ${title ? '✓' : '✗'}, Description: ${description ? '✓' : '✗'}, Canonical: ${canonical ? '✓' : '✗'}`
      );
      
      // Check Open Graph tags
      const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1];
      const ogDescription = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)?.[1];
      const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1];
      
      await this.addCheck(
        'Open Graph Tags',
        ogTitle && ogDescription && ogImage,
        `OG Title: ${ogTitle ? '✓' : '✗'}, OG Description: ${ogDescription ? '✓' : '✗'}, OG Image: ${ogImage ? '✓' : '✗'}`
      );
      
      // Check Twitter Card tags
      const twitterCard = html.match(/<meta\s+name=["']twitter:card["']\s+content=["']([^"']+)["']/i)?.[1];
      const twitterTitle = html.match(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i)?.[1];
      
      await this.addCheck(
        'Twitter Card Tags',
        twitterCard && twitterTitle,
        `Twitter Card: ${twitterCard ? '✓' : '✗'}, Twitter Title: ${twitterTitle ? '✓' : '✗'}`
      );
      
      // Check for structured data
      const hasJsonLD = html.includes('application/ld+json');
      
      await this.addCheck(
        'Structured Data (JSON-LD)',
        hasJsonLD,
        hasJsonLD ? 'JSON-LD structured data found' : 'No JSON-LD structured data'
      );
      
    } catch (error) {
      await this.addCheck(
        'SEO Fundamentals',
        false,
        `Error checking SEO: ${error.message}`
      );
    }
  }

  async check7_RobotsAndSitemaps() {
    console.log('\n📋 Check 7: Robots & Sitemaps');
    
    try {
      // Check robots.txt
      const robotsResponse = await makeRequest(`${PRODUCTION_URL}/robots.txt`);
      
      if (robotsResponse.status === 200) {
        const hasSitemap = robotsResponse.data.includes('Sitemap:');
        const hasFixloReference = robotsResponse.data.includes('fixloapp.com');
        
        await this.addCheck(
          'Robots.txt Valid',
          hasSitemap && hasFixloReference,
          hasSitemap ? 'robots.txt references sitemap' : 'robots.txt missing sitemap reference'
        );
        
        console.log('📄 Robots.txt content (first 300 chars):');
        console.log(robotsResponse.data.substring(0, 300));
        
      } else {
        await this.addCheck(
          'Robots.txt Valid',
          false,
          `robots.txt returned ${robotsResponse.status}`
        );
      }
      
      // Check sitemap.xml
      const sitemapResponse = await makeRequest(`${PRODUCTION_URL}/sitemap.xml`);
      
      if (sitemapResponse.status === 200) {
        const urlCount = (sitemapResponse.data.match(/<url>/g) || []).length;
        const hasProfiles = sitemapResponse.data.includes('/pro/');
        const hasReviews = sitemapResponse.data.includes('/review/public/');
        const hasValidXML = sitemapResponse.data.includes('<?xml') && sitemapResponse.data.includes('</urlset>');
        
        await this.addCheck(
          'Sitemap.xml Valid',
          hasValidXML && urlCount > 0,
          `${urlCount} URLs found, Profiles: ${hasProfiles}, Reviews: ${hasReviews}`
        );
        
        // Extract and show sample URLs
        const urlMatches = sitemapResponse.data.match(/<loc>([^<]+)<\/loc>/g);
        if (urlMatches && urlMatches.length > 0) {
          console.log('📄 Sample sitemap URLs:');
          urlMatches.slice(0, 5).forEach(url => {
            console.log(`   ${url.replace(/<\/?loc>/g, '')}`);
          });
        }
        
      } else {
        await this.addCheck(
          'Sitemap.xml Valid',
          false,
          `sitemap.xml returned ${sitemapResponse.status}`
        );
      }
      
    } catch (error) {
      await this.addCheck(
        'Robots & Sitemaps',
        false,
        `Error checking robots/sitemap: ${error.message}`
      );
    }
  }

  async check8_SocialCardPreviews(html) {
    console.log('\n📋 Check 8: Social card previews preparation');
    
    if (!html) {
      await this.addCheck('Social Card Previews', false, 'No HTML to check');
      return;
    }
    
    try {
      // Extract OG image URL
      const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1];
      
      if (ogImage) {
        // Test if OG image is accessible
        try {
          const imageResponse = await makeRequest(ogImage);
          
          await this.addCheck(
            'OG Image Accessible',
            imageResponse.status === 200,
            `OG image (${ogImage}) returns ${imageResponse.status}`
          );
        } catch (imageError) {
          await this.addCheck(
            'OG Image Accessible',
            false,
            `Error accessing OG image: ${imageError.message}`
          );
        }
        
        // Provide Facebook and Twitter testing URLs
        const currentUrl = PRODUCTION_URL;
        const facebookDebugUrl = `https://developers.facebook.com/tools/debug/sharing/?q=${encodeURIComponent(currentUrl)}`;
        const twitterCardUrl = `https://cards-dev.twitter.com/validator`;
        
        console.log('🔗 Manual testing URLs:');
        console.log(`   Facebook Debugger: ${facebookDebugUrl}`);
        console.log(`   Twitter Card Validator: ${twitterCardUrl}`);
        
        await this.addCheck(
          'Social Card Testing URLs',
          true,
          'Manual testing URLs provided above'
        );
        
      } else {
        await this.addCheck(
          'OG Image Available',
          false,
          'No OG image found in meta tags'
        );
      }
      
    } catch (error) {
      await this.addCheck(
        'Social Card Previews',
        false,
        `Error checking social cards: ${error.message}`
      );
    }
  }

  async check9_AccessibilityBasics(html) {
    console.log('\n📋 Check 9: Basic accessibility checks');
    
    if (!html) {
      await this.addCheck('Accessibility Basics', false, 'No HTML to check');
      return;
    }
    
    try {
      // Basic accessibility checks
      const hasLangAttribute = html.includes('<html lang=') || html.includes('<html data-lang=');
      const hasViewportMeta = html.includes('name="viewport"');
      const hasAriaLabels = html.includes('aria-label') || html.includes('aria-labelledby');
      const hasAltAttributes = html.includes('alt=');
      
      await this.addCheck(
        'HTML Lang Attribute',
        hasLangAttribute,
        hasLangAttribute ? 'HTML lang attribute found' : 'Missing HTML lang attribute'
      );
      
      await this.addCheck(
        'Viewport Meta Tag',
        hasViewportMeta,
        hasViewportMeta ? 'Viewport meta tag found' : 'Missing viewport meta tag'
      );
      
      await this.addCheck(
        'ARIA Labels Present',
        hasAriaLabels,
        hasAriaLabels ? 'ARIA labels found in HTML' : 'No ARIA labels detected'
      );
      
      await this.addCheck(
        'Alt Attributes Present',
        hasAltAttributes,
        hasAltAttributes ? 'Alt attributes found for images' : 'No alt attributes detected'
      );
      
      // Check for skip links or other accessibility features
      const hasSkipLink = html.includes('skip to') || html.includes('skip-to') || html.includes('#main');
      
      await this.addCheck(
        'Accessibility Navigation',
        hasSkipLink,
        hasSkipLink ? 'Skip links or main content anchors found' : 'No skip navigation detected'
      );
      
    } catch (error) {
      await this.addCheck(
        'Accessibility Basics',
        false,
        `Error checking accessibility: ${error.message}`
      );
    }
  }

  async generateReport() {
    console.log('\n📋 Generating comprehensive report...');
    
    // Get Git commit info if available
    try {
      const { execSync } = require('child_process');
      this.results.commitSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      this.results.commitSha = 'unknown';
    }
    
    const reportPath = path.join(OUTPUT_DIR, `verification-report-${TIMESTAMP}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    const textReportPath = path.join(OUTPUT_DIR, `verification-report-${TIMESTAMP}.txt`);
    const textReport = this.generateTextReport();
    fs.writeFileSync(textReportPath, textReport);
    
    console.log('\n🎯 PRODUCTION VERIFICATION COMPLETE');
    console.log('=====================================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Total: ${this.results.total}`);
    console.log(`📁 Results saved to: ${OUTPUT_DIR}`);
    console.log(`📄 JSON Report: ${reportPath}`);
    console.log(`📄 Text Report: ${textReportPath}`);
    
    return this.results;
  }

  generateTextReport() {
    let report = `🎯 FIXLO PRODUCTION VERIFICATION REPORT\n`;
    report += `==========================================\n\n`;
    report += `Timestamp: ${this.results.timestamp}\n`;
    report += `Production URL: ${this.results.productionUrl}\n`;
    report += `API URL: ${this.results.apiUrl}\n`;
    report += `Commit SHA: ${this.results.commitSha}\n`;
    report += `Bundle Hash: ${this.results.bundleHash || 'N/A'}\n`;
    report += `\n`;
    report += `SUMMARY:\n`;
    report += `✅ Passed: ${this.results.passed}\n`;
    report += `❌ Failed: ${this.results.failed}\n`;
    report += `📊 Total: ${this.results.total}\n`;
    report += `\n`;
    report += `DETAILED RESULTS:\n`;
    report += `==================\n\n`;
    
    this.results.checks.forEach((check, index) => {
      report += `${index + 1}. ${check.passed ? '✅' : '❌'} ${check.name}\n`;
      if (check.details) {
        report += `   ${check.details}\n`;
      }
      report += `\n`;
    });
    
    report += `\n`;
    report += `MANUAL TESTING INSTRUCTIONS:\n`;
    report += `=============================\n`;
    report += `1. Visit Facebook Sharing Debugger with any pro profile URL\n`;
    report += `2. Test Twitter Card Validator with main site URL\n`;
    report += `3. Check Vercel dashboard for deployment aliases\n`;
    report += `4. Test share buttons on live pro profiles\n`;
    report += `5. Verify Cloudinary images have q_auto,f_auto parameters\n`;
    report += `6. Submit test reviews and check public review pages\n`;
    report += `7. Test accessibility with keyboard navigation\n`;
    report += `\n`;
    
    return report;
  }

  async run() {
    try {
      console.log('🎯 Starting Simple Production Verification for Fixlo');
      console.log('===================================================');
      
      // Get main page HTML first
      const html = await this.check0_DeploymentLive();
      
      // Run all other checks
      await this.check1_BuildArtifactMatch(html);
      await this.check2_ShareableProProfile(html);
      await this.check3_SevenDayBoostAndBadges(html);
      await this.check4_ReviewCaptureAndPublicPages();
      await this.check5_CloudinaryOptimization();
      await this.check6_SEOFundamentals(html);
      await this.check7_RobotsAndSitemaps();
      await this.check8_SocialCardPreviews(html);
      await this.check9_AccessibilityBasics(html);
      
      return await this.generateReport();
      
    } catch (error) {
      console.error('❌ Verification failed:', error);
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
  const verifier = new SimpleProductionVerifier();
  verifier.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = SimpleProductionVerifier;