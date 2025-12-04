#!/bin/bash
# Submit Build 27 to App Store Connect
# This script submits a completed EAS build to App Store Connect
#
# Usage:
#   ./submit-build-27.sh [BUILD_ID]
#
# If BUILD_ID is not provided, the script will list recent builds

set -e

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Fixlo Build 27 - App Store Connect Submission${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Check EXPO_TOKEN
if [ -z "$EXPO_TOKEN" ]; then
    echo -e "${RED}❌ EXPO_TOKEN is not set${NC}"
    echo ""
    echo "This script requires EXPO_TOKEN to submit to App Store."
    echo ""
    echo "Set it with:"
    echo "  export EXPO_TOKEN='your-expo-token'"
    echo ""
    echo "Or run this from GitHub Actions where EXPO_TOKEN is in secrets."
    exit 1
fi

echo -e "${GREEN}✅ EXPO_TOKEN is configured${NC}"
echo ""

# Ensure we're in the mobile directory or navigate there
if [ ! -f "app.config.js" ]; then
    if [ -f "mobile/app.config.js" ]; then
        echo "Navigating to mobile directory..."
        cd mobile
    else
        echo -e "${RED}❌ Cannot find mobile directory${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ In mobile directory: $(pwd)${NC}"
echo ""

# Build ID from argument
BUILD_ID="$1"

if [ -z "$BUILD_ID" ]; then
    echo -e "${YELLOW}No Build ID provided${NC}"
    echo ""
    echo -e "${BLUE}Fetching recent iOS builds...${NC}"
    echo ""
    
    npx eas-cli@latest build:list \
        --platform ios \
        --limit 10 \
        --non-interactive
    
    echo ""
    echo -e "${YELLOW}Please run this script with a Build ID:${NC}"
    echo "  ./submit-build-27.sh <BUILD_ID>"
    echo ""
    echo "Copy the Build ID from the list above (36-character UUID)"
    echo "The Build ID should be for build #27 with status 'Finished'"
    echo ""
    exit 1
fi

echo -e "${CYAN}Build ID:${NC} $BUILD_ID"
echo ""

# Validate Build ID format (UUID)
UUID_PATTERN='^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
if ! echo "$BUILD_ID" | grep -qE "$UUID_PATTERN"; then
    echo -e "${RED}❌ Invalid Build ID format${NC}"
    echo ""
    echo "Build ID should be a UUID (36 characters)"
    echo "Example: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Build ID format is valid${NC}"
echo ""

# Get build details
echo -e "${BLUE}Fetching build details...${NC}"
echo ""

BUILD_INFO=$(npx eas-cli@latest build:view "$BUILD_ID" --json 2>/dev/null || echo "")

if [ -z "$BUILD_INFO" ]; then
    echo -e "${RED}❌ Could not fetch build details${NC}"
    echo ""
    echo "Please verify:"
    echo "  1. Build ID is correct"
    echo "  2. Build exists in Expo dashboard"
    echo "  3. EXPO_TOKEN has access to fixlo-app account"
    echo ""
    exit 1
fi

# Parse build info
BUILD_PLATFORM=$(echo "$BUILD_INFO" | jq -r '.platform')
BUILD_STATUS=$(echo "$BUILD_INFO" | jq -r '.status')
BUILD_NUMBER=$(echo "$BUILD_INFO" | jq -r '.buildNumber // "N/A"')
BUILD_VERSION=$(echo "$BUILD_INFO" | jq -r '.version // "N/A"')

echo -e "${CYAN}Build Details:${NC}"
echo "  Platform: $BUILD_PLATFORM"
echo "  Status: $BUILD_STATUS"
echo "  Version: $BUILD_VERSION"
echo "  Build Number: $BUILD_NUMBER"
echo ""

# Verify platform is iOS
if [ "$BUILD_PLATFORM" != "ios" ]; then
    echo -e "${RED}❌ This build is not for iOS platform${NC}"
    echo ""
    echo "Expected: ios"
    echo "Found: $BUILD_PLATFORM"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Platform verified: iOS${NC}"
echo ""

# Verify build is finished
if [ "$BUILD_STATUS" != "FINISHED" ]; then
    echo -e "${YELLOW}⚠️  Build is not finished yet${NC}"
    echo ""
    echo "Current status: $BUILD_STATUS"
    echo ""
    echo "Please wait for build to complete before submitting."
    echo "You can monitor build progress at:"
    echo "  https://expo.dev/accounts/fixlo-app/projects/fixloapp/builds/$BUILD_ID"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Build is finished and ready to submit${NC}"
echo ""

# Verify build number matches Build 27
if [ "$BUILD_NUMBER" != "27" ]; then
    echo -e "${YELLOW}⚠️  Build number mismatch${NC}"
    echo ""
    echo "Expected: 27"
    echo "Found: $BUILD_NUMBER"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled by user"
        exit 0
    fi
fi

# Final confirmation
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  Ready to Submit to App Store Connect${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "This will submit build to App Store Connect:"
echo ""
echo "  Build ID: $BUILD_ID"
echo "  Platform: iOS"
echo "  Version: $BUILD_VERSION"
echo "  Build Number: $BUILD_NUMBER"
echo ""
echo "The build will be:"
echo "  1. Uploaded to App Store Connect"
echo "  2. Available in TestFlight (after processing)"
echo "  3. Ready for review and submission"
echo ""
read -p "Proceed with submission? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Submission cancelled by user${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}Starting submission to App Store Connect...${NC}"
echo ""

# Submit to App Store
npx eas-cli@latest submit \
    --platform ios \
    --id "$BUILD_ID" \
    --non-interactive

SUBMIT_EXIT_CODE=$?

echo ""

if [ $SUBMIT_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✅ Submission Successful!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo ""
    echo "1. Check App Store Connect"
    echo "   https://appstoreconnect.apple.com"
    echo ""
    echo "2. Wait for processing (10-30 minutes)"
    echo "   Status will change from 'Processing' to 'Ready to Submit'"
    echo ""
    echo "3. Build will appear in TestFlight"
    echo "   Can be shared with internal/external testers"
    echo ""
    echo "4. Monitor build status"
    echo "   Navigate to: My Apps → Fixlo → TestFlight → iOS"
    echo ""
    echo -e "${CYAN}Build Information:${NC}"
    echo "  Version: $BUILD_VERSION (Build $BUILD_NUMBER)"
    echo "  Platform: iOS"
    echo "  Build ID: $BUILD_ID"
    echo ""
    echo -e "${GREEN}Build 27 submission complete!${NC}"
    echo ""
else
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}  ❌ Submission Failed${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "The submission encountered an error."
    echo ""
    echo -e "${CYAN}Common Issues:${NC}"
    echo ""
    echo "1. App Store Connect API key not configured"
    echo "   - Set up in Expo dashboard"
    echo "   - Or provide via --apple-id flag"
    echo ""
    echo "2. Build already submitted"
    echo "   - Check App Store Connect"
    echo "   - Build may already be processing"
    echo ""
    echo "3. Invalid credentials"
    echo "   - Verify Apple ID credentials"
    echo "   - Check API key permissions"
    echo ""
    echo "4. App record not configured"
    echo "   - Ensure app exists in App Store Connect"
    echo "   - Bundle ID must match: com.fixloapp.mobile"
    echo ""
    echo "For more details, check the error message above."
    echo ""
    exit 1
fi
