#!/bin/bash
# Fixlo iOS Build 27 Deployment Script
# This script automates the iOS build and App Store submission process for Build 27
# IMPORTANT: This must be run from the /mobile directory, NOT from root

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log_section "CHECKING PREREQUISITES"
    
    # Verify we're in the mobile directory
    CURRENT_DIR=$(basename "$(pwd)")
    if [ "$CURRENT_DIR" != "mobile" ]; then
        log_error "This script must be run from the /mobile directory"
        log_error "Current directory: $(pwd)"
        log_error "Please run: cd /home/runner/work/fixloapp/fixloapp/mobile"
        exit 1
    fi
    log_success "Running from mobile directory: $(pwd)"
    
    # Check if we're in the mobile directory by looking for app.config.js
    if [ ! -f "app.config.js" ]; then
        log_error "app.config.js not found. Please run this script from the mobile directory."
        log_error "Expected: /home/runner/work/fixloapp/fixloapp/mobile"
        exit 1
    fi
    log_success "app.config.js found"
    
    # Check for EXPO_TOKEN
    if [ -z "$EXPO_TOKEN" ]; then
        log_warning "EXPO_TOKEN environment variable not set"
        log_info "EAS commands will require interactive authentication"
        log_warning "For CI/CD, set EXPO_TOKEN before running this script"
    else
        log_success "EXPO_TOKEN is configured"
    fi
    
    # Verify build number in config
    BUILD_NUM=$(grep -o 'buildNumber: "[0-9]*"' app.config.js | grep -o '[0-9]*')
    VERSION=$(grep -o 'version: "[^"]*"' app.config.js | head -1 | grep -o '[0-9.]*')
    
    log_info "Current configuration:"
    log_info "  Version: $VERSION"
    log_info "  Build Number: $BUILD_NUM"
    
    if [ "$BUILD_NUM" != "27" ]; then
        log_error "Build number in app.config.js is $BUILD_NUM, expected 27"
        log_error "Please update mobile/app.config.js buildNumber to 27"
        exit 1
    fi
    
    if [ "$VERSION" != "1.0.27" ]; then
        log_error "Version in app.config.js is $VERSION, expected 1.0.27"
        log_error "Please update mobile/app.config.js version to 1.0.27"
        exit 1
    fi
    
    log_success "Build 27 configuration verified (Version: $VERSION, Build: $BUILD_NUM)"
    
    # Verify we're NOT in root directory with basic demo config
    if [ -f "../app.json" ] && [ ! -f "../mobile/app.config.js" ]; then
        log_warning "Root directory contains app.json (basic demo config)"
        log_info "This script ensures we use mobile/app.config.js instead"
    fi
}

# Step 1: Clean install
clean_install() {
    log_section "STEP 1: CLEAN INSTALL"
    
    log_info "Removing existing node_modules..."
    rm -rf node_modules
    log_success "node_modules removed"
    
    log_info "Installing dependencies (this may take 1-2 minutes)..."
    npm install
    log_success "Dependencies installed successfully"
    
    # Verify critical dependencies
    log_info "Verifying expo installation..."
    if npm list expo >/dev/null 2>&1; then
        EXPO_VERSION=$(npm list expo | grep expo@ | head -1 | awk '{print $2}')
        log_success "Expo verified: $EXPO_VERSION"
    else
        log_error "Expo not found in dependencies"
        exit 1
    fi
}

# Step 2: Build iOS
build_ios() {
    log_section "STEP 2: BUILDING iOS BUILD 27 WITH EAS"
    
    log_info "Starting EAS build for iOS Build 27..."
    log_info "Platform: ios"
    log_info "Profile: production"
    log_info "Version: 1.0.27"
    log_info "Build Number: 27"
    log_info "Directory: $(pwd)"
    log_warning "This build process typically takes 15-25 minutes"
    
    # Confirm directory one more time
    log_info "Confirming build source..."
    log_success "Building from: $(pwd)"
    log_success "Using config: $(pwd)/app.config.js"
    log_success "Using EAS config: $(pwd)/eas.json"
    
    # Run EAS build and capture output
    log_info "Executing: npx eas-cli@latest build --platform ios --profile production --non-interactive"
    BUILD_OUTPUT=$(npx eas-cli@latest build --platform ios --profile production --non-interactive 2>&1)
    BUILD_EXIT_CODE=$?
    
    echo "$BUILD_OUTPUT"
    
    if [ $BUILD_EXIT_CODE -ne 0 ]; then
        log_error "EAS build failed with exit code $BUILD_EXIT_CODE"
        exit 1
    fi
    
    log_success "EAS build command completed successfully"
}

# Step 3: Capture build ID
capture_build_id() {
    log_section "STEP 3: CAPTURING BUILD ID"
    
    log_info "Fetching recent builds..."
    
    # Get the most recent iOS production build
    BUILD_LIST=$(npx eas-cli@latest build:list --platform ios --limit 5 --non-interactive 2>&1)
    echo "$BUILD_LIST"
    
    # Extract the most recent build ID
    BUILD_ID=$(echo "$BUILD_LIST" | grep -E "^[a-fA-F0-9-]{36}" | head -1 | awk '{print $1}')
    
    if [ -z "$BUILD_ID" ]; then
        log_warning "Could not automatically extract build ID"
        log_info "Please check the build list above and note the Build ID manually"
        log_info "Build dashboard: https://expo.dev/accounts/fixlo-app/projects/fixloapp/builds"
        return 1
    fi
    
    log_success "Build ID captured: $BUILD_ID"
    
    # Save build ID to file for reference
    echo "$BUILD_ID" > build-27-id.txt
    log_info "Build ID saved to: mobile/build-27-id.txt"
    
    # Export for use in submission
    export IOS_BUILD_27_ID="$BUILD_ID"
    echo "$BUILD_ID"
}

# Step 4: Submit to App Store
submit_to_app_store() {
    log_section "STEP 4: SUBMITTING TO APP STORE CONNECT"
    
    local BUILD_ID="$1"
    
    if [ -z "$BUILD_ID" ]; then
        log_error "Build ID not provided"
        log_info "Please run submission manually with:"
        log_info "  cd /home/runner/work/fixloapp/fixloapp/mobile"
        log_info "  npx eas-cli@latest submit --platform ios --id <BUILD_ID> --non-interactive"
        return 1
    fi
    
    log_info "Submitting Build 27 to App Store Connect..."
    log_info "Build ID: $BUILD_ID"
    log_warning "This process typically takes 2-5 minutes"
    
    # Submit to App Store
    SUBMIT_OUTPUT=$(npx eas-cli@latest submit --platform ios --id "$BUILD_ID" --non-interactive 2>&1)
    SUBMIT_EXIT_CODE=$?
    
    echo "$SUBMIT_OUTPUT"
    
    if [ $SUBMIT_EXIT_CODE -ne 0 ]; then
        log_error "App Store submission failed with exit code $SUBMIT_EXIT_CODE"
        return 1
    fi
    
    log_success "Submission to App Store Connect completed"
}

# Step 5: Output final status
output_final_status() {
    log_section "DEPLOYMENT STATUS SUMMARY"
    
    local BUILD_ID="$1"
    local SUBMIT_STATUS="$2"
    
    echo ""
    log_info "═══════════════════════════════════════════════════════════"
    log_info "          FIXLO BUILD 27 - DEPLOYMENT COMPLETE             "
    log_info "═══════════════════════════════════════════════════════════"
    echo ""
    
    log_success "Build Information:"
    log_info "  Build Number: 27"
    log_info "  Version: 1.0.27"
    log_info "  Platform: iOS"
    log_info "  Profile: production"
    echo ""
    
    log_success "Directory Verification:"
    log_info "  ✓ Built from: /mobile directory (CORRECT)"
    log_info "  ✗ NOT from root directory"
    log_info "  ✓ Used: mobile/app.config.js"
    log_info "  ✓ Used: mobile/eas.json"
    echo ""
    
    if [ -n "$BUILD_ID" ]; then
        log_success "Build ID: $BUILD_ID"
    else
        log_warning "Build ID: Not captured automatically"
        log_info "Check: https://expo.dev/accounts/fixlo-app/projects/fixloapp/builds"
    fi
    echo ""
    
    if [ "$SUBMIT_STATUS" == "success" ]; then
        log_success "Submission Status: Successfully submitted to App Store Connect"
        log_info "Expected Status: Processing → Waiting for Review"
        log_info ""
        log_info "✓ Build 27 submitted to Apple App Store Connect"
        log_info "✓ Version 1.0.27 ready for TestFlight distribution"
        log_info ""
        log_info "Next Steps:"
        log_info "  1. Monitor App Store Connect for processing status"
        log_info "  2. Wait for Apple review feedback"
        log_info "  3. TestFlight available once processing completes"
    elif [ "$SUBMIT_STATUS" == "pending" ]; then
        log_warning "Submission Status: Build in progress or pending"
        log_info "The build may need to complete before submission"
        log_info "Check: https://expo.dev/accounts/fixlo-app/projects/fixloapp/builds"
    else
        log_warning "Submission Status: Manual submission required"
        log_info ""
        log_info "To submit manually:"
        if [ -n "$BUILD_ID" ]; then
            log_info "  cd /home/runner/work/fixloapp/fixloapp/mobile"
            log_info "  npx eas-cli@latest submit --platform ios --id $BUILD_ID --non-interactive"
        else
            log_info "  1. Go to https://expo.dev/accounts/fixlo-app/projects/fixloapp/builds"
            log_info "  2. Find the latest iOS build (Build 27)"
            log_info "  3. Click 'Submit to App Store'"
        fi
    fi
    
    echo ""
    log_info "═══════════════════════════════════════════════════════════"
    echo ""
    
    # Save final report
    {
        echo "FIXLO BUILD 27 DEPLOYMENT REPORT"
        echo "================================"
        echo ""
        echo "Date: $(date)"
        echo "Build Number: 27"
        echo "Version: 1.0.27"
        echo "Platform: iOS"
        echo "Profile: production"
        echo ""
        echo "Directory Verification:"
        echo "  Built from: $(pwd)"
        echo "  Used config: app.config.js (mobile)"
        echo "  Used EAS config: eas.json (mobile)"
        echo "  ✓ CORRECT - Built from mobile directory, NOT root"
        echo ""
        echo "Build ID: ${BUILD_ID:-Not captured}"
        echo "Submission Status: $SUBMIT_STATUS"
        echo ""
        echo "Build artifacts saved to: mobile/"
        echo "  - build-27-id.txt (Build ID)"
        echo "  - build-27-deployment-report.txt (This report)"
        echo ""
        echo "Warnings/Errors: ${WARNINGS:-None}"
        echo ""
        echo "Next Steps:"
        echo "  - Monitor App Store Connect for processing"
        echo "  - Check TestFlight availability"
        echo "  - Prepare for Apple review"
        echo ""
    } > build-27-deployment-report.txt
    
    log_success "Deployment report saved to: mobile/build-27-deployment-report.txt"
}

# Main execution
main() {
    log_section "🚀 FIXLO iOS BUILD 27 DEPLOYMENT"
    log_warning "IMPORTANT: This corrects Build 26 which was built from wrong directory"
    log_info "Build 27 will be built from the correct /mobile directory"
    log_info "Target: App Store Connect"
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Step 1: Clean install
    clean_install
    
    # Step 2: Build iOS
    build_ios
    
    # Step 3: Capture build ID
    BUILD_ID=$(capture_build_id)
    BUILD_ID_STATUS=$?
    
    # Step 4: Submit to App Store (if build ID was captured)
    SUBMIT_STATUS="not_attempted"
    if [ $BUILD_ID_STATUS -eq 0 ] && [ -n "$BUILD_ID" ]; then
        if submit_to_app_store "$BUILD_ID"; then
            SUBMIT_STATUS="success"
        else
            SUBMIT_STATUS="failed"
        fi
    else
        SUBMIT_STATUS="pending"
    fi
    
    # Step 5: Output final status
    output_final_status "$BUILD_ID" "$SUBMIT_STATUS"
    
    # Exit with appropriate code
    if [ "$SUBMIT_STATUS" == "success" ]; then
        exit 0
    elif [ "$SUBMIT_STATUS" == "pending" ]; then
        log_info "Exiting with code 0 - Manual submission may be required"
        exit 0
    else
        log_warning "Exiting with code 1 - Review errors above"
        exit 1
    fi
}

# Run main function
main
