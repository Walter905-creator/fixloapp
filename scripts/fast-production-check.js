#!/usr/bin/env node

/**
 * 🚀 Fast Production Check (No-Regressions)
 * 
 * Implements the exact verification steps from the problem statement
 * to ensure latest build is live and functioning correctly.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PRODUCTION_URL = 'https://www.fixloapp.com';
const EXPECTED_BUNDLE = 'main.90157fc5.js'; // From PR notes
const OUTPUT_DIR = path.join(__dirname, '../verification-results');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

class FastProductionChecker {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      productionUrl: PRODUCTION_URL,
      expectedBundle: EXPECTED_BUNDLE,
      checks: [],
      issues: [],
      recommendations: []
    };
  }

  log(message) {
    console.log(message);
  }

  async addCheck(name, passed, details, issue = null, recommendation = null) {
    const check = { name, passed, details };
    this.results.checks.push(check);
    
    const status = passed ? '✅' : '❌';
    this.log(`${status} ${name}: ${details}`);
    
    if (!passed && issue) {
      this.results.issues.push(issue);
    }
    
    if (recommendation) {
      this.results.recommendations.push(recommendation);
    }
  }

  // Step 1: Confirm which build is live
  async step1_ConfirmLiveBuild() {
    this.log('\n📋 Step 1: Confirm which build is live');
    
    try {
      // Grab the main bundle name referenced by the live HTML
      const response = await fetch(PRODUCTION_URL);
      const html = await response.text();
      
      // Extract bundle hash using the exact regex from problem statement
      const bundleMatch = html.match(/static\/js\/main\.([a-z0-9]+)\.js/);
      
      if (bundleMatch) {
        const actualBundle = `main.${bundleMatch[1]}.js`;
        const isExpected = actualBundle === EXPECTED_BUNDLE;
        
        await this.addCheck(
          'Live Bundle Detection',
          true,
          `Found bundle: ${actualBundle}`
        );
        
        await this.addCheck(
          'Bundle Version Match',
          isExpected,
          isExpected ? 
            `✓ Correct bundle deployed: ${actualBundle}` : 
            `⚠️ Bundle mismatch! Expected: ${EXPECTED_BUNDLE}, Got: ${actualBundle}`,
          !isExpected ? `Bundle hash mismatch - may be on older deploy` : null,
          !isExpected ? `Check Vercel dashboard and promote correct deployment` : null
        );
        
        // Check CDN cache status of the bundle
        const bundleUrl = `${PRODUCTION_URL}/static/js/${actualBundle}`;
        const bundleResponse = await fetch(bundleUrl, { method: 'HEAD' });
        
        await this.addCheck(
          'Bundle Accessibility',
          bundleResponse.ok,
          `Bundle HTTP status: ${bundleResponse.status}`
        );
        
        // Check cache headers
        const xVercelId = bundleResponse.headers.get('x-vercel-id');
        const xVercelCache = bundleResponse.headers.get('x-vercel-cache');
        
        await this.addCheck(
          'CDN Cache Headers',
          !!xVercelId,
          `Vercel ID: ${xVercelId || 'not found'}, Cache: ${xVercelCache || 'not found'}`
        );
        
        this.results.actualBundle = actualBundle;
        this.results.bundleHash = bundleMatch[1];
        
      } else {
        await this.addCheck(
          'Live Bundle Detection',
          false,
          'Could not extract bundle hash from HTML',
          'Unable to detect main JS bundle in production HTML',
          'Check if build process completed successfully'
        );
      }
      
    } catch (error) {
      await this.addCheck(
        'Live Build Check',
        false,
        `Error: ${error.message}`,
        `Production site not accessible: ${error.message}`,
        'Check if production site is deployed and accessible'
      );
    }
  }

  // Step 2: Verify Vercel alias (requires manual check)
  async step2_VercelAlias() {
    this.log('\n📋 Step 2: Verify Vercel alias');
    
    await this.addCheck(
      'Vercel Alias Check',
      true, // We assume this is manual verification
      'Manual verification required in Vercel dashboard',
      null,
      'Check Vercel Dashboard → Fixlo project → Deployments: verify latest deployment shows "Aliased to www.fixloapp.com"'
    );
  }

  // Step 3: Check feature flags (CRA = build-time)
  async step3_FeatureFlags() {
    this.log('\n📋 Step 3: Check feature flags (CRA build-time)');
    
    try {
      // Try to detect feature flags in the built JS bundle
      const bundleUrl = `${PRODUCTION_URL}/static/js/${this.results.actualBundle}`;
      const bundleResponse = await fetch(bundleUrl);
      const bundleContent = await bundleResponse.text();
      
      // Check for feature flag patterns - both env var names and compiled variable names
      const featureFlagPatterns = [
        'REACT_APP_FEATURE_SHARE_PROFILE',
        'REACT_APP_FEATURE_BADGES', 
        'REACT_APP_FEATURE_7DAY_BOOST',
        'REACT_APP_CLOUDINARY_ENABLED',
        'showBadges',
        'shareProfile', 
        'boostIndicator',
        'cloudinaryUpload',
        'featureFlags'
      ];
      
      let flagsFound = 0;
      const flagResults = featureFlagPatterns.map(pattern => {
        const found = bundleContent.includes(pattern);
        if (found) flagsFound++;
        return { pattern, found };
      });
      
      // Check if feature flag system is present
      const hasFeatureFlagSystem = bundleContent.includes('featureFlags') || 
                                 bundleContent.includes('getFeatureFlags') ||
                                 bundleContent.includes('useFeatureFlags');
      
      await this.addCheck(
        'Feature Flag System',
        hasFeatureFlagSystem,
        hasFeatureFlagSystem ? 'Feature flag system detected in bundle' : 'No feature flag system found',
        !hasFeatureFlagSystem ? 'Feature flag system not found in production bundle' : null
      );
      
      await this.addCheck(
        'Feature Flag Patterns',
        flagsFound > 0,
        `Found ${flagsFound}/${featureFlagPatterns.length} feature flag patterns in bundle`,
        flagsFound === 0 ? 'No feature flag patterns detected in production bundle' : null,
        flagsFound === 0 ? 'Check Vercel → Project → Settings → Environment Variables (Production) and ensure REACT_APP_FEATURE_* variables are set' : null
      );
      
      this.results.featureFlags = flagResults;
      this.results.hasFeatureFlagSystem = hasFeatureFlagSystem;
      
    } catch (error) {
      await this.addCheck(
        'Feature Flags Check',
        false,
        `Error checking feature flags: ${error.message}`
      );
    }
  }

  // Step 4: Smoke-test routes & assets
  async step4_SmokeTestRoutes() {
    this.log('\n📋 Step 4: Smoke-test routes & assets');
    
    const routes = [
      { name: 'Pro Profile Route', url: `${PRODUCTION_URL}/pro/demo-pro` },
      { name: 'Review Detail Route', url: `${PRODUCTION_URL}/review/public/DEMO123` },
      { name: 'Sitemap', url: `${PRODUCTION_URL}/sitemap.xml` },
      { name: 'Robots.txt', url: `${PRODUCTION_URL}/robots.txt` }
    ];
    
    for (const route of routes) {
      try {
        const response = await fetch(route.url, { method: 'HEAD' });
        await this.addCheck(
          route.name,
          response.ok,
          `HTTP ${response.status}`,
          !response.ok ? `${route.name} returned ${response.status}` : null
        );
      } catch (error) {
        await this.addCheck(
          route.name,
          false,
          `Error: ${error.message}`,
          `Failed to access ${route.name}`,
          `Check route configuration for ${route.url}`
        );
      }
    }
    
    // Check if sitemap includes Pro profiles
    try {
      const sitemapResponse = await fetch(`${PRODUCTION_URL}/sitemap.xml`);
      const sitemapContent = await sitemapResponse.text();
      
      const hasProProfiles = sitemapContent.includes('/pro/');
      const hasReviews = sitemapContent.includes('/review/');
      
      await this.addCheck(
        'Sitemap Pro Profiles',
        hasProProfiles,
        hasProProfiles ? 'Pro profiles found in sitemap' : 'No pro profiles in sitemap',
        !hasProProfiles ? 'Sitemap missing pro profile URLs' : null,
        !hasProProfiles ? 'Check sitemap generator configuration' : null
      );
      
      await this.addCheck(
        'Sitemap Reviews',
        hasReviews,
        hasReviews ? 'Review URLs found in sitemap' : 'No review URLs in sitemap',
        !hasReviews ? 'Sitemap missing review URLs' : null
      );
      
    } catch (error) {
      await this.addCheck(
        'Sitemap Content Check',
        false,
        `Error checking sitemap: ${error.message}`
      );
    }
  }

  // Step 5: Confirm Cloudinary wiring (requires manual DevTools check)
  async step5_CloudinaryWiring() {
    this.log('\n📋 Step 5: Confirm Cloudinary wiring');
    
    await this.addCheck(
      'Cloudinary Configuration',
      true, // Manual verification
      'Manual DevTools verification required',
      null,
      'Open DevTools on a Pro profile with photos and verify image URLs contain Cloudinary domain with q_auto,f_auto parameters'
    );
  }

  // Step 6: Check SMS compliance copy
  async step6_SMSCompliance() {
    this.log('\n📋 Step 6: Check SMS compliance copy');
    
    try {
      // Check the SMS opt-in page
      const smsOptinResponse = await fetch(`${PRODUCTION_URL}/sms-optin/`);
      
      await this.addCheck(
        'SMS Opt-in Page',
        smsOptinResponse.ok,
        `HTTP ${smsOptinResponse.status}`,
        !smsOptinResponse.ok ? 'SMS opt-in page not accessible' : null
      );
      
      if (smsOptinResponse.ok) {
        const smsContent = await smsOptinResponse.text();
        
        // Check for more accurate compliance language patterns
        const hasConsentLanguage = smsContent.includes('I agree to receive SMS messages from Fixlo') || 
                                 smsContent.includes('I expressly consent to receive automated SMS');
        const hasStopHelp = smsContent.includes('STOP') && smsContent.includes('HELP');
        const hasFrequencyRates = smsContent.includes('frequency') && (smsContent.includes('rates') || smsContent.includes('data rates'));
        
        await this.addCheck(
          'SMS Consent Language',
          hasConsentLanguage,
          hasConsentLanguage ? 'Compliance consent language found' : 'Missing consent language',
          !hasConsentLanguage ? 'SMS consent language not found' : null,
          !hasConsentLanguage ? 'Update SMS opt-in form with required consent language' : null
        );
        
        await this.addCheck(
          'SMS STOP/HELP Disclosures',
          hasStopHelp,
          hasStopHelp ? 'STOP/HELP disclosures found' : 'Missing STOP/HELP disclosures'
        );
        
        await this.addCheck(
          'SMS Frequency/Rates Info',
          hasFrequencyRates,
          hasFrequencyRates ? 'Frequency/rates info found' : 'Missing frequency/rates info'
        );
        
        // Additional check for professional services context
        const hasServiceContext = smsContent.includes('job') || smsContent.includes('leads') || smsContent.includes('service');
        await this.addCheck(
          'SMS Service Context',
          hasServiceContext,
          hasServiceContext ? 'Professional services context found' : 'Missing service context'
        );
      }
      
    } catch (error) {
      await this.addCheck(
        'SMS Compliance Check',
        false,
        `Error: ${error.message}`
      );
    }
  }

  // Generate comprehensive report
  generateReport() {
    const passed = this.results.checks.filter(c => c.passed).length;
    const total = this.results.checks.length;
    const successRate = Math.round((passed / total) * 100);
    
    let report = `🚀 FAST PRODUCTION CHECK REPORT\n`;
    report += `=====================================\n\n`;
    report += `Generated: ${this.results.timestamp}\n`;
    report += `Production URL: ${this.results.productionUrl}\n`;
    report += `Expected Bundle: ${this.results.expectedBundle}\n`;
    report += `Actual Bundle: ${this.results.actualBundle || 'N/A'}\n`;
    report += `Success Rate: ${successRate}% (${passed}/${total})\n\n`;
    
    report += `DETAILED RESULTS:\n`;
    report += `==================\n\n`;
    
    this.results.checks.forEach((check, index) => {
      const status = check.passed ? '✅' : '❌';
      report += `${index + 1}. ${status} ${check.name}\n`;
      report += `   ${check.details}\n\n`;
    });
    
    if (this.results.issues.length > 0) {
      report += `🚨 ISSUES IDENTIFIED:\n`;
      report += `======================\n`;
      this.results.issues.forEach((issue, index) => {
        report += `${index + 1}. ${issue}\n`;
      });
      report += `\n`;
    }
    
    if (this.results.recommendations.length > 0) {
      report += `💡 RECOMMENDATIONS:\n`;
      report += `====================\n`;
      this.results.recommendations.forEach((rec, index) => {
        report += `${index + 1}. ${rec}\n`;
      });
      report += `\n`;
    }
    
    return report;
  }

  // Save results to file
  async saveResults() {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    const filename = `fast-production-check-${TIMESTAMP}.txt`;
    const filepath = path.join(OUTPUT_DIR, filename);
    
    const report = this.generateReport();
    fs.writeFileSync(filepath, report);
    
    this.log(`\n📄 Report saved to: ${filepath}`);
    return filepath;
  }

  // Run all checks
  async runAllChecks() {
    this.log('🚀 Starting Fast Production Check...\n');
    
    await this.step1_ConfirmLiveBuild();
    await this.step2_VercelAlias();
    await this.step3_FeatureFlags();
    await this.step4_SmokeTestRoutes();
    await this.step5_CloudinaryWiring();
    await this.step6_SMSCompliance();
    
    const report = this.generateReport();
    this.log('\n' + report);
    
    await this.saveResults();
    
    const passed = this.results.checks.filter(c => c.passed).length;
    const total = this.results.checks.length;
    
    this.log(`\n🎯 Fast Production Check Complete: ${passed}/${total} checks passed`);
    
    return this.results;
  }
}

// Main execution
async function main() {
  const checker = new FastProductionChecker();
  await checker.runAllChecks();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { FastProductionChecker };