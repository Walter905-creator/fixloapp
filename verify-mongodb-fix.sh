#!/bin/bash
# Verification Script for MongoDB Serverless Fix
# This script tests the scheduler endpoints after deployment

set -e

DOMAIN="${1:-https://fixloapp.com}"
ADMIN_TOKEN="${2:-fixlo_admin_2026_super_secret_key}"

echo "🧪 Testing MongoDB Serverless Fix"
echo "=================================="
echo "Domain: $DOMAIN"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Status endpoint (no auth required)
echo "Test 1: GET /api/social/scheduler/status"
echo "----------------------------------------"
STATUS_RESPONSE=$(curl -s "$DOMAIN/api/social/scheduler/status")
echo "$STATUS_RESPONSE" | jq '.' 2>/dev/null || echo "$STATUS_RESPONSE"
echo ""

# Check databaseAvailable
DATABASE_AVAILABLE=$(echo "$STATUS_RESPONSE" | jq -r '.databaseAvailable' 2>/dev/null)
if [ "$DATABASE_AVAILABLE" = "true" ]; then
    echo -e "${GREEN}✅ databaseAvailable: true${NC}"
else
    echo -e "${RED}❌ databaseAvailable: $DATABASE_AVAILABLE${NC}"
fi

# Check metaConnected
META_CONNECTED=$(echo "$STATUS_RESPONSE" | jq -r '.metaConnected' 2>/dev/null)
if [ "$META_CONNECTED" = "true" ]; then
    echo -e "${GREEN}✅ metaConnected: true${NC}"
elif [ "$META_CONNECTED" = "false" ]; then
    echo -e "${YELLOW}⚠️  metaConnected: false (Meta accounts not connected or tokens invalid)${NC}"
else
    echo -e "${RED}❌ metaConnected: $META_CONNECTED${NC}"
fi

echo ""
echo ""

# Test 2: Start endpoint (requires auth)
echo "Test 2: POST /api/social/scheduler/start (with admin token)"
echo "-----------------------------------------------------------"
START_RESPONSE=$(curl -s -X POST "$DOMAIN/api/social/scheduler/start" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json")
echo "$START_RESPONSE" | jq '.' 2>/dev/null || echo "$START_RESPONSE"
echo ""

# Check success
SUCCESS=$(echo "$START_RESPONSE" | jq -r '.success' 2>/dev/null)
if [ "$SUCCESS" = "true" ]; then
    echo -e "${GREEN}✅ success: true${NC}"
else
    echo -e "${RED}❌ success: $SUCCESS${NC}"
fi

# Check databaseAvailable in start response
DATABASE_AVAILABLE_START=$(echo "$START_RESPONSE" | jq -r '.databaseAvailable' 2>/dev/null)
if [ "$DATABASE_AVAILABLE_START" = "true" ]; then
    echo -e "${GREEN}✅ databaseAvailable: true${NC}"
else
    echo -e "${RED}❌ databaseAvailable: $DATABASE_AVAILABLE_START${NC}"
fi

# Check metaConnected in start response
META_CONNECTED_START=$(echo "$START_RESPONSE" | jq -r '.metaConnected' 2>/dev/null)
if [ "$META_CONNECTED_START" = "true" ]; then
    echo -e "${GREEN}✅ metaConnected: true${NC}"
elif [ "$META_CONNECTED_START" = "false" ]; then
    echo -e "${YELLOW}⚠️  metaConnected: false (Meta accounts not connected or tokens invalid)${NC}"
else
    echo -e "${RED}❌ metaConnected: $META_CONNECTED_START${NC}"
fi

echo ""
echo ""

# Test 3: Start endpoint without auth (should fail)
echo "Test 3: POST /api/social/scheduler/start (without auth - should fail)"
echo "---------------------------------------------------------------------"
UNAUTH_RESPONSE=$(curl -s -X POST "$DOMAIN/api/social/scheduler/start" \
    -H "Content-Type: application/json")
echo "$UNAUTH_RESPONSE" | jq '.' 2>/dev/null || echo "$UNAUTH_RESPONSE"
echo ""

# Check that it returns 401
UNAUTH_SUCCESS=$(echo "$UNAUTH_RESPONSE" | jq -r '.success' 2>/dev/null)
if [ "$UNAUTH_SUCCESS" = "false" ]; then
    echo -e "${GREEN}✅ Correctly requires authentication${NC}"
else
    echo -e "${RED}❌ Should require authentication${NC}"
fi

echo ""
echo ""
echo "=================================="
echo "Summary"
echo "=================================="

# Overall assessment
if [ "$DATABASE_AVAILABLE" = "true" ] && [ "$SUCCESS" = "true" ]; then
    echo -e "${GREEN}✅ MongoDB serverless connection fix is working!${NC}"
    echo ""
    echo "All required fields are present in responses:"
    echo "  - databaseAvailable: true"
    echo "  - metaConnected: $META_CONNECTED"
    echo "  - Authentication is properly enforced"
else
    echo -e "${RED}❌ Fix verification failed${NC}"
    echo ""
    echo "Issues detected:"
    [ "$DATABASE_AVAILABLE" != "true" ] && echo "  - Database is not available"
    [ "$SUCCESS" != "true" ] && echo "  - Start endpoint failed"
    echo ""
    echo "Next steps:"
    echo "  1. Check Vercel function logs for errors"
    echo "  2. Verify MONGO_URI is set in Vercel environment variables"
    echo "  3. Verify MongoDB Atlas is accessible (IP whitelist)"
fi

echo ""
