#!/usr/bin/env node

/**
 * Sitemap Optimization Verification Script
 * 
 * This script verifies that the sitemap has been optimized to contain
 * only actual pages with unique content (17 URLs) instead of the
 * previous bloated version (4,232 URLs) that caused GSC indexing issues.
 */

const fs = require('fs');
const path = require('path');

// Expected URLs in optimized sitemap
const EXPECTED_URLS = [
  'https://www.fixloapp.com/',
  'https://www.fixloapp.com/how-it-works',
  'https://www.fixloapp.com/contact',
  'https://www.fixloapp.com/signup',
  'https://www.fixloapp.com/pro/signup',
  'https://www.fixloapp.com/ai-assistant',
  'https://www.fixloapp.com/terms',
  'https://www.fixloapp.com/services',
  'https://www.fixloapp.com/services/plumbing',
  'https://www.fixloapp.com/services/electrical',
  'https://www.fixloapp.com/services/hvac',
  'https://www.fixloapp.com/services/carpentry',
  'https://www.fixloapp.com/services/painting',
  'https://www.fixloapp.com/services/roofing',
  'https://www.fixloapp.com/services/house-cleaning',
  'https://www.fixloapp.com/services/junk-removal',
  'https://www.fixloapp.com/services/landscaping'
];

const EXPECTED_URL_COUNT = 17;
const MAX_ACCEPTABLE_URLS = 25; // Allow some flexibility for future additions

console.log('🔍 Sitemap Optimization Verification');
console.log('=====================================\n');

let passed = 0;
let failed = 0;
let warnings = 0;

function checkSitemap(filePath, name) {
  console.log(`\n📄 Checking ${name}:`);
  console.log(`   Path: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log('   ❌ FAILED - Sitemap file not found');
    failed++;
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const urlMatches = content.match(/<loc>(.*?)<\/loc>/g);
  
  if (!urlMatches) {
    console.log('   ❌ FAILED - No URLs found in sitemap');
    failed++;
    return false;
  }
  
  const urlCount = urlMatches.length;
  const urls = urlMatches.map(match => match.replace(/<\/?loc>/g, ''));
  
  console.log(`   📊 URL Count: ${urlCount}`);
  
  // Check if sitemap is optimized (not bloated)
  if (urlCount > MAX_ACCEPTABLE_URLS) {
    console.log(`   ❌ FAILED - Sitemap is bloated (${urlCount} URLs > ${MAX_ACCEPTABLE_URLS} max)`);
    console.log(`   💡 Expected: ${EXPECTED_URL_COUNT} URLs for optimal SEO`);
    failed++;
    return false;
  }
  
  // Check if sitemap has expected URL count
  if (urlCount === EXPECTED_URL_COUNT) {
    console.log(`   ✅ PASSED - Optimal URL count (${urlCount} URLs)`);
    passed++;
  } else if (urlCount < MAX_ACCEPTABLE_URLS) {
    console.log(`   ⚠️  WARNING - Different URL count (${urlCount} vs expected ${EXPECTED_URL_COUNT})`);
    warnings++;
  }
  
  // Verify all expected URLs are present
  let missingUrls = [];
  let extraUrls = [];
  
  for (const expectedUrl of EXPECTED_URLS) {
    if (!urls.includes(expectedUrl)) {
      missingUrls.push(expectedUrl);
    }
  }
  
  for (const url of urls) {
    if (!EXPECTED_URLS.includes(url)) {
      extraUrls.push(url);
    }
  }
  
  if (missingUrls.length > 0) {
    console.log(`   ⚠️  WARNING - Missing expected URLs (${missingUrls.length}):`);
    missingUrls.forEach(url => console.log(`      - ${url}`));
    warnings++;
  }
  
  if (extraUrls.length > 0) {
    console.log(`   ℹ️  INFO - Additional URLs found (${extraUrls.length}):`);
    extraUrls.slice(0, 5).forEach(url => console.log(`      - ${url}`));
    if (extraUrls.length > 5) {
      console.log(`      ... and ${extraUrls.length - 5} more`);
    }
  }
  
  // Check for city-specific URLs (these cause duplicate content issues)
  const cityUrls = urls.filter(url => {
    const parts = url.split('/');
    return parts.length > 5 && parts[4] !== ''; // e.g., /services/plumbing/chicago
  });
  
  if (cityUrls.length > 0) {
    console.log(`   ❌ FAILED - Found ${cityUrls.length} city-specific URLs`);
    console.log(`   💡 City URLs cause duplicate content and soft 404 issues`);
    cityUrls.slice(0, 3).forEach(url => console.log(`      - ${url}`));
    if (cityUrls.length > 3) {
      console.log(`      ... and ${cityUrls.length - 3} more`);
    }
    failed++;
    return false;
  } else {
    console.log(`   ✅ PASSED - No city-specific URLs found`);
    passed++;
  }
  
  return true;
}

// Check root sitemap
const rootSitemap = path.join(__dirname, '..', 'sitemap.xml');
checkSitemap(rootSitemap, 'Root sitemap.xml');

// Check client/public sitemap
const clientSitemap = path.join(__dirname, '..', 'client', 'public', 'sitemap.xml');
checkSitemap(clientSitemap, 'client/public/sitemap.xml');

// Summary
console.log('\n📊 Verification Summary');
console.log('========================');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⚠️  Warnings: ${warnings}`);

if (failed === 0) {
  console.log('\n🎉 SUCCESS! Sitemap is optimized for Google Search Console.');
  console.log('\n📋 Expected Benefits:');
  console.log('   - Eliminate soft 404 errors');
  console.log('   - Reduce duplicate content issues by 80%+');
  console.log('   - Reduce "Crawled - currently not indexed" by 90%+');
  console.log('   - Improve crawl budget efficiency');
  console.log('   - Focus on 17 high-value pages instead of 4,232 thin pages');
  process.exit(0);
} else {
  console.log('\n❌ FAILED - Sitemap optimization needs attention.');
  console.log('\n🔧 To fix:');
  console.log('   1. Run: npm run generate-sitemap');
  console.log('   2. Verify: npm run verify-sitemap');
  console.log('   3. Deploy the changes to production');
  process.exit(1);
}
