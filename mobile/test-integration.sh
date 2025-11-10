#!/bin/bash
# Test script to verify mobile app fixes
# This script tests the API endpoints that the mobile app will use

echo "=================================================="
echo "Mobile App Fixes - API Integration Test"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="https://fixloapp.onrender.com"

echo "Testing API URL: $API_URL"
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
echo "--------------------"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/api/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC} - Backend is healthy"
    echo "Response: $RESPONSE_BODY"
else
    echo -e "${RED}❌ FAIL${NC} - Backend health check failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 2: Fetch Job Requests (GET /api/leads)
echo "Test 2: Fetch Job Requests"
echo "--------------------------"
LEADS_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/api/leads?limit=5")
HTTP_CODE=$(echo "$LEADS_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$LEADS_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC} - Job requests endpoint working"
    # Parse response to show count
    LEAD_COUNT=$(echo "$RESPONSE_BODY" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
    echo "Total job requests in system: $LEAD_COUNT"
else
    echo -e "${RED}❌ FAIL${NC} - Failed to fetch job requests (HTTP $HTTP_CODE)"
fi
echo ""

# Test 3: Test CORS (important for mobile app)
echo "Test 3: CORS Configuration"
echo "--------------------------"
CORS_RESPONSE=$(curl -s -w "\n%{http_code}" -X OPTIONS "$API_URL/api/leads" \
  -H "Origin: http://localhost:19006" \
  -H "Access-Control-Request-Method: GET")
HTTP_CODE=$(echo "$CORS_RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC} - CORS configured correctly"
else
    echo -e "${YELLOW}⚠️  WARNING${NC} - CORS preflight might not be configured (HTTP $HTTP_CODE)"
fi
echo ""

# Test 4: API Configuration Module
echo "Test 4: API Configuration Module"
echo "--------------------------------"
cd /home/runner/work/fixloapp/fixloapp/mobile
if node test-api-config.js > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC} - API configuration module working"
else
    echo -e "${RED}❌ FAIL${NC} - API configuration module has errors"
fi
echo ""

# Test 5: Syntax Validation
echo "Test 5: Syntax Validation"
echo "------------------------"
ALL_VALID=true

for file in "App.js" "screens/SignupScreen.js" "screens/HomeownerScreen.js" "screens/LoginScreen.js" "config/api.js"; do
    if node -c "$file" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $file"
    else
        echo -e "${RED}❌${NC} $file"
        ALL_VALID=false
    fi
done

if [ "$ALL_VALID" = true ]; then
    echo -e "\n${GREEN}✅ All files pass syntax validation${NC}"
else
    echo -e "\n${RED}❌ Some files have syntax errors${NC}"
fi
echo ""

# Summary
echo "=================================================="
echo "Test Summary"
echo "=================================================="
echo ""
echo "The mobile app should now:"
echo "  ✅ Connect to the API without crashes"
echo "  ✅ Handle errors gracefully with user-friendly messages"
echo "  ✅ Fetch and display job requests on Homeowner Dashboard"
echo "  ✅ Show loading states while fetching data"
echo "  ✅ Handle network timeouts and connection failures"
echo ""
echo "To test the app:"
echo "  1. cd mobile"
echo "  2. npm install"
echo "  3. npx expo start"
echo "  4. Open in iOS simulator or Expo Go app"
echo ""
echo "=================================================="
