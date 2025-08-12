#!/bin/bash

# Comprehensive 404 Fix Verification Script for Fixlo
echo "🔍 Starting Fixlo 404 Fix Verification..."

BASE_URL="http://localhost:3002"

# Function to test URL and report status
test_url() {
    local url="$1"
    local description="$2"
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status_code" = "200" ]; then
        echo "✅ $description: $status_code"
        return 0
    else
        echo "❌ $description: $status_code"
        return 1
    fi
}

# Test essential pages and assets
echo -e "\n📄 Testing Essential Pages..."
test_url "$BASE_URL/" "Homepage"
test_url "$BASE_URL/admin.html" "Admin page"
test_url "$BASE_URL/how-it-works.html" "How it works page"
test_url "$BASE_URL/pro-signup.html" "Pro signup page"

echo -e "\n🎨 Testing Static Assets..."
test_url "$BASE_URL/static/css/main.6197e35a.css" "Main CSS file"
test_url "$BASE_URL/static/js/main.a84bc293.js" "Main JS file"
test_url "$BASE_URL/favicon.ico" "Favicon"
test_url "$BASE_URL/manifest.webmanifest" "Web manifest"

echo -e "\n📋 Testing Meta Files..."
test_url "$BASE_URL/robots.txt" "Robots.txt"
test_url "$BASE_URL/sitemap.xml" "Sitemap"

echo -e "\n🔗 Testing Service Routes (should redirect to /)..."
test_url "$BASE_URL/services/plumbing" "Service route - plumbing"
test_url "$BASE_URL/services/electrical" "Service route - electrical"

echo -e "\n📊 Testing Asset Manifest..."
if [ -f "asset-manifest.json" ]; then
    echo "✅ Asset manifest exists"
    # Verify the JS file referenced in asset-manifest matches what's in index.html
    manifest_js=$(cat asset-manifest.json | grep '"main.js"' | sed 's/.*"\/static\/js\/\([^"]*\)".*/\1/')
    index_js=$(grep -o 'main\.[a-f0-9]*\.js' index.html)
    
    if [ "$manifest_js" = "$index_js" ]; then
        echo "✅ Asset manifest and index.html JS files match: $index_js"
    else
        echo "❌ Asset manifest ($manifest_js) and index.html ($index_js) JS files don't match"
    fi
else
    echo "❌ Asset manifest missing"
fi

echo -e "\n🔧 Testing Build Consistency..."
if [ -f "index.html" ]; then
    # Check if the JS file referenced in index.html actually exists
    js_file=$(grep -o 'static/js/main\.[a-f0-9]*\.js' index.html)
    if [ -f "$js_file" ]; then
        echo "✅ Referenced JS file exists: $js_file"
    else
        echo "❌ Referenced JS file missing: $js_file"
    fi
    
    # Check if the CSS file referenced in index.html actually exists
    css_file=$(grep -o 'static/css/main\.[a-f0-9]*\.css' index.html)
    if [ -f "$css_file" ]; then
        echo "✅ Referenced CSS file exists: $css_file"
    else
        echo "❌ Referenced CSS file missing: $css_file"
    fi
else
    echo "❌ index.html missing"
fi

echo -e "\n📦 Testing Vercel Configuration..."
if [ -f "vercel.json" ]; then
    echo "✅ vercel.json exists"
    
    # Check if static file rewrites are properly configured
    if grep -q '/static/(.*)' vercel.json; then
        echo "✅ Static file rewrites configured"
    else
        echo "❌ Static file rewrites missing"
    fi
    
    # Check if headers for static files are configured
    if grep -q '"source": "/static/(.*)"' vercel.json; then
        echo "✅ Static file headers configured"
    else
        echo "❌ Static file headers missing"
    fi
else
    echo "❌ vercel.json missing"
fi

echo -e "\n🎯 Verification Complete!"
echo "If all tests show ✅, the 404 issue should be resolved on deployment."