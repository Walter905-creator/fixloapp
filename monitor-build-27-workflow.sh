#!/bin/bash
# Monitor Build 27 GitHub Actions Workflow
# This script checks the status of the EAS Build workflow
#
# Usage:
#   ./monitor-build-27-workflow.sh

set -e

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Fixlo Build 27 - Workflow Status Monitor${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Repository details
REPO_OWNER="Walter905-creator"
REPO_NAME="fixloapp"
WORKFLOW_FILE="eas-build.yml"

# Check if gh CLI is available and authenticated
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo ""
    echo "Please install GitHub CLI:"
    echo "  https://cli.github.com/"
    echo ""
    echo "Or check status manually at:"
    echo "  https://github.com/$REPO_OWNER/$REPO_NAME/actions/workflows/$WORKFLOW_FILE"
    echo ""
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI is not authenticated${NC}"
    echo ""
    echo "Please authenticate:"
    echo "  gh auth login"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI is ready${NC}"
echo ""

# Function to get status emoji
get_status_emoji() {
    case $1 in
        "completed")
            echo "✅"
            ;;
        "in_progress")
            echo "🔵"
            ;;
        "queued")
            echo "🟡"
            ;;
        "waiting")
            echo "⏸️"
            ;;
        *)
            echo "❓"
            ;;
    esac
}

# Function to get conclusion emoji
get_conclusion_emoji() {
    case $1 in
        "success")
            echo "✅"
            ;;
        "failure")
            echo "❌"
            ;;
        "cancelled")
            echo "🚫"
            ;;
        "skipped")
            echo "⏭️"
            ;;
        *)
            echo ""
            ;;
    esac
}

# Get the latest workflow runs
echo -e "${BLUE}Fetching latest workflow runs...${NC}"
echo ""

RUNS_JSON=$(gh run list \
    --repo "$REPO_OWNER/$REPO_NAME" \
    --workflow "$WORKFLOW_FILE" \
    --limit 5 \
    --json databaseId,status,conclusion,displayTitle,createdAt,updatedAt,url,headBranch,event)

if [ -z "$RUNS_JSON" ] || [ "$RUNS_JSON" = "[]" ]; then
    echo -e "${YELLOW}⚠️  No workflow runs found${NC}"
    echo ""
    echo "The workflow may not have been triggered yet."
    echo ""
    echo "Trigger it at:"
    echo "  https://github.com/$REPO_OWNER/$REPO_NAME/actions/workflows/$WORKFLOW_FILE"
    echo ""
    exit 0
fi

# Display runs in a formatted table
echo -e "${CYAN}Recent EAS Build Workflow Runs:${NC}"
echo ""

# Parse and display each run
echo "$RUNS_JSON" | jq -r '.[] | 
    "\(.databaseId)|\(.status)|\(.conclusion // "N/A")|\(.displayTitle)|\(.createdAt)|\(.url)"' | \
while IFS='|' read -r id status conclusion title created url; do
    status_emoji=$(get_status_emoji "$status")
    conclusion_emoji=$(get_conclusion_emoji "$conclusion")
    
    echo -e "${CYAN}Run ID:${NC} $id"
    echo -e "${CYAN}Status:${NC} $status_emoji $status"
    if [ "$conclusion" != "N/A" ]; then
        echo -e "${CYAN}Conclusion:${NC} $conclusion_emoji $conclusion"
    fi
    echo -e "${CYAN}Title:${NC} $title"
    echo -e "${CYAN}Created:${NC} $created"
    echo -e "${CYAN}URL:${NC} $url"
    echo ""
done

# Get the latest run details
LATEST_RUN_ID=$(echo "$RUNS_JSON" | jq -r '.[0].databaseId')
LATEST_STATUS=$(echo "$RUNS_JSON" | jq -r '.[0].status')
LATEST_CONCLUSION=$(echo "$RUNS_JSON" | jq -r '.[0].conclusion // "N/A"')
LATEST_URL=$(echo "$RUNS_JSON" | jq -r '.[0].url')

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Latest Run Details${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Run ID:${NC} $LATEST_RUN_ID"
echo -e "${CYAN}Status:${NC} $(get_status_emoji "$LATEST_STATUS") $LATEST_STATUS"
if [ "$LATEST_CONCLUSION" != "N/A" ]; then
    echo -e "${CYAN}Conclusion:${NC} $(get_conclusion_emoji "$LATEST_CONCLUSION") $LATEST_CONCLUSION"
fi
echo -e "${CYAN}URL:${NC} $LATEST_URL"
echo ""

# Check if still running
if [ "$LATEST_STATUS" = "in_progress" ] || [ "$LATEST_STATUS" = "queued" ]; then
    echo -e "${YELLOW}⏳ Workflow is still running...${NC}"
    echo ""
    echo "Watch live progress:"
    echo "  gh run watch $LATEST_RUN_ID --repo $REPO_OWNER/$REPO_NAME"
    echo ""
    echo "Or open in browser:"
    echo "  $LATEST_URL"
    echo ""
    
    # Get job details
    echo -e "${BLUE}Fetching job details...${NC}"
    echo ""
    
    JOBS_JSON=$(gh run view "$LATEST_RUN_ID" \
        --repo "$REPO_OWNER/$REPO_NAME" \
        --json jobs)
    
    echo "$JOBS_JSON" | jq -r '.jobs[] | 
        "Job: \(.name)\nStatus: \(.status)\nConclusion: \(.conclusion // "N/A")\n"'
    
elif [ "$LATEST_STATUS" = "completed" ]; then
    if [ "$LATEST_CONCLUSION" = "success" ]; then
        echo -e "${GREEN}✅ Workflow completed successfully!${NC}"
        echo ""
        
        # Try to extract build information from logs
        echo -e "${BLUE}Checking for EAS Build ID...${NC}"
        echo ""
        
        LOGS=$(gh run view "$LATEST_RUN_ID" \
            --repo "$REPO_OWNER/$REPO_NAME" \
            --log 2>/dev/null || echo "")
        
        if echo "$LOGS" | grep -q "Build ID:"; then
            BUILD_ID=$(echo "$LOGS" | grep "Build ID:" | head -1 | awk '{print $NF}')
            echo -e "${GREEN}EAS Build ID:${NC} $BUILD_ID"
            echo ""
            echo "View build on Expo:"
            echo "  https://expo.dev/accounts/fixlo-app/projects/fixloapp/builds/$BUILD_ID"
            echo ""
        fi
        
        echo "Next steps:"
        echo "  1. Check Expo dashboard for build status"
        echo "  2. Wait for build to complete (15-25 minutes)"
        echo "  3. Submit to App Store Connect"
        echo ""
        echo "Expo Dashboard:"
        echo "  https://expo.dev/accounts/fixlo-app/projects/fixloapp/builds"
        echo ""
    else
        echo -e "${RED}❌ Workflow failed${NC}"
        echo ""
        echo "View logs to diagnose:"
        echo "  gh run view $LATEST_RUN_ID --repo $REPO_OWNER/$REPO_NAME --log"
        echo ""
        echo "Or in browser:"
        echo "  $LATEST_URL"
        echo ""
    fi
fi

# Quick commands reference
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Useful Commands${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Watch latest run:"
echo "  gh run watch --repo $REPO_OWNER/$REPO_NAME"
echo ""
echo "View run logs:"
echo "  gh run view $LATEST_RUN_ID --repo $REPO_OWNER/$REPO_NAME --log"
echo ""
echo "List all runs:"
echo "  gh run list --repo $REPO_OWNER/$REPO_NAME --workflow $WORKFLOW_FILE"
echo ""
echo "Re-run this monitor:"
echo "  ./monitor-build-27-workflow.sh"
echo ""
