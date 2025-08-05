#!/bin/bash
echo "🔧 Installing backend dependencies..."
cd ../backend || cd ../server
npm install cloudinary multer multer-storage-cloudinary bcryptjs jsonwebtoken

echo "🎨 Installing frontend dependencies..."
cd ../client || cd ..
npm install react-router-dom axios

echo "✅ Dependencies installed successfully!"
echo ""
echo "📋 Environment Variables Required:"
echo "Add these to your backend .env file:"
echo "CLOUDINARY_NAME=your_cloudinary_name"
echo "CLOUDINARY_KEY=your_cloudinary_api_key" 
echo "CLOUDINARY_SECRET=your_cloudinary_api_secret"
echo "JWT_SECRET=your_jwt_secret_key"
echo "MONGODB_URI=your_mongodb_connection_string"