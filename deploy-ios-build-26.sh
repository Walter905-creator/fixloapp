#!/bin/bash
# Wrapper script to deploy iOS Build 26 from repository root
# This script ensures the deployment runs from the correct directory

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MOBILE_DIR="$SCRIPT_DIR/mobile"
DEPLOY_SCRIPT="$MOBILE_DIR/scripts/deploy-ios-build-26.sh"

# Color codes
BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Fixlo iOS Build 26 - App Store Deployment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}PR #522 merged - Build 26 ready for deployment${NC}"
echo ""

# Check if mobile directory exists
if [ ! -d "$MOBILE_DIR" ]; then
    echo "Error: Mobile directory not found at $MOBILE_DIR"
    exit 1
fi

# Check if deployment script exists
if [ ! -f "$DEPLOY_SCRIPT" ]; then
    echo "Error: Deployment script not found at $DEPLOY_SCRIPT"
    exit 1
fi

# Change to mobile directory and run deployment
echo "Changing to mobile directory: $MOBILE_DIR"
cd "$MOBILE_DIR"

echo "Executing deployment script..."
echo ""

# Run the deployment script
exec "$DEPLOY_SCRIPT"
