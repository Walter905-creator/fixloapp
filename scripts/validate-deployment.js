#!/usr/bin/env node

/**
 * Deployment Validation Script
 * Checks for common 404 issues before deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating deployment for 404 errors...\n');

// Check if index.html exists and is not empty
const indexPath = path.join(__dirname, '..', 'index.html');
if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html not found in root directory');
    process.exit(1);
}

const indexContent = fs.readFileSync(indexPath, 'utf8');
if (indexContent.length < 100) {
    console.error('❌ index.html appears to be empty or corrupted');
    process.exit(1);
}

// Extract static asset references from index.html
const jsMatch = indexContent.match(/src="\/static\/js\/(main\.[a-f0-9]+\.js)"/);
const cssMatch = indexContent.match(/href="\/static\/css\/(main\.[a-f0-9]+\.css)"/);

if (!jsMatch || !cssMatch) {
    console.error('❌ Could not find static asset references in index.html');
    process.exit(1);
}

const jsFile = jsMatch[1];
const cssFile = cssMatch[1];

console.log(`📋 Found asset references:`);
console.log(`   JS:  ${jsFile}`);
console.log(`   CSS: ${cssFile}`);

// Check if referenced files actually exist
const jsPath = path.join(__dirname, '..', 'static', 'js', jsFile);
const cssPath = path.join(__dirname, '..', 'static', 'css', cssFile);

if (!fs.existsSync(jsPath)) {
    console.error(`❌ Referenced JS file not found: ${jsPath}`);
    process.exit(1);
}

if (!fs.existsSync(cssPath)) {
    console.error(`❌ Referenced CSS file not found: ${cssPath}`);
    process.exit(1);
}

console.log('✅ Static assets found and match references');

// Check for duplicate content in index.html
const lines = indexContent.split('\n');
if (lines.length > 10) {
    console.error('❌ index.html appears to have duplicate content (too many lines)');
    process.exit(1);
}

// Check for multiple HTML declarations
const htmlDeclarations = (indexContent.match(/<!doctype html>/gi) || []).length;
if (htmlDeclarations > 1) {
    console.error(`❌ Found ${htmlDeclarations} HTML declarations - file may be duplicated`);
    process.exit(1);
}

// Check for essential files
const essentialFiles = [
    'favicon.ico',
    'robots.txt',
    'sitemap.xml',
    '404.html'
];

for (const file of essentialFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Essential file missing: ${file}`);
    }
}

console.log('\n✅ Deployment validation passed!');
console.log('🚀 Ready for deployment');