#!/bin/bash
# iOS App Store Submission Script
# Submits the latest EAS build to App Store Connect
# App Version: 1.0.3 | Build Number: 15 | Bundle ID: com.fixloapp.mobile

set -e  # Exit on any error

echo "📱 Fixlo iOS App Store Submission"
echo "=================================="
echo ""
echo "App Store Connect Details:"
echo "  • App ID: 6754519765"
echo "  • Version: 1.0.3"
echo "  • Build Number: 15"
echo "  • Bundle ID: com.fixloapp.mobile"
echo ""

# Verify we're in the mobile directory
if [ ! -f "app.config.js" ]; then
  echo "❌ Error: Must run from /mobile directory"
  echo "   Run: cd /workspaces/fixloapp/mobile && ./submit-ios.sh"
  exit 1
fi

# Verify app.config.js has correct version and build
echo "🔍 Verifying app.config.js configuration..."
if ! grep -q '"1.0.3"' app.config.js; then
  echo "⚠️  Warning: Version may not be 1.0.3 in app.config.js"
fi
if ! grep -q 'buildNumber: "15"' app.config.js; then
  echo "⚠️  Warning: Build number may not be 15 in app.config.js"
fi

echo ""
echo "🚀 Submitting latest iOS build to App Store Connect..."
echo ""

# Submit the latest build to App Store Connect
npx eas submit --platform ios --latest

echo ""
echo "✅ Submission complete!"
echo ""
echo "Next Steps:"
echo "  1. Check App Store Connect at https://appstoreconnect.apple.com"
echo "  2. Verify build 15 appears under TestFlight"
echo "  3. Submit for App Store review when ready"
echo "  4. Monitor review status and respond to any feedback"
echo ""
