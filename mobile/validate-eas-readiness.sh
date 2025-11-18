#!/bin/bash

# EAS Build Readiness Validation Script
# This script validates all EAS build requirements

echo "======================================"
echo "EAS BUILD READINESS VALIDATION"
echo "======================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to print success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
error() {
    echo -e "${RED}❌ $1${NC}"
    ((ERRORS++))
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

echo "1. Validating app.config.js..."
echo "-----------------------------------"

# Check if app.config.js exists
if [ -f "app.config.js" ]; then
    success "app.config.js exists"
    
    # Validate configuration
    node -e "const config = require('./app.config.js'); 
    const expo = config.default?.expo || config.expo;
    
    // Check required fields
    if (!expo.name) { console.error('Missing: name'); process.exit(1); }
    if (!expo.slug) { console.error('Missing: slug'); process.exit(1); }
    if (!expo.version) { console.error('Missing: version'); process.exit(1); }
    if (!expo.ios?.bundleIdentifier) { console.error('Missing: ios.bundleIdentifier'); process.exit(1); }
    if (!expo.android?.package) { console.error('Missing: android.package'); process.exit(1); }
    if (!expo.ios?.buildNumber) { console.error('Missing: ios.buildNumber'); process.exit(1); }
    if (!expo.android?.versionCode) { console.error('Missing: android.versionCode'); process.exit(1); }
    
    console.log('All required fields present');
    " && success "All required app.config.js fields present" || error "Missing required app.config.js fields"
    
    # Validate semantic versioning
    VERSION=$(node -e "const config = require('./app.config.js'); console.log(config.default?.expo?.version || config.expo?.version);")
    if [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        success "Version follows semantic versioning: $VERSION"
    else
        error "Version does not follow semantic versioning: $VERSION"
    fi
    
    # Check runtimeVersion
    RUNTIME_VERSION=$(node -e "const config = require('./app.config.js'); console.log(config.default?.expo?.runtimeVersion || config.expo?.runtimeVersion || 'undefined');")
    if [ "$RUNTIME_VERSION" != "undefined" ]; then
        success "runtimeVersion configured: $RUNTIME_VERSION"
    else
        warning "runtimeVersion not configured (OTA updates may not work optimally)"
    fi
    
else
    error "app.config.js not found"
fi

echo ""
echo "2. Validating eas.json..."
echo "-----------------------------------"

if [ -f "eas.json" ]; then
    success "eas.json exists"
    
    # Check build profiles
    if jq -e '.build.production' eas.json > /dev/null 2>&1; then
        success "Production build profile exists"
    else
        error "Production build profile missing"
    fi
    
    if jq -e '.build.preview' eas.json > /dev/null 2>&1; then
        success "Preview build profile exists"
    else
        warning "Preview build profile missing"
    fi
    
    # Check node version
    NODE_VERSION=$(jq -r '.build.production.node // "not set"' eas.json)
    if [ "$NODE_VERSION" != "not set" ]; then
        success "Node version specified: $NODE_VERSION"
    else
        warning "Node version not specified in production profile"
    fi
    
else
    error "eas.json not found"
fi

echo ""
echo "3. Validating Dependencies..."
echo "-----------------------------------"

if [ -f "package.json" ]; then
    success "package.json exists"
    
    # Check for expo-updates
    if grep -q '"expo-updates"' package.json; then
        success "expo-updates installed"
    else
        warning "expo-updates not installed (OTA updates unavailable)"
    fi
    
    # Check for react-native-gesture-handler
    if grep -q '"react-native-gesture-handler"' package.json; then
        success "react-native-gesture-handler installed"
    else
        warning "react-native-gesture-handler not installed (may cause navigation issues)"
    fi
    
    # Check Expo version
    EXPO_VERSION=$(jq -r '.dependencies.expo // "not found"' package.json)
    success "Expo version: $EXPO_VERSION"
    
else
    error "package.json not found"
fi

echo ""
echo "4. Validating Assets..."
echo "-----------------------------------"

# Check icon
if [ -f "assets/icon.png" ]; then
    success "Icon exists (assets/icon.png)"
    # Check dimensions using file command
    ICON_INFO=$(file assets/icon.png)
    if echo "$ICON_INFO" | grep -q "1024 x 1024"; then
        success "Icon has correct dimensions (1024x1024)"
    else
        warning "Icon may not have correct dimensions (should be 1024x1024)"
    fi
else
    error "Icon not found (assets/icon.png)"
fi

# Check splash
if [ -f "assets/splash.png" ]; then
    success "Splash screen exists (assets/splash.png)"
else
    error "Splash screen not found (assets/splash.png)"
fi

# Check adaptive icon
if [ -f "assets/adaptive-icon.png" ]; then
    success "Adaptive icon exists (assets/adaptive-icon.png)"
else
    warning "Adaptive icon not found (assets/adaptive-icon.png)"
fi

echo ""
echo "5. Validating Environment Variables..."
echo "-----------------------------------"

if [ -f ".env" ]; then
    success ".env file exists"
    
    if grep -q "EXPO_PUBLIC_API_URL" .env; then
        API_URL=$(grep EXPO_PUBLIC_API_URL .env | cut -d '=' -f2)
        success "EXPO_PUBLIC_API_URL configured: $API_URL"
    else
        warning "EXPO_PUBLIC_API_URL not found in .env"
    fi
else
    warning ".env file not found"
fi

echo ""
echo "6. Validating Native Directories..."
echo "-----------------------------------"

if [ -d "ios" ]; then
    error "ios/ directory exists in mobile folder (should be Expo-managed only)"
else
    success "No ios/ directory (Expo-managed)"
fi

if [ -d "android" ]; then
    error "android/ directory exists in mobile folder (should be Expo-managed only)"
else
    success "No android/ directory (Expo-managed)"
fi

echo ""
echo "======================================"
echo "VALIDATION SUMMARY"
echo "======================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL CHECKS PASSED! Project is ready for EAS build.${NC}"
    echo ""
    echo "You can now run:"
    echo "  npx eas build --platform ios"
    echo "  npx eas build --platform android"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  ALL CRITICAL CHECKS PASSED with $WARNINGS warnings${NC}"
    echo ""
    echo "Project is buildable but consider addressing warnings."
    echo ""
    echo "You can run:"
    echo "  npx eas build --platform ios"
    echo "  npx eas build --platform android"
    exit 0
else
    echo -e "${RED}❌ VALIDATION FAILED with $ERRORS errors and $WARNINGS warnings${NC}"
    echo ""
    echo "Please fix the errors above before attempting to build."
    exit 1
fi
