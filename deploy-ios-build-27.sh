#!/bin/bash
# Wrapper script to deploy iOS Build 27 from repository root
# This script ensures deployment runs from the CORRECT directory (/mobile)
# NOT from the root directory that caused Build 26 to fail

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MOBILE_DIR="$SCRIPT_DIR/mobile"
DEPLOY_SCRIPT="$MOBILE_DIR/scripts/deploy-ios-build-27.sh"

# Color codes
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Fixlo iOS Build 27 - App Store Deployment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Correcting Build 26 Directory Issue${NC}"
echo -e "${RED}❌ Build 26 was built from ROOT directory (WRONG)${NC}"
echo -e "${GREEN}✅ Build 27 will be built from /mobile directory (CORRECT)${NC}"
echo ""

# Check if mobile directory exists
if [ ! -d "$MOBILE_DIR" ]; then
    echo -e "${RED}Error: Mobile directory not found at $MOBILE_DIR${NC}"
    exit 1
fi

# Check if deployment script exists
if [ ! -f "$DEPLOY_SCRIPT" ]; then
    echo -e "${RED}Error: Deployment script not found at $DEPLOY_SCRIPT${NC}"
    exit 1
fi

# Verify root directory is NOT being used
if [ -f "$SCRIPT_DIR/App.js" ] && [ "$(basename "$PWD")" != "mobile" ]; then
    echo -e "${YELLOW}⚠️  Root directory contains basic demo App.js${NC}"
    echo -e "${GREEN}✓  This script will correctly use /mobile directory instead${NC}"
    echo ""
fi

# Change to mobile directory and run deployment
echo -e "${BLUE}Changing to mobile directory: $MOBILE_DIR${NC}"
cd "$MOBILE_DIR"

echo -e "${BLUE}Executing deployment script from: $(pwd)${NC}"
echo ""

# Run the deployment script
exec "$DEPLOY_SCRIPT"
