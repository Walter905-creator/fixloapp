#!/bin/bash
# Verification script for Build 26 deployment readiness
# This script checks that all prerequisites are met before deployment

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

log_check() {
    echo -e "${BLUE}🔍 Checking: $1${NC}"
}

log_pass() {
    echo -e "${GREEN}  ✅ $1${NC}"
}

log_fail() {
    echo -e "${RED}  ❌ $1${NC}"
    ((ERRORS++))
}

log_warn() {
    echo -e "${YELLOW}  ⚠️  $1${NC}"
    ((WARNINGS++))
}

log_info() {
    echo -e "${BLUE}  ℹ️  $1${NC}"
}

# Initialize exit code
EXIT_CODE=0

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Build 26 Deployment - Readiness Verification${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check 1: Directory structure
log_check "Directory structure"
if [ -d "mobile" ]; then
    log_pass "mobile/ directory exists"
else
    log_fail "mobile/ directory not found"
fi

if [ -f "mobile/app.config.js" ]; then
    log_pass "app.config.js exists"
else
    log_fail "app.config.js not found"
fi

if [ -f "mobile/scripts/deploy-ios-build-26.sh" ]; then
    log_pass "Deployment script exists"
else
    log_fail "Deployment script not found"
fi

if [ -x "mobile/scripts/deploy-ios-build-26.sh" ]; then
    log_pass "Deployment script is executable"
else
    log_fail "Deployment script is not executable"
fi

echo ""

# Check 2: Node.js and npm
log_check "Node.js and npm"
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    log_pass "Node.js installed: $NODE_VERSION"
    
    # Check version
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -ge 18 ]; then
        log_pass "Node.js version >= 18"
    else
        log_fail "Node.js version < 18 (found: $NODE_VERSION)"
    fi
else
    log_fail "Node.js not installed"
fi

if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    log_pass "npm installed: $NPM_VERSION"
else
    log_fail "npm not installed"
fi

echo ""

# Check 3: Build configuration
log_check "Build configuration in app.config.js"
if [ -f "mobile/app.config.js" ]; then
    VERSION=$(grep -o 'version: "[^"]*"' mobile/app.config.js | head -1 | grep -o '[0-9.]*' || echo "")
    BUILD_NUM=$(grep -o 'buildNumber: "[0-9]*"' mobile/app.config.js | grep -o '[0-9]*' || echo "")
    
    if [ -z "$VERSION" ]; then
        log_fail "Could not extract version from app.config.js"
    elif [ "$VERSION" == "1.0.26" ]; then
        log_pass "Version is 1.0.26"
    else
        log_fail "Version is $VERSION (expected 1.0.26)"
    fi
    
    if [ -z "$BUILD_NUM" ]; then
        log_fail "Could not extract build number from app.config.js"
    elif [ "$BUILD_NUM" == "26" ]; then
        log_pass "Build number is 26"
    else
        log_fail "Build number is $BUILD_NUM (expected 26)"
    fi
    
    # Check bundle ID
    if grep -q 'bundleIdentifier: "com.fixloapp.mobile"' mobile/app.config.js; then
        log_pass "Bundle ID is correct: com.fixloapp.mobile"
    else
        log_warn "Bundle ID may not match expected value"
    fi
    
    # Check owner
    if grep -q 'owner: "fixlo-app"' mobile/app.config.js; then
        log_pass "Expo owner is correct: fixlo-app"
    else
        log_warn "Expo owner may not match expected value"
    fi
fi

echo ""

# Check 4: Required assets
log_check "Required assets"
if [ -f "mobile/assets/icon.png" ]; then
    log_pass "App icon exists"
else
    log_warn "App icon not found at mobile/assets/icon.png"
fi

if [ -f "mobile/assets/splash.png" ]; then
    log_pass "Splash screen exists"
else
    log_warn "Splash screen not found at mobile/assets/splash.png"
fi

echo ""

# Check 5: EAS configuration
log_check "EAS configuration"
if [ -f "mobile/eas.json" ]; then
    log_pass "eas.json exists"
    
    if grep -q '"production"' mobile/eas.json; then
        log_pass "Production profile configured"
    else
        log_warn "Production profile not found in eas.json"
    fi
else
    log_fail "eas.json not found"
fi

echo ""

# Check 6: Environment
log_check "Environment variables"
if [ -n "$EXPO_TOKEN" ]; then
    log_pass "EXPO_TOKEN is set (non-interactive mode)"
else
    log_warn "EXPO_TOKEN not set (will require interactive login)"
    log_info "Set EXPO_TOKEN for fully automated deployment"
fi

echo ""

# Check 7: npx availability
log_check "npx (for EAS CLI)"
if command -v npx >/dev/null 2>&1; then
    log_pass "npx is available"
else
    log_fail "npx not found (required for EAS CLI)"
fi

echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Verification Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo -e "${GREEN}✅ Ready to deploy Build 26${NC}"
    echo ""
    echo "Run deployment with:"
    echo "  ./deploy-ios-build-26.sh"
    EXIT_CODE=0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found${NC}"
    echo -e "${GREEN}✅ No critical errors - can proceed with deployment${NC}"
    echo ""
    echo "Review warnings above, then run:"
    echo "  ./deploy-ios-build-26.sh"
    EXIT_CODE=0
else
    echo -e "${RED}❌ $ERRORS error(s) found${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found${NC}"
    fi
    echo ""
    echo "Fix errors above before deploying"
    EXIT_CODE=1
fi

echo ""
exit $EXIT_CODE
