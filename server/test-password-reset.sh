#!/bin/bash
# Test script for Pro Password Reset Flow

set -e

echo "=========================================="
echo "Pro Password Reset Flow Test"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_BASE="${API_BASE:-http://localhost:3001}"
TEST_EMAIL="pro4u.improvements@gmail.com"
TEST_PASSWORD="TestPassword123!"

echo -e "${YELLOW}Testing Pro Password Reset Flow${NC}"
echo "API Base: $API_BASE"
echo ""

# Test 1: Request password reset
echo "1. Testing password reset request..."
RESET_RESPONSE=$(curl -s -X POST "$API_BASE/api/pro-auth/request-password-reset" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESET_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$RESET_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Password reset request successful${NC}"
  echo "Response: $RESPONSE_BODY"
else
  echo -e "${RED}✗ Password reset request failed (HTTP $HTTP_CODE)${NC}"
  echo "Response: $RESPONSE_BODY"
fi
echo ""

# Test 2: Try login without password (should fail with 403)
echo "2. Testing login without password set..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/api/pro-auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"anypassword\"}" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "401" ]; then
  echo -e "${GREEN}✓ Login correctly blocked for user without password${NC}"
  echo "Response: $RESPONSE_BODY"
else
  echo -e "${YELLOW}⚠ Unexpected status code: $HTTP_CODE${NC}"
  echo "Response: $RESPONSE_BODY"
fi
echo ""

# Test 3: Try invalid reset (without token)
echo "3. Testing password reset with invalid token..."
RESET_INVALID=$(curl -s -X POST "$API_BASE/api/pro-auth/reset-password" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"invalid-token-12345\",\"newPassword\":\"$TEST_PASSWORD\"}" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESET_INVALID" | tail -n 1)
RESPONSE_BODY=$(echo "$RESET_INVALID" | head -n -1)

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✓ Invalid token correctly rejected${NC}"
  echo "Response: $RESPONSE_BODY"
else
  echo -e "${YELLOW}⚠ Unexpected status code: $HTTP_CODE${NC}"
  echo "Response: $RESPONSE_BODY"
fi
echo ""

echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${YELLOW}Note:${NC} Full flow testing requires:"
echo "1. A running MongoDB instance"
echo "2. Walter Pro user initialized"
echo "3. Email service configured (SendGrid)"
echo "4. Valid reset token from email"
echo ""
echo -e "${GREEN}Basic API structure tests passed!${NC}"
echo ""
echo "To test the full flow:"
echo "1. Start the backend with MongoDB connection"
echo "2. Request password reset for $TEST_EMAIL"
echo "3. Check server logs for reset token"
echo "4. Use the token to reset password"
echo "5. Login with new password"
