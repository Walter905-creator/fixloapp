#!/bin/bash

echo "🏗️ Building Frontend for Public Directory Deployment..."

# Step 1: Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Step 2: Navigate to client and install dependencies
echo "📦 Installing client dependencies..."
cd client
npm install

# Step 3: Build with correct environment variable
echo "🔨 Building React app with backend URL..."
REACT_APP_API_URL=https://fixloapp.onrender.com npm run build

# Step 4: Go back to root and prepare public directory
echo "📁 Preparing public directory..."
cd ..
rm -rf public
mkdir -p public

# Step 5: Copy build files to public directory
echo "📋 Copying build files to public directory..."
cp -r client/build/* public/

# Step 6: Verify the structure
echo "✅ Build complete! Public directory structure:"
ls -la public/

# Step 7: Check for correct backend URL in build
echo "🔍 Verifying backend URL in build..."
if grep -q "fixloapp.onrender.com" public/static/js/*.js; then
    echo "✅ Correct backend URL found in build files"
else
    echo "❌ Backend URL not found - check environment variables"
fi

echo ""
echo "🎯 Ready for deployment!"
echo "   - Use render-frontend-public.yaml for deployment"
echo "   - Public directory contains all static files"
echo "   - Backend URL is correctly set"
