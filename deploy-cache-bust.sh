#!/bin/bash

echo "🚀 FIXLO CACHE-BUST DEPLOYMENT"
echo "==============================="
echo ""

# Generate unique build ID
TIMESTAMP=$(date +%s)
BUILD_ID="v1.0.0-${TIMESTAMP}"

echo "📦 Building with cache-bust ID: $BUILD_ID"

# Set environment variables for cache busting
export REACT_APP_BUILD_ID="$BUILD_ID"
export REACT_APP_BUILD_TIMESTAMP="$TIMESTAMP"
export GENERATE_SOURCEMAP=false

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf build/

# Build with cache busting
echo "🔨 Building application..."
npm run build:deploy

# Check if build succeeded
if [ ! -d "build" ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"
echo ""
echo "📋 BUILD SUMMARY:"
echo "=================="
echo "Build ID: $BUILD_ID"
echo "Timestamp: $TIMESTAMP"
echo "Output: build/"
echo ""

# List generated files
echo "📄 Generated files:"
ls -la build/static/js/ 2>/dev/null || echo "  (No JS files found)"
ls -la build/static/css/ 2>/dev/null || echo "  (No CSS files found)"
echo ""

echo "🚨 NEXT STEPS:"
echo "=============="
echo "1. Commit and push these changes:"
echo "   git add ."
echo "   git commit -m 'Cache bust deployment - $BUILD_ID'"
echo "   git push"
echo ""
echo "2. This will trigger automatic deployment on Vercel"
echo ""
echo "3. After deployment, users should:"
echo "   - Hard refresh (Ctrl+F5 / Cmd+Shift+R)"
echo "   - Or clear browser cache"
echo "   - Or try incognito/private mode"
echo ""
echo "4. Check browser console for:"
echo "   '🚀 Fixlo App loaded - Build: $BUILD_ID'"
echo ""
echo "✅ This will force browsers to fetch the latest version!"