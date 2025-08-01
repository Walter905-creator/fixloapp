#!/bin/bash

# Force deployment script to ensure website changes are visible
echo "🚀 FORCE DEPLOYMENT SCRIPT"
echo "=========================="

# Get current timestamp
TIMESTAMP=$(date +"%s")
READABLE_DATE=$(date)

echo "📅 Deployment Time: $READABLE_DATE"
echo "🔢 Timestamp: $TIMESTAMP"

# Update deployment trigger
echo "# Deploy trigger - $READABLE_DATE" > .deploy-trigger
echo "# Cache busting deployment - Force Vercel rebuild - $TIMESTAMP" >> .deploy-trigger

# Update README with deployment marker
sed -i "s/Deploy trigger:.*/Deploy trigger: $READABLE_DATE - Force cache bust deployment/" README.md

# Build with cache busting
echo "🏗️  Building with cache busting..."
export REACT_APP_BUILD_ID="1.0.0-$TIMESTAMP"
export REACT_APP_BUILD_TIMESTAMP="$TIMESTAMP"
npm run build:deploy

echo ""
echo "✅ DEPLOYMENT READY!"
echo "==================="
echo "📂 Build directory updated with timestamp: $TIMESTAMP"
echo "🔧 Cache busting headers applied"
echo "📝 Deployment trigger updated"
echo ""
echo "🌐 Next steps:"
echo "   1. Commit and push these changes"
echo "   2. Vercel will automatically rebuild"
echo "   3. Changes will be visible immediately"
echo ""
echo "💡 If changes still don't show:"
echo "   - Clear browser cache (Ctrl+Shift+R)"
echo "   - Check browser dev tools for 304 vs 200 responses"
echo "   - Verify deployment completed on Vercel dashboard"