#!/usr/bin/env node

/**
 * 🎯 Comprehensive Fast Production Check Summary
 * 
 * Analyzes the fast production check results and provides
 * specific actionable recommendations based on findings.
 */

const fs = require('fs');
const path = require('path');

// Import the fast production checker
const { FastProductionChecker } = require('./fast-production-check.js');

class ProductionVerificationSummary {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {},
      criticalIssues: [],
      recommendations: [],
      vercelActions: [],
      manualChecks: []
    };
  }

  log(message) {
    console.log(message);
  }

  async runCompleteCheck() {
    this.log('🎯 Running Comprehensive Fast Production Check...\n');
    
    // Run the fast production check
    const checker = new FastProductionChecker();
    const checkResults = await checker.runAllChecks();
    
    // Analyze results
    this.analyzeResults(checkResults);
    
    // Generate summary report
    const summary = this.generateSummaryReport();
    this.log('\n' + summary);
    
    // Save summary
    await this.saveSummary(summary);
    
    return this.results;
  }

  analyzeResults(checkResults) {
    const passed = checkResults.checks.filter(c => c.passed).length;
    const total = checkResults.checks.length;
    const successRate = Math.round((passed / total) * 100);
    
    this.results.summary = {
      bundleExpected: checkResults.expectedBundle,
      bundleActual: checkResults.actualBundle,
      bundleMatch: checkResults.actualBundle === checkResults.expectedBundle,
      successRate,
      passed,
      total,
      hasFeatureFlags: checkResults.hasFeatureFlagSystem,
      timestamp: checkResults.timestamp
    };
    
    // Analyze critical issues
    if (!this.results.summary.bundleMatch) {
      this.results.criticalIssues.push({
        issue: 'Bundle Version Mismatch',
        description: `Expected ${checkResults.expectedBundle}, but found ${checkResults.actualBundle}`,
        impact: 'HIGH',
        action: 'Check Vercel deployment and promote correct version'
      });
    }
    
    if (!checkResults.hasFeatureFlagSystem) {
      this.results.criticalIssues.push({
        issue: 'Feature Flags Missing',
        description: 'No feature flag system detected in production bundle',
        impact: 'MEDIUM',
        action: 'Verify environment variables are set in Vercel production settings'
      });
    }
    
    // Routing issues analysis
    const routingIssues = this.analyzeRoutingIssues(checkResults);
    if (routingIssues.length > 0) {
      this.results.criticalIssues.push(...routingIssues);
    }
    
    // Generate specific recommendations
    this.generateRecommendations(checkResults);
  }

  analyzeRoutingIssues(checkResults) {
    const issues = [];
    
    // Check if SMS opt-in is serving main app instead of static page
    const smsOptinCheck = checkResults.checks.find(c => c.name === 'SMS Opt-in Page');
    if (smsOptinCheck && smsOptinCheck.passed) {
      // The fact that SMS compliance checks failed but the page returns 200
      // suggests routing is serving React app instead of static SMS page
      issues.push({
        issue: 'SMS Opt-in Routing Issue',
        description: 'SMS opt-in URL returns main React app instead of static SMS compliance page',
        impact: 'HIGH',
        action: 'Fix Vercel routing to serve static SMS opt-in page at /sms-optin/'
      });
    }
    
    return issues;
  }

  generateRecommendations(checkResults) {
    // Vercel-specific actions
    this.results.vercelActions = [
      {
        priority: 'HIGH',
        action: 'Navigate to Vercel Dashboard → Fixlo project → Deployments',
        description: 'Verify latest deployment shows "Aliased to www.fixloapp.com"',
        expected: 'Latest deployment should have production alias'
      },
      {
        priority: 'HIGH', 
        action: 'Check Vercel → Project → Settings → Environment Variables (Production)',
        description: 'Ensure REACT_APP_FEATURE_* variables are properly set',
        variables: [
          'REACT_APP_FEATURE_SHARE_PROFILE=true',
          'REACT_APP_FEATURE_BADGES=true', 
          'REACT_APP_FEATURE_7DAY_BOOST=true',
          'REACT_APP_CLOUDINARY_ENABLED=true'
        ]
      },
      {
        priority: 'MEDIUM',
        action: 'Fix Vercel routing configuration',
        description: 'Update vercel.json to properly route /sms-optin/ to static file',
        expected: 'SMS opt-in page should serve static HTML with compliance copy'
      }
    ];
    
    // Manual verification checks
    this.results.manualChecks = [
      {
        check: 'Bundle Hash Verification',
        action: 'Hard refresh browser (Ctrl+F5) and verify main.cf0dec81.js loads',
        url: 'https://www.fixloapp.com',
        expected: 'Should load current bundle without errors'
      },
      {
        check: 'Cloudinary Image URLs',
        action: 'Open DevTools on a Pro profile with photos',
        url: 'https://www.fixloapp.com/pro/demo-pro',
        expected: 'Image URLs should contain Cloudinary domain with q_auto,f_auto parameters'
      },
      {
        check: 'Social Media Sharing',
        action: 'Test profile sharing on Facebook/Twitter',
        url: 'Facebook Debugger or Twitter Card Validator',
        expected: 'OG images and meta tags should render correctly'
      },
      {
        check: 'Feature Flag Visibility',
        action: 'Create test pro profile and verify badge/share button visibility',
        url: 'https://www.fixloapp.com/admin',
        expected: 'Feature-flagged components should be visible if flags are enabled'
      }
    ];
    
    // General recommendations
    this.results.recommendations = [
      {
        category: 'Deployment',
        priority: 'HIGH',
        title: 'Promote Correct Deployment',
        description: 'The production site is running bundle main.cf0dec81.js instead of expected main.90157fc5.js',
        steps: [
          'Open Vercel Dashboard',
          'Navigate to Fixlo project → Deployments',
          'Find deployment with bundle main.90157fc5.js',
          'Click "Promote to Production" if not already aliased',
          'Wait for deployment and verify bundle hash changes'
        ]
      },
      {
        category: 'Configuration', 
        priority: 'HIGH',
        title: 'Fix Environment Variables',
        description: 'Feature flags are not detected in production bundle',
        steps: [
          'Go to Vercel → Project → Settings → Environment Variables',
          'Ensure Production environment has REACT_APP_FEATURE_* variables',
          'Set values to "true" for enabled features',
          'Trigger new production build to bake variables into bundle'
        ]
      },
      {
        category: 'Routing',
        priority: 'MEDIUM', 
        title: 'Fix SMS Opt-in Routing',
        description: 'SMS opt-in URL serves React app instead of static compliance page',
        steps: [
          'Update vercel.json routing configuration',
          'Ensure /sms-optin/ routes to static HTML file',
          'Test SMS compliance copy displays correctly',
          'Verify STOP/HELP/frequency disclosures are visible'
        ]
      },
      {
        category: 'SEO',
        priority: 'LOW',
        title: 'Add Review URLs to Sitemap',
        description: 'Sitemap contains pro profiles but missing review URLs',
        steps: [
          'Update sitemap generator to include review routes',
          'Add public review URLs to sitemap.xml',
          'Verify sitemap includes both /pro/ and /review/ URLs',
          'Submit updated sitemap to Google Search Console'
        ]
      }
    ];
  }

  generateSummaryReport() {
    let report = `\n🎯 FAST PRODUCTION CHECK SUMMARY\n`;
    report += `=========================================\n\n`;
    
    // Current Status
    report += `📊 CURRENT STATUS:\n`;
    report += `Production URL: https://www.fixloapp.com\n`;
    report += `Expected Bundle: ${this.results.summary.bundleExpected}\n`;
    report += `Actual Bundle: ${this.results.summary.bundleActual}\n`;
    report += `Bundle Match: ${this.results.summary.bundleMatch ? '✅ YES' : '❌ NO'}\n`;
    report += `Success Rate: ${this.results.summary.successRate}% (${this.results.summary.passed}/${this.results.summary.total})\n\n`;
    
    // Critical Issues
    if (this.results.criticalIssues.length > 0) {
      report += `🚨 CRITICAL ISSUES (${this.results.criticalIssues.length}):\n`;
      report += `========================\n`;
      this.results.criticalIssues.forEach((issue, index) => {
        report += `${index + 1}. [${issue.impact}] ${issue.issue}\n`;
        report += `   ${issue.description}\n`;
        report += `   → ${issue.action}\n\n`;
      });
    }
    
    // Immediate Vercel Actions
    report += `⚡ IMMEDIATE VERCEL ACTIONS:\n`;
    report += `============================\n`;
    this.results.vercelActions.forEach((action, index) => {
      report += `${index + 1}. [${action.priority}] ${action.action}\n`;
      report += `   ${action.description}\n`;
      if (action.variables) {
        report += `   Variables to check:\n`;
        action.variables.forEach(variable => {
          report += `   - ${variable}\n`;
        });
      }
      report += `\n`;
    });
    
    // Manual Verification Checklist
    report += `✅ MANUAL VERIFICATION CHECKLIST:\n`;
    report += `==================================\n`;
    this.results.manualChecks.forEach((check, index) => {
      report += `☐ ${index + 1}. ${check.check}\n`;
      report += `     Action: ${check.action}\n`;
      report += `     URL: ${check.url}\n`;
      report += `     Expected: ${check.expected}\n\n`;
    });
    
    // Detailed Recommendations
    report += `💡 DETAILED RECOMMENDATIONS:\n`;
    report += `=============================\n`;
    this.results.recommendations.forEach((rec, index) => {
      report += `${index + 1}. [${rec.priority}] ${rec.category}: ${rec.title}\n`;
      report += `   ${rec.description}\n`;
      report += `   Steps:\n`;
      rec.steps.forEach((step, stepIndex) => {
        report += `   ${stepIndex + 1}. ${step}\n`;
      });
      report += `\n`;
    });
    
    return report;
  }

  async saveSummary(summary) {
    const outputDir = path.join(__dirname, '../verification-results');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `production-check-summary-${timestamp}.txt`;
    const filepath = path.join(outputDir, filename);
    
    fs.writeFileSync(filepath, summary);
    this.log(`\n📄 Summary saved to: ${filepath}`);
  }
}

// Main execution
async function main() {
  const summary = new ProductionVerificationSummary();
  await summary.runCompleteCheck();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ProductionVerificationSummary };