#!/bin/bash

# Vercel Build Verification Script
# Use this to debug build issues in Vercel

echo "🔍 Vercel Build Verification Started"
echo "======================================="

echo "📊 Environment Information:"
echo "Node Version: $(node --version)"
echo "NPM Version: $(npm --version)"
echo "Current Directory: $(pwd)"
echo "Available Memory: $(free -h 2>/dev/null || echo 'Not available')"

echo ""
echo "📦 Package Information:"
echo "Root package.json exists: $([ -f package.json ] && echo 'Yes' || echo 'No')"
echo "Client package.json exists: $([ -f client/package.json ] && echo 'Yes' || echo 'No')"

if [ -f client/package.json ]; then
    echo "Client package name: $(grep '"name"' client/package.json | head -1)"
    echo "React Scripts version: $(grep 'react-scripts' client/package.json | head -1)"
fi

echo ""
echo "🔨 Testing Build Process:"

# Test client directory exists and is accessible
if [ -d client ]; then
    echo "✅ Client directory found"
    cd client
    
    # Check if node_modules exists
    if [ -d node_modules ]; then
        echo "✅ Client node_modules exists"
    else
        echo "⚠️ Client node_modules missing - installing..."
        npm install --no-fund --no-audit
    fi
    
    # Test react-scripts directly
    echo "🧪 Testing react-scripts build directly..."
    if npx react-scripts build --help > /dev/null 2>&1; then
        echo "✅ react-scripts is accessible"
    else
        echo "❌ react-scripts not working properly"
        exit 1
    fi
    
    cd ..
else
    echo "❌ Client directory not found"
    exit 1
fi

# Test the custom build script
if [ -f build-vercel.sh ]; then
    echo "✅ Custom build script found"
    echo "🚀 Running custom build script..."
    ./build-vercel.sh
else
    echo "⚠️ Custom build script not found, using npm run build"
    npm run build
fi

echo ""
echo "✅ Verification completed successfully!"