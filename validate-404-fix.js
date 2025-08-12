#!/usr/bin/env node

/**
 * Comprehensive 404 Fix Validation Script
 * This script validates that the 404 error fixes are properly implemented
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixlo 404 Error Fix Validation\n');

let totalTests = 0;
let passedTests = 0;

function test(description, condition) {
    totalTests++;
    if (condition) {
        console.log(`✅ ${description}`);
        passedTests++;
    } else {
        console.log(`❌ ${description}`);
    }
}

// Test 1: Vercel Configuration
console.log('📄 Testing Vercel Configuration...');
const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));

test('vercel.json exists and is valid JSON', !!vercelConfig);
test('Error page configured to /404.html', vercelConfig.errorPage === '/404.html');
test('Rewrites array exists', Array.isArray(vercelConfig.rewrites));

// Test 2: Required HTML files exist
console.log('\n📁 Testing Required HTML Files...');
const requiredFiles = [
    '404.html',
    'index.html', 
    'admin.html',
    'contact.html',
    'privacy.html',
    'terms.html',
    'support.html',
    'login.html',
    'signup.html',
    'pro-signup.html',
    'how-it-works.html',
    'dashboard.html',
    'payment-success.html',
    'payment-cancel.html',
    'sms-compliance.html',
    'services/index.html',
    'services/plumbing.html'
];

requiredFiles.forEach(file => {
    test(`${file} exists`, fs.existsSync(file));
});

// Test 3: Static routes are configured
console.log('\n🔗 Testing Static Route Configuration...');
const expectedRoutes = [
    { source: '/admin', destination: '/admin.html' },
    { source: '/contact', destination: '/contact.html' },
    { source: '/privacy', destination: '/privacy.html' },
    { source: '/terms', destination: '/terms.html' },
    { source: '/support', destination: '/support.html' },
    { source: '/login', destination: '/login.html' },
    { source: '/signup', destination: '/signup.html' },
    { source: '/pro-signup', destination: '/pro-signup.html' },
    { source: '/how-it-works', destination: '/how-it-works.html' },
    { source: '/dashboard', destination: '/dashboard.html' },
    { source: '/payment-success', destination: '/payment-success.html' },
    { source: '/payment-cancel', destination: '/payment-cancel.html' },
    { source: '/sms-compliance', destination: '/sms-compliance.html' },
    { source: '/services', destination: '/services/index.html' },
    { source: '/services/plumbing', destination: '/services/plumbing.html' }
];

expectedRoutes.forEach(expectedRoute => {
    const routeExists = vercelConfig.rewrites.some(route => 
        route.source === expectedRoute.source && route.destination === expectedRoute.destination
    );
    test(`Route ${expectedRoute.source} → ${expectedRoute.destination}`, routeExists);
});

// Test 4: Static asset routes
console.log('\n📦 Testing Static Asset Routes...');
const staticAssetRoutes = [
    '/static/(.*)',
    '/assets/(.*)',
    '/manifest.webmanifest',
    '/robots.txt',
    '/sitemap.xml',
    '/favicon.ico'
];

staticAssetRoutes.forEach(route => {
    const routeExists = vercelConfig.rewrites.some(r => r.source === route);
    test(`Static route ${route} configured`, routeExists);
});

// Test 5: Catch-all route exists and is last
console.log('\n🎯 Testing Catch-all Route...');
const rewrites = vercelConfig.rewrites;
const lastRewrite = rewrites[rewrites.length - 1];
test('Catch-all route exists as last rewrite', 
    lastRewrite && lastRewrite.source === '/(.*)'&& lastRewrite.destination === '/index.html');

// Test 6: 404 page content validation
console.log('\n📄 Testing 404 Page Content...');
const html404 = fs.readFileSync('404.html', 'utf8');
test('404.html contains "Page Not Found" title', html404.includes('<title>Page Not Found - Fixlo</title>'));
test('404.html has Return Home button', html404.includes('href="/"') && html404.includes('Return Home'));
test('404.html uses clean URLs for internal links', 
    html404.includes('href="/services"') && 
    html404.includes('href="/how-it-works"') && 
    html404.includes('href="/signup"') && 
    html404.includes('href="/contact"'));
test('404.html does not use .html extensions in links', 
    !html404.includes('href="/how-it-works.html"') && 
    !html404.includes('href="/signup.html"') && 
    !html404.includes('href="/contact.html"'));

// Test 7: Build artifacts exist
console.log('\n🏗️  Testing Build Artifacts...');
test('Asset manifest exists', fs.existsSync('asset-manifest.json'));

if (fs.existsSync('asset-manifest.json')) {
    const assetManifest = JSON.parse(fs.readFileSync('asset-manifest.json', 'utf8'));
    const mainJs = assetManifest.files && assetManifest.files['main.js'];
    const mainCss = assetManifest.files && assetManifest.files['main.css'];
    
    if (mainJs) {
        const jsFile = mainJs.replace(/^\//, '');
        test(`Main JS file exists: ${jsFile}`, fs.existsSync(jsFile));
    }
    
    if (mainCss) {
        const cssFile = mainCss.replace(/^\//, '');
        test(`Main CSS file exists: ${cssFile}`, fs.existsSync(cssFile));
    }
}

// Test 8: Essential meta files
console.log('\n📋 Testing Meta Files...');
test('robots.txt exists', fs.existsSync('robots.txt'));
test('sitemap.xml exists', fs.existsSync('sitemap.xml'));
test('manifest.webmanifest exists', fs.existsSync('manifest.webmanifest'));

// Summary
console.log('\n📊 Fix Validation Summary:');
console.log(`Tests passed: ${passedTests}/${totalTests}`);
console.log(`Success rate: ${Math.round((passedTests/totalTests) * 100)}%`);

if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! 404 errors should be completely resolved.');
    console.log('\n✅ Key fixes implemented:');
    console.log('   • Vercel routing configuration updated');
    console.log('   • Static HTML pages properly routed');
    console.log('   • 404.html configured as error page');
    console.log('   • Internal links updated to use clean URLs');
    console.log('   • Build artifacts properly deployed');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
}