#!/bin/bash

echo "🔧 Frontend Deployment Fix Script"
echo "================================="

echo "📍 Current directory: $(pwd)"
echo "📋 Checking current setup..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Run this from the root directory."
    exit 1
fi

echo "🧹 Cleaning previous builds..."
rm -rf build/

echo "📦 Installing dependencies..."
npm install

echo "🔧 Setting up environment variables..."
export GENERATE_SOURCEMAP=false
export REACT_APP_API_URL=https://fixloapp.onrender.com

echo "🏗️ Building React application..."
npm run build

echo "✅ Checking build output..."
if [ -d "build" ] && [ -f "build/index.html" ]; then
    echo "✅ Build successful!"
    echo "📊 Build size:"
    du -sh build/
    echo "📁 Build contents:"
    ls -la build/
else
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "🎯 Frontend build complete and ready for deployment!"
echo "📋 To deploy:"
echo "1. Upload build/ directory to your hosting service"
echo "2. Configure environment variables on hosting platform"
echo "3. Set up custom domain if needed"
echo ""