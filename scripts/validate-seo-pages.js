#!/usr/bin/env node

/**
 * SEO Pages Validation Script
 * Validates that all generated SEO pages have proper structure and metadata
 */

const fs = require('fs');
const path = require('path');

// Load services and cities
const servicesData = require('../seo/services.json');
const citiesData = require('../seo/cities.json');

// Convert to slugs
function formatSlug(text) {
  return text.toLowerCase().replace(/\s+/g, '-');
}

const services = servicesData.map(formatSlug);
const cities = citiesData.map(c => formatSlug(c.city));

console.log('🔍 Starting SEO Pages Validation...\n');

// Validation results
let totalPages = 0;
let validPages = 0;
let invalidPages = 0;
const errors = [];

// Check each service + city combination
services.forEach(service => {
  cities.forEach(city => {
    // Check English page
    const enPath = path.join(__dirname, '../client/src/pages/services', service, city, 'index.jsx');
    totalPages++;
    
    if (fs.existsSync(enPath)) {
      const content = fs.readFileSync(enPath, 'utf-8');
      
      // Validate required elements
      const checks = {
        hasTitle: content.includes('<title>'),
        hasDescription: content.includes('meta name="description"'),
        hasKeywords: content.includes('meta name="keywords"'),
        hasCanonical: content.includes('rel="canonical"'),
        hasSchema: content.includes('application/ld+json'),
        hasH1: content.includes('<h1'),
        hasH2: content.includes('<h2'),
      };
      
      const allValid = Object.values(checks).every(v => v);
      
      if (allValid) {
        validPages++;
      } else {
        invalidPages++;
        errors.push({
          page: `/services/${service}/${city}`,
          missing: Object.entries(checks).filter(([k, v]) => !v).map(([k]) => k)
        });
      }
    } else {
      invalidPages++;
      errors.push({
        page: `/services/${service}/${city}`,
        missing: ['FILE_NOT_FOUND']
      });
    }
    
    // Check Spanish page
    const esPath = path.join(__dirname, '../client/src/pages/services', service, city, 'es.jsx');
    totalPages++;
    
    if (fs.existsSync(esPath)) {
      const content = fs.readFileSync(esPath, 'utf-8');
      
      const checks = {
        hasTitle: content.includes('<title>'),
        hasDescription: content.includes('meta name="description"'),
        hasKeywords: content.includes('meta name="keywords"'),
        hasCanonical: content.includes('rel="canonical"'),
        hasSchema: content.includes('application/ld+json'),
        hasH1: content.includes('<h1'),
        hasH2: content.includes('<h2'),
        hasLanguage: content.includes('meta name="language"'),
      };
      
      const allValid = Object.values(checks).every(v => v);
      
      if (allValid) {
        validPages++;
      } else {
        invalidPages++;
        errors.push({
          page: `/services/${service}/${city}/es`,
          missing: Object.entries(checks).filter(([k, v]) => !v).map(([k]) => k)
        });
      }
    } else {
      invalidPages++;
      errors.push({
        page: `/services/${service}/${city}/es`,
        missing: ['FILE_NOT_FOUND']
      });
    }
  });
});

// Print results
console.log('📊 Validation Results:\n');
console.log(`Total Pages: ${totalPages}`);
console.log(`✅ Valid Pages: ${validPages}`);
console.log(`❌ Invalid Pages: ${invalidPages}`);
console.log(`📈 Success Rate: ${((validPages / totalPages) * 100).toFixed(2)}%\n`);

if (errors.length > 0) {
  console.log('❌ Errors Found:\n');
  errors.slice(0, 10).forEach(err => {
    console.log(`  Page: ${err.page}`);
    console.log(`  Missing: ${err.missing.join(', ')}\n`);
  });
  
  if (errors.length > 10) {
    console.log(`  ... and ${errors.length - 10} more errors\n`);
  }
  
  process.exit(1);
} else {
  console.log('✅ All SEO pages are valid!\n');
  
  // Test sample URLs
  console.log('📝 Sample URLs to test:\n');
  const samples = [
    '/services/junk-removal/new-york',
    '/services/hvac/houston',
    '/services/roofing/dallas',
    '/services/plumbing/chicago',
    '/services/electrical/los-angeles',
  ];
  
  samples.forEach(url => {
    console.log(`  https://fixloapp.com${url}`);
  });
  
  console.log('\n✨ Validation complete!\n');
  process.exit(0);
}
