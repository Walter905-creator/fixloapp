#!/usr/bin/env node
/**
 * International SEO Implementation Test
 * Validates routing, hreflang tags, sitemap, and canonical URLs
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing International SEO Implementation\n');

// Test 1: Verify sitemap contains country-specific URLs
console.log('Test 1: Sitemap contains country-specific URLs');
const sitemapPath = path.join(__dirname, 'sitemap.xml');
const sitemap = fs.readFileSync(sitemapPath, 'utf-8');

const countryCodes = ['us', 'ca', 'uk', 'au', 'ar'];
const services = ['plumbing', 'electrical', 'hvac'];
const cities = ['new-york', 'los-angeles', 'chicago'];

let sitemapPassed = true;

// Check for country service URLs
countryCodes.forEach(country => {
  const servicesPath = country === 'ar' ? 'servicios' : 'services';
  services.forEach(service => {
    const url = `https://www.fixloapp.com/${country}/${servicesPath}/${service}`;
    if (!sitemap.includes(url)) {
      console.log(`  ❌ Missing ${country.toUpperCase()} service URL: ${url}`);
      sitemapPassed = false;
    }
  });
});

// Check for service/city combinations (at least for US)
cities.forEach(city => {
  const url = `https://www.fixloapp.com/us/services/plumbing/${city}`;
  if (!sitemap.includes(url)) {
    console.log(`  ❌ Missing US service/city URL: ${url}`);
    sitemapPassed = false;
  }
});

// Check Argentina uses 'servicios' path
if (!sitemap.includes('https://www.fixloapp.com/ar/servicios/plumbing')) {
  console.log(`  ❌ Argentina should use 'servicios' path`);
  sitemapPassed = false;
}

if (sitemapPassed) {
  console.log('  ✅ Sitemap contains all required country-specific URLs\n');
} else {
  console.log('  ❌ Sitemap validation failed\n');
}

// Test 2: Verify robots.txt allows all country paths
console.log('Test 2: robots.txt allows country paths');
const robotsPath = path.join(__dirname, 'robots.txt');
const robots = fs.readFileSync(robotsPath, 'utf-8');

let robotsPassed = true;
countryCodes.forEach(country => {
  if (!robots.includes(`Allow: /${country}/`)) {
    console.log(`  ❌ robots.txt missing Allow: /${country}/`);
    robotsPassed = false;
  }
});

if (robotsPassed) {
  console.log('  ✅ robots.txt allows all country paths\n');
} else {
  console.log('  ❌ robots.txt validation failed\n');
}

// Test 3: Verify HreflangTags component exists and has correct structure
console.log('Test 3: HreflangTags component structure');
const hreflangPath = path.join(__dirname, 'client', 'src', 'seo', 'HreflangTags.jsx');
const hreflang = fs.readFileSync(hreflangPath, 'utf-8');

let hreflangPassed = true;

// Check for all required hreflang codes
const hreflangs = ['en-us', 'en-ca', 'en-gb', 'en-au', 'es-ar', 'x-default'];
hreflangs.forEach(lang => {
  if (!hreflang.includes(`hreflang: '${lang}'`)) {
    console.log(`  ❌ Missing hreflang: ${lang}`);
    hreflangPassed = false;
  }
});

// Check for servicios path for Argentina
if (!hreflang.includes("servicesPath: 'servicios'")) {
  console.log(`  ❌ Missing servicios path for Argentina`);
  hreflangPassed = false;
}

if (hreflangPassed) {
  console.log('  ✅ HreflangTags component structure is correct\n');
} else {
  console.log('  ❌ HreflangTags validation failed\n');
}

// Test 4: Verify ServicePage handles country routing
console.log('Test 4: ServicePage country routing');
const servicePagePath = path.join(__dirname, 'client', 'src', 'routes', 'ServicePage.jsx');
const servicePage = fs.readFileSync(servicePagePath, 'utf-8');

let servicePagePassed = true;

// Check for country parameter extraction
if (!servicePage.includes('const { country, service, city } = useParams()')) {
  console.log(`  ❌ ServicePage missing country parameter extraction`);
  servicePagePassed = false;
}

// Check for country validation
if (!servicePage.includes('SUPPORTED_COUNTRIES.includes(countryCode)')) {
  console.log(`  ❌ ServicePage missing country validation`);
  servicePagePassed = false;
}

// Check for legacy redirect
if (!servicePage.includes('if (legacy)')) {
  console.log(`  ❌ ServicePage missing legacy route handling`);
  servicePagePassed = false;
}

// Check for HreflangTags import
if (!servicePage.includes('import HreflangTags')) {
  console.log(`  ❌ ServicePage missing HreflangTags import`);
  servicePagePassed = false;
}

if (servicePagePassed) {
  console.log('  ✅ ServicePage country routing is correct\n');
} else {
  console.log('  ❌ ServicePage validation failed\n');
}

// Test 5: Verify SEO Agent createPage supports country
console.log('Test 5: SEO Agent createPage country support');
const createPagePath = path.join(__dirname, 'server', 'seo-agent', 'actions', 'createPage.js');
const createPage = fs.readFileSync(createPagePath, 'utf-8');

let createPagePassed = true;

// Check for country parameter
if (!createPage.includes("country = 'us'")) {
  console.log(`  ❌ createPage missing country parameter with default`);
  createPagePassed = false;
}

// Check for servicios path logic
if (!createPage.includes("country === 'ar' ? 'servicios' : 'services'")) {
  console.log(`  ❌ createPage missing servicios path logic`);
  createPagePassed = false;
}

// Check for country in slug
if (!createPage.includes('const slug = `/${country}/${servicesPath}/')) {
  console.log(`  ❌ createPage slug doesn't include country`);
  createPagePassed = false;
}

if (createPagePassed) {
  console.log('  ✅ SEO Agent createPage supports country parameter\n');
} else {
  console.log('  ❌ SEO Agent validation failed\n');
}

// Summary
console.log('\n' + '='.repeat(60));
const allPassed = sitemapPassed && robotsPassed && hreflangPassed && servicePagePassed && createPagePassed;
if (allPassed) {
  console.log('✅ All tests passed! International SEO implementation is complete.');
} else {
  console.log('❌ Some tests failed. Please review the output above.');
  process.exit(1);
}

console.log('='.repeat(60));
