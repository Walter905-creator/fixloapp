#!/bin/bash

# Test script to verify the Vercel build fix
# This script simulates a fresh Vercel deployment environment

echo "🧪 Testing Vercel Build Fix"
echo "=========================="

# Step 1: Clean environment
echo "📦 Step 1: Cleaning environment..."
rm -rf client/node_modules client/build build public index.html sitemap.xml static
echo "✅ Environment cleaned"

# Step 2: Install root dependencies
echo "📦 Step 2: Installing root dependencies..."
npm install --silent
if [ $? -ne 0 ]; then
    echo "❌ Root npm install failed"
    exit 1
fi
echo "✅ Root dependencies installed"

# Step 3: Test vercel-build command
echo "🔨 Step 3: Testing vercel-build command..."
npm run vercel-build
if [ $? -ne 0 ]; then
    echo "❌ vercel-build failed"
    exit 1
fi
echo "✅ vercel-build completed successfully"

# Step 4: Verify output files
echo "📋 Step 4: Verifying output files..."
required_files=("index.html" "sitemap.xml" "static/js" "static/css")

for file in "${required_files[@]}"; do
    if [ ! -e "$file" ]; then
        echo "❌ Required file/directory missing: $file"
        exit 1
    fi
done
echo "✅ All required files present"

# Step 5: Test Vercel configuration
echo "⚙️  Step 5: Testing Vercel configuration..."
node scripts/test-vercel-config.js
if [ $? -ne 0 ]; then
    echo "❌ Vercel configuration test failed"
    exit 1
fi
echo "✅ Vercel configuration validated"

echo ""
echo "🎉 All tests passed! Vercel build fix verified successfully."
echo "🚀 The deployment should now work correctly on Vercel."