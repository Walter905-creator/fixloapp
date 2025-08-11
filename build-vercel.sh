#!/bin/bash

# Enhanced Build Script for Vercel
# This script provides additional error handling and logging for build issues

set -e  # Exit on any error

echo "🚀 Starting Fixlo build process..."

# Environment setup
export NODE_OPTIONS="--max-old-space-size=4096"
export CI=true

# Clean previous builds
echo "🧹 Cleaning previous builds..."
npm run clean-old-builds || true

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install --no-fund --no-audit --silent 2>&1 | grep -E "(error|Error|ERROR)" || true

echo "🔨 Building React application..."
# Capture build output and filter it
REACT_APP_API_URL=https://fixloapp.onrender.com \
REACT_APP_BUILD_TIMESTAMP=$(date +%s) \
REACT_APP_BUILD_ID=$(date +%Y%m%d-%H%M%S) \
npm run build 2>&1 | tee build.log

# Check if build was successful
if [ -d "build" ] && [ -f "build/index.html" ]; then
    echo "✅ React build completed successfully"
    
    # Verify file sizes output
    if grep -q "File sizes after gzip:" build.log; then
        echo "📊 Build size information:"
        grep -A 10 "File sizes after gzip:" build.log | head -15
    else
        echo "⚠️ File size information not found in build output"
    fi
else
    echo "❌ React build failed - build directory or index.html not found"
    exit 1
fi

# Return to root and deploy
cd ..
echo "🚚 Deploying build to root directory..."
cp -r client/build/* .
echo "✅ Build deployed to root directory"

# Generate sitemap
echo "🗺️ Generating sitemap..."
node generate-sitemap.js

echo "🎉 Build process completed successfully!"