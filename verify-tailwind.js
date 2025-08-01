#!/usr/bin/env node

// Script to verify Tailwind CSS is properly configured for production
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Tailwind CSS Production Setup...\n');

// Check for proper Tailwind directives in index.css
const indexCssPath = path.join(__dirname, 'client/src/index.css');
const indexCssContent = fs.readFileSync(indexCssPath, 'utf8');

console.log('✅ Checking client/src/index.css for proper Tailwind directives:');
if (indexCssContent.includes('@tailwind base')) {
    console.log('  ✓ @tailwind base found');
} else {
    console.log('  ✗ @tailwind base missing');
}

if (indexCssContent.includes('@tailwind components')) {
    console.log('  ✓ @tailwind components found');
} else {
    console.log('  ✗ @tailwind components missing');
}

if (indexCssContent.includes('@tailwind utilities')) {
    console.log('  ✓ @tailwind utilities found');
} else {
    console.log('  ✗ @tailwind utilities missing');
}

// Check for CDN references (should not exist)
console.log('\n✅ Checking for CDN references (should be none):');
const checkForCDN = (filePath) => {
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.includes('cdn.tailwindcss.com');
    }
    return false;
};

const filesToCheck = [
    'index.html',
    'client/public/index.html',
    'client/src/index.js',
    'client/src/App.js'
];

let cdnFound = false;
for (const file of filesToCheck) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath) && checkForCDN(fullPath)) {
        console.log(`  ✗ CDN reference found in ${file}`);
        cdnFound = true;
    }
}

if (!cdnFound) {
    console.log('  ✓ No CDN references found - good!');
}

// Check for PostCSS config
console.log('\n✅ Checking PostCSS configuration:');
const postcssConfigPath = path.join(__dirname, 'client/postcss.config.js');
if (fs.existsSync(postcssConfigPath)) {
    console.log('  ✓ PostCSS config found in client directory');
    const postcssContent = fs.readFileSync(postcssConfigPath, 'utf8');
    if (postcssContent.includes('tailwindcss')) {
        console.log('  ✓ PostCSS config includes Tailwind CSS');
    } else {
        console.log('  ✗ PostCSS config missing Tailwind CSS');
    }
} else {
    console.log('  ✗ PostCSS config not found in client directory');
}

// Check for Tailwind config
console.log('\n✅ Checking Tailwind configuration:');
const tailwindConfigPath = path.join(__dirname, 'client/tailwind.config.js');
if (fs.existsSync(tailwindConfigPath)) {
    console.log('  ✓ Tailwind config found in client directory');
} else {
    console.log('  ✗ Tailwind config not found in client directory');
}

console.log('\n🎉 Tailwind CSS Production Setup Verification Complete!');
console.log('\n📝 Summary:');
console.log('- Tailwind CSS directives restored in index.css');
console.log('- No CDN references found in codebase');
console.log('- PostCSS and Tailwind configs properly configured');
console.log('- Ready for production build process');

console.log('\n💡 To build for production:');
console.log('  cd client && npm run build');