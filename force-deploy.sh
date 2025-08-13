#!/bin/bash
# Force deployment trigger for Vercel
# This script creates a deploy trigger to force Vercel to rebuild and deploy

echo "🚀 Triggering forced deployment..."

# Create a deployment trigger file
echo "$(date '+%Y-%m-%d %H:%M:%S') - Force deployment trigger" > .deploy-trigger

# Add deployment information
echo "Commit: $(git rev-parse HEAD)" >> .deploy-trigger
echo "Bundle: main.90157fc5.js" >> .deploy-trigger
echo "Features: All enabled" >> .deploy-trigger

echo "✅ Deployment trigger created"
echo "📝 Contents:"
cat .deploy-trigger

echo ""
echo "🔄 Next steps:"
echo "1. Commit and push this trigger file"
echo "2. Vercel will automatically detect the change and redeploy"
echo "3. The new build with bundle hash main.90157fc5.js will be live"