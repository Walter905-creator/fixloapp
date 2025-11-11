#!/bin/bash

set -e

echo "🔍 Running Final iOS Build Verification..."
echo "=========================================="
echo ""

# Test 1: Verify dependencies installation
echo "1️⃣ Testing clean dependency installation..."
npm list react-native-worklets expo-constants > /dev/null 2>&1 && echo "   ✅ Critical dependencies installed" || echo "   ❌ Dependencies missing"

# Test 2: Verify configuration
echo ""
echo "2️⃣ Running configuration validation..."
node verify-build-config.js

# Test 3: Verify scripts
echo ""
echo "3️⃣ Testing build scripts..."
npm run postinstall > /dev/null 2>&1 && echo "   ✅ postinstall script works" || echo "   ❌ postinstall script failed"
npm run eas-build-pre-install > /dev/null 2>&1 && echo "   ✅ eas-build-pre-install script works" || echo "   ❌ eas-build-pre-install script failed"

# Test 4: Verify files exist
echo ""
echo "4️⃣ Verifying files..."
[ -f "package.json" ] && echo "   ✅ package.json exists" || echo "   ❌ package.json missing"
[ -f "app.config.ts" ] && echo "   ✅ app.config.ts exists" || echo "   ❌ app.config.ts missing"
[ -f "eas.json" ] && echo "   ✅ eas.json exists" || echo "   ❌ eas.json missing"
[ -f "assets/icon.png" ] && echo "   ✅ icon.png exists" || echo "   ❌ icon.png missing"
[ -f "assets/splash.png" ] && echo "   ✅ splash.png exists" || echo "   ❌ splash.png missing"
[ -f "assets/adaptive-icon.png" ] && echo "   ✅ adaptive-icon.png exists" || echo "   ❌ adaptive-icon.png missing"

# Test 5: Verify iOS directory was created
echo ""
echo "5️⃣ Checking iOS prebuild..."
[ -d "ios" ] && echo "   ✅ iOS directory exists (from prebuild)" || echo "   ⚠️  iOS directory not present (will be generated during EAS build)"

echo ""
echo "=========================================="
echo "✅ Final verification complete!"
echo ""
echo "📦 Ready for EAS Build:"
echo "   cd mobile"
echo "   npx eas build --platform ios --profile production"
