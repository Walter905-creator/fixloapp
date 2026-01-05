#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Google Search Console Indexing Fixes\n');

let passCount = 0;
let failCount = 0;
const issues = [];

// Test 1: Check sitemap has only 18 URLs
console.log('Test 1: Sitemap URL count...');
const sitemap = fs.readFileSync(path.join(__dirname, '..', 'sitemap.xml'), 'utf8');
const urlMatches = sitemap.match(/<url>/g);
const urlCount = urlMatches ? urlMatches.length : 0;
if (urlCount === 18) {
  console.log(`  ✅ PASS: Sitemap has ${urlCount} URLs (expected 18)`);
  passCount++;
} else {
  console.log(`  ❌ FAIL: Sitemap has ${urlCount} URLs (expected 18)`);
  failCount++;
  issues.push(`Sitemap has wrong number of URLs: ${urlCount}`);
}

// Test 2: Check no non-existent URLs in sitemap
console.log('\nTest 2: Sitemap URLs existence...');
const nonExistentURLs = ['/country/', '/about"', '/for-professionals', '/emergency/', '/same-day/', '/alternatives-to-'];
let foundNonExistent = false;
nonExistentURLs.forEach(url => {
  if (sitemap.includes(url)) {
    console.log(`  ❌ FAIL: Found non-existent URL pattern: ${url}`);
    failCount++;
    foundNonExistent = true;
    issues.push(`Sitemap contains non-existent URL: ${url}`);
  }
});
if (!foundNonExistent) {
  console.log('  ✅ PASS: No non-existent URLs in sitemap');
  passCount++;
}

// Test 3: Check meta descriptions on key pages
console.log('\nTest 3: Unique meta descriptions...');
const pagesToCheck = [
  'index.html',
  'services/plumbing/index.html',
  'services/electrical/index.html',
  'services/hvac/index.html'
];

let allHaveDescriptions = true;
const descriptions = new Set();

pagesToCheck.forEach(page => {
  const filePath = path.join(__dirname, '..', page);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const descMatch = content.match(/<meta name="description" content="([^"]+)"/);
    if (descMatch) {
      const desc = descMatch[1];
      if (descriptions.has(desc)) {
        console.log(`  ❌ FAIL: Duplicate description in ${page}`);
        allHaveDescriptions = false;
        issues.push(`Duplicate description in ${page}`);
      } else if (desc.length < 50) {
        console.log(`  ❌ FAIL: Description too short in ${page} (${desc.length} chars)`);
        allHaveDescriptions = false;
        issues.push(`Description too short in ${page}`);
      } else {
        descriptions.add(desc);
      }
    } else {
      console.log(`  ❌ FAIL: No description meta tag in ${page}`);
      allHaveDescriptions = false;
      issues.push(`Missing description in ${page}`);
    }
  }
});

if (allHaveDescriptions && descriptions.size === pagesToCheck.length) {
  console.log(`  ✅ PASS: All ${pagesToCheck.length} pages have unique descriptions`);
  passCount++;
} else {
  failCount++;
}

// Test 4: Check canonical tags
console.log('\nTest 4: Canonical URLs...');
let allHaveCanonicals = true;
pagesToCheck.forEach(page => {
  const filePath = path.join(__dirname, '..', page);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const canonicalMatch = content.match(/<link rel="canonical" href="([^"]+)"/);
    if (!canonicalMatch) {
      console.log(`  ❌ FAIL: No canonical tag in ${page}`);
      allHaveCanonicals = false;
      issues.push(`Missing canonical in ${page}`);
    } else {
      const canonical = canonicalMatch[1];
      if (!canonical.startsWith('https://www.fixloapp.com')) {
        console.log(`  ❌ FAIL: Invalid canonical in ${page}: ${canonical}`);
        allHaveCanonicals = false;
        issues.push(`Invalid canonical in ${page}`);
      }
    }
  }
});

if (allHaveCanonicals) {
  console.log(`  ✅ PASS: All ${pagesToCheck.length} pages have valid canonical URLs`);
  passCount++;
} else {
  failCount++;
}

// Test 5: Check structured data
console.log('\nTest 5: Structured data (JSON-LD)...');
const pagesWithStructuredData = ['index.html', 'services/index.html', 'services/plumbing/index.html'];
let allHaveStructuredData = true;

pagesWithStructuredData.forEach(page => {
  const filePath = path.join(__dirname, '..', page);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('application/ld+json')) {
      console.log(`  ❌ FAIL: No structured data in ${page}`);
      allHaveStructuredData = false;
      issues.push(`Missing structured data in ${page}`);
    } else {
      // Validate JSON
      try {
        const jsonMatch = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
        if (jsonMatch) {
          JSON.parse(jsonMatch[1]);
        }
      } catch (e) {
        console.log(`  ❌ FAIL: Invalid JSON in structured data for ${page}`);
        allHaveStructuredData = false;
        issues.push(`Invalid JSON in structured data for ${page}`);
      }
    }
  }
});

if (allHaveStructuredData) {
  console.log(`  ✅ PASS: All ${pagesWithStructuredData.length} pages have valid structured data`);
  passCount++;
} else {
  failCount++;
}

// Test 6: Check noscript content
console.log('\nTest 6: Noscript fallback content...');
let allHaveNoscript = true;

pagesWithStructuredData.forEach(page => {
  const filePath = path.join(__dirname, '..', page);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('<noscript>')) {
      console.log(`  ❌ FAIL: No noscript content in ${page}`);
      allHaveNoscript = false;
      issues.push(`Missing noscript in ${page}`);
    }
  }
});

if (allHaveNoscript) {
  console.log(`  ✅ PASS: All ${pagesWithStructuredData.length} pages have noscript fallback`);
  passCount++;
} else {
  failCount++;
}

// Test 7: Check robots meta tags
console.log('\nTest 7: Enhanced robots meta tags...');
let allHaveRobotsTags = true;

pagesToCheck.forEach(page => {
  const filePath = path.join(__dirname, '..', page);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const robotsMatch = content.match(/<meta name="robots" content="([^"]+)"/);
    if (!robotsMatch) {
      console.log(`  ❌ FAIL: No robots meta tag in ${page}`);
      allHaveRobotsTags = false;
      issues.push(`Missing robots meta tag in ${page}`);
    } else {
      const robotsContent = robotsMatch[1];
      if (!robotsContent.includes('max-image-preview')) {
        console.log(`  ❌ FAIL: Robots meta tag not enhanced in ${page}`);
        allHaveRobotsTags = false;
        issues.push(`Robots meta tag not enhanced in ${page}`);
      }
    }
  }
});

if (allHaveRobotsTags) {
  console.log(`  ✅ PASS: All ${pagesToCheck.length} pages have enhanced robots tags`);
  passCount++;
} else {
  failCount++;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Tests Passed: ${passCount}`);
console.log(`❌ Tests Failed: ${failCount}`);
console.log(`📈 Success Rate: ${Math.round((passCount / (passCount + failCount)) * 100)}%`);

if (failCount > 0) {
  console.log('\n⚠️  ISSUES FOUND:');
  issues.forEach((issue, i) => {
    console.log(`   ${i + 1}. ${issue}`);
  });
  console.log('\n❌ Validation FAILED - Please fix the issues above');
  process.exit(1);
} else {
  console.log('\n🎉 All validation tests passed!');
  console.log('✅ Ready for production deployment');
  process.exit(0);
}
