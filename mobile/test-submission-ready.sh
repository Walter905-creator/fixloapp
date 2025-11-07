#!/bin/bash
# Test script to validate iOS app fixes
# Run this before submitting to App Store

echo "🧪 Fixlo iOS App - Pre-Submission Validation"
echo "==========================================="
echo ""

cd "$(dirname "$0")"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Test function
test_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $description"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} - $description"
        ((FAILED++))
        return 1
    fi
}

# Test syntax
test_syntax() {
    local file=$1
    local description=$2
    
    if node -c "$file" 2>/dev/null; then
        echo -e "${GREEN}✅ PASS${NC} - $description"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} - $description"
        ((FAILED++))
        return 1
    fi
}

echo "📋 Testing Documentation Files..."
echo "-----------------------------------"
test_file "DEMO_ACCOUNTS.md" "Demo accounts documentation exists"
test_file "APP_REVIEW_INFO.txt" "App review info exists"
test_file "RESUBMISSION_GUIDE.md" "Resubmission guide exists"
test_file "APP_STORE_CONNECT_NOTES.txt" "App Store Connect notes exist"
test_file "FIX_SUMMARY.md" "Fix summary exists"
echo ""

echo "📝 Testing Code Files..."
echo "-----------------------------------"
test_syntax "App.js" "App.js syntax valid"
test_syntax "screens/LoginScreen.js" "LoginScreen.js syntax valid"
test_syntax "screens/SignupScreen.js" "SignupScreen.js syntax valid"
test_syntax "screens/ProSignupScreen.js" "ProSignupScreen.js syntax valid"
test_syntax "screens/HomeownerScreen.js" "HomeownerScreen.js syntax valid"
test_syntax "screens/ProScreen.js" "ProScreen.js syntax valid"
echo ""

echo "🔍 Checking Version Numbers..."
echo "-----------------------------------"

# Check package.json version
PKG_VERSION=$(grep '"version"' package.json | head -1 | cut -d'"' -f4)
if [ "$PKG_VERSION" = "1.0.2" ]; then
    echo -e "${GREEN}✅ PASS${NC} - package.json version is 1.0.2"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - package.json version is $PKG_VERSION (expected 1.0.2)"
    ((FAILED++))
fi

# Check app.config.ts version
if grep -q '"1.0.2"' app.config.ts; then
    echo -e "${GREEN}✅ PASS${NC} - app.config.ts version is 1.0.2"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - app.config.ts version incorrect"
    ((FAILED++))
fi

# Check build number
if grep -q 'buildNumber: "9"' app.config.ts; then
    echo -e "${GREEN}✅ PASS${NC} - iOS build number is 9"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - iOS build number incorrect"
    ((FAILED++))
fi

echo ""

echo "🔐 Verifying Demo Account Credentials..."
echo "-----------------------------------"

# Check for demo credentials in LoginScreen
if grep -q "demo.homeowner@fixloapp.com" screens/LoginScreen.js; then
    echo -e "${GREEN}✅ PASS${NC} - Homeowner demo account in LoginScreen"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Homeowner demo account missing"
    ((FAILED++))
fi

if grep -q "demo.pro@fixloapp.com" screens/LoginScreen.js; then
    echo -e "${GREEN}✅ PASS${NC} - Pro demo account in LoginScreen"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Pro demo account missing"
    ((FAILED++))
fi

if grep -q "Demo2025!" screens/LoginScreen.js; then
    echo -e "${GREEN}✅ PASS${NC} - Demo password configured"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Demo password missing"
    ((FAILED++))
fi

echo ""

echo "🚫 Checking for IAP Code Removal..."
echo "-----------------------------------"

# Check that InAppPurchases is NOT imported
if ! grep -q "InAppPurchases" screens/ProSignupScreen.js; then
    echo -e "${GREEN}✅ PASS${NC} - InAppPurchases removed from ProSignupScreen"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - InAppPurchases still in ProSignupScreen"
    ((FAILED++))
fi

# Check for Linking import (web redirect)
if grep -q "Linking" screens/ProSignupScreen.js; then
    echo -e "${GREEN}✅ PASS${NC} - Linking imported for web redirect"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Linking not imported"
    ((FAILED++))
fi

echo ""

echo "==========================================="
echo "📊 Test Results"
echo "==========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo ""
    echo "✅ Your app is ready for App Store submission!"
    echo ""
    echo "Next steps:"
    echo "1. Build: eas build --platform ios --profile production"
    echo "2. Upload to App Store Connect"
    echo "3. Add demo credentials from APP_STORE_CONNECT_NOTES.txt"
    echo "4. Submit for review"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo "Please fix the issues above before submitting."
    exit 1
fi
