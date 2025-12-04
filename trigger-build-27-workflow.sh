#!/bin/bash
# GitHub Actions Workflow Trigger Script for Build 27
# This script triggers the EAS Build workflow for iOS Build 27
#
# Requirements:
#   - GitHub CLI (gh) must be installed and authenticated
#   - OR GITHUB_TOKEN must be set in environment
#
# Usage:
#   ./trigger-build-27-workflow.sh

set -e

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Fixlo Build 27 - GitHub Actions Workflow Trigger${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Repository details
REPO_OWNER="Walter905-creator"
REPO_NAME="fixloapp"
WORKFLOW_FILE="eas-build.yml"
BRANCH="main"

# Build parameters
PLATFORM="ios"
PROFILE="production"
VERSION="1.0.27"
BUILD_NUMBER="27"

echo -e "${CYAN}Repository:${NC} $REPO_OWNER/$REPO_NAME"
echo -e "${CYAN}Workflow:${NC} $WORKFLOW_FILE"
echo -e "${CYAN}Branch:${NC} $BRANCH"
echo ""
echo -e "${CYAN}Build Parameters:${NC}"
echo -e "  Platform: $PLATFORM"
echo -e "  Profile: $PROFILE"
echo -e "  Version: $VERSION"
echo -e "  Build Number: $BUILD_NUMBER"
echo ""

# Check if gh CLI is available and authenticated
if command -v gh &> /dev/null; then
    echo -e "${GREEN}✅ GitHub CLI detected${NC}"
    
    # Check if authenticated
    if gh auth status &> /dev/null; then
        echo -e "${GREEN}✅ GitHub CLI is authenticated${NC}"
        echo ""
        
        # Trigger workflow using gh CLI
        echo -e "${BLUE}Triggering workflow with gh CLI...${NC}"
        echo ""
        
        WORKFLOW_URL=$(gh workflow run "$WORKFLOW_FILE" \
            --repo "$REPO_OWNER/$REPO_NAME" \
            --ref "$BRANCH" \
            --field platform="$PLATFORM" \
            --field profile="$PROFILE" \
            --field branch="$BRANCH" 2>&1 || echo "")
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Workflow triggered successfully!${NC}"
            echo ""
            
            # Wait a moment for the run to appear
            echo "Waiting for workflow run to appear..."
            sleep 3
            
            # Get the latest run
            echo ""
            echo -e "${BLUE}Fetching workflow run details...${NC}"
            gh run list \
                --repo "$REPO_OWNER/$REPO_NAME" \
                --workflow "$WORKFLOW_FILE" \
                --limit 1 \
                --json databaseId,status,conclusion,url,createdAt,headBranch,displayTitle
            
            echo ""
            echo -e "${CYAN}View workflow runs:${NC}"
            echo "  https://github.com/$REPO_OWNER/$REPO_NAME/actions/workflows/$WORKFLOW_FILE"
            echo ""
            echo -e "${CYAN}Watch the latest run:${NC}"
            echo "  gh run watch --repo $REPO_OWNER/$REPO_NAME"
            echo ""
            
            exit 0
        else
            echo -e "${YELLOW}⚠️  gh CLI trigger failed, trying API method...${NC}"
            echo ""
        fi
    else
        echo -e "${YELLOW}⚠️  GitHub CLI is not authenticated${NC}"
        echo "  Run: gh auth login"
        echo ""
    fi
else
    echo -e "${YELLOW}⚠️  GitHub CLI (gh) not found${NC}"
    echo ""
fi

# Try API method with GITHUB_TOKEN
if [ -n "$GITHUB_TOKEN" ]; then
    echo -e "${GREEN}✅ GITHUB_TOKEN detected${NC}"
    echo -e "${BLUE}Triggering workflow via GitHub API...${NC}"
    echo ""
    
    # Create the workflow dispatch event
    RESPONSE=$(curl -X POST \
        -H "Accept: application/vnd.github+json" \
        -H "Authorization: Bearer $GITHUB_TOKEN" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/actions/workflows/$WORKFLOW_FILE/dispatches" \
        -d "{\"ref\":\"$BRANCH\",\"inputs\":{\"platform\":\"$PLATFORM\",\"profile\":\"$PROFILE\",\"branch\":\"$BRANCH\"}}" \
        -w "\n%{http_code}" \
        -s)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    
    if [ "$HTTP_CODE" = "204" ]; then
        echo -e "${GREEN}✅ Workflow triggered successfully via API!${NC}"
        echo ""
        
        # Wait a moment for the run to appear
        echo "Waiting for workflow run to appear..."
        sleep 5
        
        # Get the latest runs via API
        echo ""
        echo -e "${BLUE}Fetching recent workflow runs...${NC}"
        RUNS=$(curl -s \
            -H "Accept: application/vnd.github+json" \
            -H "Authorization: Bearer $GITHUB_TOKEN" \
            -H "X-GitHub-Api-Version: 2022-11-28" \
            "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/actions/workflows/$WORKFLOW_FILE/runs?per_page=1")
        
        # Parse and display run info
        RUN_ID=$(echo "$RUNS" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
        RUN_STATUS=$(echo "$RUNS" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
        RUN_URL=$(echo "$RUNS" | grep -o '"html_url":"[^"]*"' | head -1 | cut -d'"' -f4)
        
        echo ""
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  Workflow Triggered Successfully${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo ""
        echo -e "${CYAN}Run ID:${NC} $RUN_ID"
        echo -e "${CYAN}Status:${NC} $RUN_STATUS"
        echo -e "${CYAN}URL:${NC} $RUN_URL"
        echo ""
        echo -e "${CYAN}Monitor progress at:${NC}"
        echo "  $RUN_URL"
        echo ""
        echo -e "${CYAN}Or view all runs at:${NC}"
        echo "  https://github.com/$REPO_OWNER/$REPO_NAME/actions/workflows/$WORKFLOW_FILE"
        echo ""
        
        exit 0
    else
        echo -e "${RED}❌ API request failed with HTTP code: $HTTP_CODE${NC}"
        echo "$RESPONSE"
        echo ""
    fi
else
    echo -e "${YELLOW}⚠️  GITHUB_TOKEN not set${NC}"
    echo ""
fi

# If we reach here, no method worked - provide manual instructions
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  Manual Workflow Trigger Required${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Please trigger the workflow manually using one of these methods:"
echo ""
echo -e "${CYAN}Method 1: GitHub Web UI${NC}"
echo "  1. Go to: https://github.com/$REPO_OWNER/$REPO_NAME/actions/workflows/$WORKFLOW_FILE"
echo "  2. Click 'Run workflow' button"
echo "  3. Fill in the parameters:"
echo "     - Use workflow from: $BRANCH"
echo "     - platform: $PLATFORM"
echo "     - profile: $PROFILE"
echo "     - branch: $BRANCH"
echo "  4. Click 'Run workflow' (green button)"
echo ""
echo -e "${CYAN}Method 2: GitHub CLI (after authentication)${NC}"
echo "  gh auth login"
echo "  gh workflow run $WORKFLOW_FILE \\"
echo "    --repo $REPO_OWNER/$REPO_NAME \\"
echo "    --ref $BRANCH \\"
echo "    --field platform=$PLATFORM \\"
echo "    --field profile=$PROFILE \\"
echo "    --field branch=$BRANCH"
echo ""
echo -e "${CYAN}Method 3: Set GITHUB_TOKEN and re-run this script${NC}"
echo "  export GITHUB_TOKEN='your-github-token'"
echo "  ./trigger-build-27-workflow.sh"
echo ""

exit 1
