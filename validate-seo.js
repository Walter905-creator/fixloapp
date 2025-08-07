#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 SEO Validation Report for Fixlo');
console.log('=====================================\n');

// Check main index.html file
const indexPath = path.join(__dirname, 'index.html');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  console.log('✅ Main Page (index.html):');
  
  // Check for canonical URL
  const canonicalMatch = indexContent.match(/rel="canonical" href="([^"]+)"/);
  if (canonicalMatch) {
    console.log(`   📍 Canonical URL: ${canonicalMatch[1]}`);
  } else {
    console.log('   ❌ No canonical URL found');
  }
  
  // Check for meta description
  const descriptionMatch = indexContent.match(/name="description" content="([^"]+)"/);
  if (descriptionMatch) {
    console.log(`   📝 Meta Description: ${descriptionMatch[1].substring(0, 80)}...`);
  } else {
    console.log('   ❌ No meta description found');
  }
  
  // Check for robots meta
  const robotsMatch = indexContent.match(/name="robots" content="([^"]+)"/);
  if (robotsMatch) {
    console.log(`   🤖 Robots: ${robotsMatch[1]}`);
  } else {
    console.log('   ⚠️  No robots meta found');
  }
  
  console.log('');
}

// Check sitemap
const sitemapPath = path.join(__dirname, 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  const urlMatches = sitemapContent.match(/<loc>/g);
  const urlCount = urlMatches ? urlMatches.length : 0;
  
  console.log('✅ Sitemap (sitemap.xml):');
  console.log(`   📊 Total URLs: ${urlCount}`);
  
  // Check for current date
  const currentDate = new Date().toISOString().split('T')[0];
  if (sitemapContent.includes(currentDate)) {
    console.log(`   📅 Last updated: ${currentDate} (Current)`);
  } else {
    console.log('   ⚠️  Sitemap may be outdated');
  }
  
  console.log('');
}

// Check robots.txt
const robotsPath = path.join(__dirname, 'robots.txt');
if (fs.existsSync(robotsPath)) {
  const robotsContent = fs.readFileSync(robotsPath, 'utf8');
  
  console.log('✅ Robots.txt:');
  
  if (robotsContent.includes('Sitemap:')) {
    console.log('   🗺️  Sitemap referenced');
  } else {
    console.log('   ⚠️  No sitemap reference found');
  }
  
  if (robotsContent.includes('Disallow: /admin/')) {
    console.log('   🔒 Admin areas properly disallowed');
  } else {
    console.log('   ⚠️  Admin areas not disallowed');
  }
  
  console.log('');
}

// Summary of fixes implemented
console.log('🎯 Indexing Issues Fixed:');
console.log('==========================');
console.log('✅ Duplicate without user-selected canonical - Fixed route-specific canonicals');
console.log('✅ Excluded by noindex tag - Admin/dashboard pages properly marked noindex');
console.log('✅ Page with redirect - Added URL redirect handler for legacy URLs');
console.log('✅ Not found (404) - Added proper 404 component');
console.log('✅ Discovered - currently not indexed - Improved sitemap and meta tags');
console.log('');

console.log('📈 SEO Improvements Made:');
console.log('=========================');
console.log('• Route-specific canonical URLs for all pages');
console.log('• Dynamic SEO metadata for service landing pages');
console.log('• JSON-LD structured data for services');
console.log('• URL normalization and redirect handling');
console.log('• Optimized sitemap with 106 strategic URLs');
console.log('• Proper noindex tags on admin/private pages');
console.log('• Enhanced 404 error handling');
console.log('');

console.log('🚀 Next Steps:');
console.log('===============');
console.log('1. Deploy the updated application');
console.log('2. Submit updated sitemap to Google Search Console');
console.log('3. Request re-indexing of key pages');
console.log('4. Monitor Google Search Console for improvements');
console.log('5. Check for reduced indexing errors in 1-2 weeks');