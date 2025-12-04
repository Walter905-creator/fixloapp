#!/bin/bash
# Quick execution script for Build 27 deployment
# This script can be run once EXPO_TOKEN is available
# 
# Usage:
#   export EXPO_TOKEN="your-token-here"
#   ./execute-build-27.sh

set -e

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}═════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Fixlo Build 27 - Quick Execution Script${NC}"
echo -e "${BLUE}═════════════════════════════════════════════════════════════${NC}"
echo ""

# Check EXPO_TOKEN
if [ -z "$EXPO_TOKEN" ]; then
    echo -e "${RED}❌ EXPO_TOKEN is not set${NC}"
    echo ""
    echo "Please set EXPO_TOKEN before running this script:"
    echo "  export EXPO_TOKEN=\"your-token-here\""
    echo ""
    echo "Then run:"
    echo "  ./execute-build-27.sh"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ EXPO_TOKEN is configured${NC}"
echo ""

# Verify we're in the mobile directory
CURRENT_DIR=$(basename "$(pwd)")
if [ "$CURRENT_DIR" != "mobile" ]; then
    echo -e "${RED}❌ This script must be run from the /mobile directory${NC}"
    echo -e "${YELLOW}Current directory: $(pwd)${NC}"
    echo ""
    echo "Please run:"
    echo "  cd /home/runner/work/fixloapp/fixloapp/mobile"
    echo "  ./execute-build-27.sh"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Running from mobile directory: $(pwd)${NC}"
echo ""

# Verify configuration
echo -e "${BLUE}Verifying Build 27 configuration...${NC}"
VERSION=$(grep -o 'version: "[^"]*"' app.config.js | head -1 | grep -o '[0-9.]*')
BUILD_NUM=$(grep -o 'buildNumber: "[0-9]*"' app.config.js | grep -o '[0-9]*')

if [ "$VERSION" != "1.0.27" ] || [ "$BUILD_NUM" != "27" ]; then
    echo -e "${RED}❌ Configuration mismatch${NC}"
    echo "  Expected: Version 1.0.27, Build 27"
    echo "  Found: Version $VERSION, Build $BUILD_NUM"
    exit 1
fi

echo -e "${GREEN}✅ Configuration verified: Version $VERSION, Build $BUILD_NUM${NC}"
echo ""

# Ask for confirmation
echo -e "${YELLOW}This will execute the following steps:${NC}"
echo "  1. Build iOS app for production"
echo "  2. Capture Build ID"
echo "  3. Submit to App Store Connect"
echo ""
echo -e "${YELLOW}Build will be created from: $(pwd)${NC}"
echo -e "${YELLOW}Build will take approximately 15-25 minutes${NC}"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled by user${NC}"
    exit 0
fi

# Execute the deployment script
echo ""
echo -e "${BLUE}Starting Build 27 deployment...${NC}"
echo ""

exec ./scripts/deploy-ios-build-27.sh
