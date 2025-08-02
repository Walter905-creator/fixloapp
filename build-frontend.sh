#!/bin/bash

echo "🚀 Frontend Build Script"
echo "========================"

echo "📍 Building Fixlo React application..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run from project root."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Setting up build environment..."
export GENERATE_SOURCEMAP=false
export NODE_ENV=production

echo "🏗️ Building React application..."
npm run build

echo "✅ Build process complete!"

if [ -d "build" ] && [ -f "build/index.html" ]; then
    echo "📊 Build statistics:"
    echo "   Build directory size: $(du -sh build | cut -f1)"
    echo "   Files created: $(find build -type f | wc -l)"
    echo ""
    echo "🎯 Build ready for deployment!"
    echo "📁 Build location: ./build/"
else
    echo "❌ Build failed - build directory or index.html not found"
    exit 1
fi