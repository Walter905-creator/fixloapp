#!/bin/bash

# Force Vercel Deployment Script
# This script helps ensure Vercel picks up all changes by updating deployment triggers

echo "🚀 Forcing Vercel deployment for Fixlo..."

# Update deploy trigger with current timestamp
CURRENT_TIME=$(date -u)
TIMESTAMP=$(date +%s)
BUILD_ID="vercel-force-$(date +%Y%m%d-%H%M%S)"

echo "# Deploy trigger - $CURRENT_TIME" > .deploy-trigger
echo "# FORCE_VERCEL_REBUILD=true" >> .deploy-trigger
echo "# NODE_VERSION=18.x" >> .deploy-trigger
echo "# CLEAR_BUILD_CACHE=true" >> .deploy-trigger
echo "# REACT_BUILD_DEPLOYMENT=true" >> .deploy-trigger
echo "# BUILD_TIMESTAMP=$TIMESTAMP" >> .deploy-trigger
echo "# BUILD_ID=$BUILD_ID" >> .deploy-trigger

echo "📝 Updated .deploy-trigger file"

# Clean and rebuild locally to test
echo "🔧 Cleaning previous builds..."
rm -rf client/build/ 2>/dev/null || true

echo "🔨 Building with fresh environment..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Local build successful"
    
    echo "📊 Build Information:"
    if [ -f "client/build/index.html" ]; then
        echo "   Build timestamp: $(grep -o 'build-timestamp" content="[^"]*' client/build/index.html | cut -d'"' -f3)"
        echo "   Build ID: $(grep -o 'build-id" content="[^"]*' client/build/index.html | cut -d'"' -f3)"
        echo "   JS bundle: $(grep -o 'main\.[a-f0-9]*\.js' client/build/index.html)"
    fi
    
    echo ""
    echo "📤 Ready to deploy! Next steps:"
    echo "1. Commit these changes: git add . && git commit -m 'Force Vercel deployment'"
    echo "2. Push to trigger deployment: git push"
    echo "3. Monitor Vercel dashboard for deployment progress"
    echo "4. Use 'node verify-deployment.js' to verify once deployed"
    
else
    echo "❌ Local build failed - please fix errors before deploying"
    exit 1
fi