#!/bin/bash

# Fixlo - Pre-Deployment Checklist
echo "🔍 Pre-Deployment Checklist for Fixlo"
echo "================================================"

# Check if required files exist
echo -n "✅ Server package.json exists: "
[ -f "server/package.json" ] && echo "YES" || echo "NO"

echo -n "✅ Client package.json exists: "
[ -f "client/package.json" ] && echo "YES" || echo "NO"

echo -n "✅ Server index.js exists: "
[ -f "server/index.js" ] && echo "YES" || echo "NO"

echo -n "✅ Environment example exists: "
[ -f "server/.env.example" ] && echo "YES" || echo "NO"

echo -n "✅ Deployment guide exists: "
[ -f "DEPLOYMENT.md" ] && echo "YES" || echo "NO"

echo ""
echo "📋 Required Environment Variables:"
echo "   - NODE_ENV=production"
echo "   - MONGODB_URI=your_mongodb_connection"
echo "   - JWT_SECRET=secure_secret_32_chars_min"
echo "   - ADMIN_EMAIL=admin@handyman-connect.com"
echo "   - ADMIN_PASSWORD=secure_password"
echo "   - CLIENT_URL=https://www.handyman-connect.com"
echo ""
echo "🚀 Ready to deploy to Render.com!"
echo "   1. Go to https://render.com"
echo "   2. Connect GitHub repository"
echo "   3. Create Web Service"
echo "   4. Build: npm install"
echo "   5. Start: npm start"
echo "   6. Add environment variables"
echo ""
echo "🎯 After deployment, your API will be at:"
echo "   https://your-service-name.onrender.com"
