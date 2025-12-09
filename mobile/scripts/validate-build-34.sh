#!/bin/bash

# Build 34 Pre-Build Validation Script
# Validates all aspects of the mobile app before building

set -e  # Exit on any error

echo "🔍 Build 34 Pre-Build Validation Script"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track validation status
ERRORS=0
WARNINGS=0

# Helper functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ERRORS=$((ERRORS + 1))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

print_info() {
    echo -e "ℹ️  $1"
}

# Navigate to mobile directory
cd "$(dirname "$0")/.." || exit 1

echo "📂 Working directory: $(pwd)"
echo ""

# 1. File Syntax Validation
echo "1️⃣  Checking JavaScript Syntax..."
echo "-----------------------------------"

if node -c App.js 2>/dev/null; then
    print_success "App.js syntax valid"
else
    print_error "App.js has syntax errors"
fi

if node -c components/ServicesGrid.js 2>/dev/null; then
    print_success "ServicesGrid.js syntax valid"
else
    print_error "ServicesGrid.js has syntax errors"
fi

echo ""

# 2. Configuration Validation
echo "2️⃣  Checking Build Configuration..."
echo "-----------------------------------"

# Check app.config.js
if [ -f "app.config.js" ]; then
    print_success "app.config.js exists"
    
    # Validate config content
    BUILD_NUM=$(node -e "const c=require('./app.config.js'); const cfg=c.default||c; console.log(cfg.expo.ios.buildNumber);" 2>/dev/null)
    VERSION_CODE=$(node -e "const c=require('./app.config.js'); const cfg=c.default||c; console.log(cfg.expo.android.versionCode);" 2>/dev/null)
    APP_VERSION=$(node -e "const c=require('./app.config.js'); const cfg=c.default||c; console.log(cfg.expo.version);" 2>/dev/null)
    
    if [ "$BUILD_NUM" = "34" ]; then
        print_success "iOS Build Number: 34"
    else
        print_error "iOS Build Number incorrect: $BUILD_NUM (expected 34)"
    fi
    
    if [ "$VERSION_CODE" = "34" ]; then
        print_success "Android Version Code: 34"
    else
        print_error "Android Version Code incorrect: $VERSION_CODE (expected 34)"
    fi
    
    if [ "$APP_VERSION" = "1.0.2" ]; then
        print_success "App Version: 1.0.2"
    else
        print_warning "App Version: $APP_VERSION (expected 1.0.2)"
    fi
else
    print_error "app.config.js not found"
fi

echo ""

# 3. Asset Validation
echo "3️⃣  Checking Required Assets..."
echo "-----------------------------------"

REQUIRED_ASSETS=("assets/fixlo-logo.png" "assets/icon.png" "assets/splash.png" "assets/adaptive-icon.png")

for asset in "${REQUIRED_ASSETS[@]}"; do
    if [ -f "$asset" ]; then
        print_success "$asset exists"
    else
        print_error "$asset missing"
    fi
done

echo ""

# 4. Hard-coded URL Check
echo "4️⃣  Checking for Hard-coded URLs..."
echo "-----------------------------------"

LOCALHOST_COUNT=$(grep -r "localhost" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v node_modules | grep -v ".git" | wc -l || echo "0")

if [ "$LOCALHOST_COUNT" -eq 0 ]; then
    print_success "No localhost references found"
else
    print_warning "Found $LOCALHOST_COUNT localhost reference(s)"
fi

HTTP_COUNT=$(grep -r "http://" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v node_modules | grep -v ".git" | grep -v "//http" | wc -l || echo "0")

if [ "$HTTP_COUNT" -eq 0 ]; then
    print_success "No hard-coded HTTP URLs found"
else
    print_warning "Found $HTTP_COUNT hard-coded HTTP URL(s)"
fi

echo ""

# 5. Dependency Check
echo "5️⃣  Checking Dependencies..."
echo "-----------------------------------"

if [ -f "package.json" ]; then
    print_success "package.json exists"
    
    # Check if node_modules exists
    if [ -d "node_modules" ]; then
        print_success "node_modules directory exists"
    else
        print_warning "node_modules not found - run 'npm install'"
    fi
else
    print_error "package.json not found"
fi

echo ""

# 6. Navigation Validation
echo "6️⃣  Checking Navigation Configuration..."
echo "-----------------------------------"

# Check that all referenced screens exist
SCREENS=(
    "HomeownerScreen"
    "ProScreen"
    "ProSignupScreen"
    "HomeownerJobRequestScreen"
    "LoginScreen"
    "HowItWorksScreen"
    "AboutScreen"
    "ContactScreen"
    "FAQScreen"
    "TrustSafetyScreen"
    "PricingScreen"
    "TermsScreen"
    "PrivacyScreen"
)

SCREEN_ERRORS=0
for screen in "${SCREENS[@]}"; do
    if [ -f "screens/${screen}.js" ]; then
        # Screen exists
        :
    else
        print_error "Screen not found: screens/${screen}.js"
        SCREEN_ERRORS=$((SCREEN_ERRORS + 1))
    fi
done

if [ $SCREEN_ERRORS -eq 0 ]; then
    print_success "All referenced screens exist"
fi

echo ""

# 7. Component Validation
echo "7️⃣  Checking Components..."
echo "-----------------------------------"

if [ -f "components/ServicesGrid.js" ]; then
    print_success "ServicesGrid.js exists"
else
    print_error "ServicesGrid.js not found"
fi

echo ""

# 8. Build Files Check
echo "8️⃣  Checking for Unwanted Build Artifacts..."
echo "-----------------------------------"

if [ -d ".expo" ]; then
    print_warning ".expo directory exists (clean build recommended)"
else
    print_success "No .expo directory (clean state)"
fi

echo ""

# Summary
echo "========================================="
echo "📊 Validation Summary"
echo "========================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    print_success "ALL VALIDATIONS PASSED! ✨"
    echo ""
    echo "🚀 Build 34 is ready for production build"
    echo ""
    echo "Next steps:"
    echo "  1. Run: eas build --platform ios --profile production"
    echo "  2. Run: eas build --platform android --profile production"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Passed with $WARNINGS warning(s)${NC}"
    echo ""
    echo "Build can proceed, but review warnings above."
    echo ""
    exit 0
else
    echo -e "${RED}❌ VALIDATION FAILED with $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo ""
    echo "Please fix the errors above before building."
    echo ""
    exit 1
fi
