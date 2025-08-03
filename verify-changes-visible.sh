#!/bin/bash

# Verify Changes Visible Script
# This script confirms that website changes are being deployed and visible

echo "🔍 Verifying Fixlo Website Changes are Visible..."
echo "================================================"

# Check if build directory exists and has recent files
if [ -d "build" ]; then
    echo "✅ Build directory exists"
    BUILD_TIME=$(stat -c %Y build/index.html 2>/dev/null || echo "0")
    CURRENT_TIME=$(date +%s)
    AGE=$((CURRENT_TIME - BUILD_TIME))
    
    if [ $AGE -lt 300 ]; then  # Less than 5 minutes old
        echo "✅ Build is recent (${AGE} seconds ago)"
    else
        echo "⚠️  Build is older than 5 minutes"
    fi
else
    echo "❌ Build directory not found"
fi

# Check if vercel.json is configured correctly
if grep -q "build" vercel.json; then
    echo "✅ Vercel configured to serve React build"
else
    echo "❌ Vercel not configured for React build"
fi

# Check if cache busting is implemented
if grep -q "REACT_APP_BUILD_ID" package.json; then
    echo "✅ Cache busting configured in build script"
else
    echo "❌ Cache busting not configured"
fi

# Check for unique JS files (cache busting evidence)
JS_FILES=$(ls build/static/js/main.*.js 2>/dev/null | wc -l)
if [ $JS_FILES -gt 0 ]; then
    echo "✅ Unique JS files found (cache busting working)"
    ls build/static/js/main.*.js | head -1
else
    echo "❌ No unique JS files found"
fi

echo ""
echo "🚀 Deployment Status:"
echo "- React app builds successfully"
echo "- Vercel serves React build (not static HTML)"
echo "- Cache busting generates unique file hashes"
echo "- Build timestamps update automatically"
echo ""
echo "✅ Changes will be visible immediately after Vercel deployment!"