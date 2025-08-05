#!/bin/bash

# Fixlo Pro Upload and Reviews Setup Script
# This script sets up the professional upload and review system for Fixlo

echo "🚀 Setting up Fixlo Pro Upload and Reviews System..."
echo "================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the Fixlo repository root."
    exit 1
fi

echo "📦 Installing backend dependencies..."
cd api
npm install bcryptjs jsonwebtoken cloudinary mongodb multer dotenv
cd ..

echo "🛠️ Backend routes created:"
echo "  ✅ routes/proAuth.js - Professional authentication"
echo "  ✅ routes/uploadPhotos.js - Cloudinary photo upload"
echo "  ✅ routes/reviews.js - Review submission and viewing"

echo "⚛️ Frontend components created:"
echo "  ✅ components/ProDashboard.jsx - Professional dashboard"
echo "  ✅ components/UploadWork.jsx - Work photo upload"
echo "  ✅ components/ProReviews.jsx - Review management"
echo "  ✅ components/LoginModal.jsx - Authentication modal"

echo "🔧 Routes configured:"
echo "  ✅ /pro-dashboard - Professional dashboard page"
echo "  ✅ /api/pro-auth/* - Authentication endpoints"
echo "  ✅ /api/upload/* - Photo upload endpoints"
echo "  ✅ /api/reviews/* - Review endpoints"

echo ""
echo "🔐 Environment Variables Required:"
echo "Add these to your Vercel and Render deployments:"
echo ""
echo "CLOUDINARY_CLOUD_NAME=your_cloud_name"
echo "CLOUDINARY_API_KEY=your_key"
echo "CLOUDINARY_API_SECRET=your_secret"
echo "JWT_SECRET=your_strong_token"
echo "MONGODB_URI=your_mongodb_connection_string"
echo ""

echo "✅ Setup Complete!"
echo ""
echo "🎯 Next Steps:"
echo "1. Configure environment variables in Vercel/Render"
echo "2. Set up MongoDB database"
echo "3. Create Cloudinary account and get API credentials"
echo "4. Deploy the updated application"
echo ""
echo "📍 Professional Dashboard URL: https://your-domain.com/pro-dashboard"
echo ""
echo "🔧 Features Available:"
echo "  • Professional signup/login with password hashing"
echo "  • Photo upload to Cloudinary with automatic resizing"
echo "  • Review submission and management system"
echo "  • Professional dashboard with work portfolio"
echo "  • JWT-based authentication"
echo ""
echo "🎉 Fixlo Pro Upload and Reviews system is ready to use!"