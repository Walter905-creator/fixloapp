#!/bin/bash

# Fixlo Upload Configuration Setup Script
# This script helps set up the necessary environment variables for file uploads

echo "🚀 Fixlo Upload Configuration Setup"
echo "=================================="
echo ""

# Function to check if a variable is set
check_env_var() {
    local var_name=$1
    local var_value=${!var_name}
    
    if [ -n "$var_value" ] && [ "$var_value" != "your_"* ]; then
        echo "✅ $var_name is configured"
        return 0
    else
        echo "❌ $var_name is not configured"
        return 1
    fi
}

# Check current configuration
echo "📋 Checking current configuration..."
echo ""

# Navigate to server directory
cd server 2>/dev/null || cd .

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "📄 Loaded environment variables from .env file"
else
    echo "⚠️  No .env file found in server directory"
fi

echo ""

# Check Cloudinary configuration
echo "🌩️  Cloudinary Configuration:"
check_env_var "CLOUDINARY_CLOUD_NAME"
check_env_var "CLOUDINARY_API_KEY" 
check_env_var "CLOUDINARY_API_SECRET"

echo ""

# Check if all required variables are set
if check_env_var "CLOUDINARY_CLOUD_NAME" && check_env_var "CLOUDINARY_API_KEY" && check_env_var "CLOUDINARY_API_SECRET"; then
    echo "🎉 All Cloudinary variables are configured! File uploads should work."
else
    echo "⚠️  Some Cloudinary variables are missing or have placeholder values."
    echo ""
    echo "📝 To fix this:"
    echo "1. Go to https://cloudinary.com and create a free account"
    echo "2. Get your Cloud Name, API Key, and API Secret from the dashboard"
    echo "3. Update the following variables in your server/.env file:"
    echo ""
    echo "   CLOUDINARY_CLOUD_NAME=your_actual_cloud_name"
    echo "   CLOUDINARY_API_KEY=your_actual_api_key"
    echo "   CLOUDINARY_API_SECRET=your_actual_api_secret"
    echo ""
fi

# Check server configuration
echo "🖥️  Server Configuration:"
check_env_var "PORT"
echo ""

# Check other optional configurations
echo "🔧 Optional Configurations:"
check_env_var "MONGO_URI"
check_env_var "STRIPE_SECRET_KEY"
check_env_var "TWILIO_ACCOUNT_SID"

echo ""
echo "📖 Documentation:"
echo "- File upload endpoints: /api/upload, /api/upload/client, /api/upload/work"
echo "- Test interface: /upload-test.html"
echo "- Admin interface: /admin"
echo ""

# Test server if it's running
echo "🧪 Testing server connection..."
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Server is running on port 3001"
    
    # Test upload endpoint
    echo "🔄 Testing upload endpoint..."
    response=$(curl -s -X POST http://localhost:3001/api/upload -H "Content-Type: application/json" -d '{}')
    
    if echo "$response" | grep -q "Image upload service not configured"; then
        echo "❌ Upload endpoint reports Cloudinary not configured"
    elif echo "$response" | grep -q "No image file provided"; then
        echo "✅ Upload endpoint is working (ready for file uploads)"
    else
        echo "⚠️  Upload endpoint response: $response"
    fi
else
    echo "❌ Server is not running. Start it with: cd server && npm start"
fi

echo ""
echo "🚀 Setup complete! Use the upload test interface at http://localhost:3001/upload-test.html"
echo ""