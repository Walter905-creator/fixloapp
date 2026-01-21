#!/bin/bash
#
# Test Vercel API Routing Fix
# 
# This script tests that /api/* routes are correctly routed to serverless
# functions and not served as HTML from the SPA fallback.
#
# Usage: ./test-api-routing.sh [BASE_URL]
#   BASE_URL: Optional, defaults to https://fixloapp.com
#

set -e

BASE_URL="${1:-https://fixloapp.com}"

echo "================================================"
echo "Testing Vercel API Routing Fix"
echo "================================================"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: /api/ping should return JSON
echo "Test 1: /api/ping should return JSON (not HTML)"
echo "------------------------------------------------"
RESPONSE=$(curl -s -i "${BASE_URL}/api/ping")
CONTENT_TYPE=$(echo "$RESPONSE" | grep -i "content-type:" | head -1)
BODY=$(echo "$RESPONSE" | tail -1)

echo "Content-Type: $CONTENT_TYPE"
echo "Response: $BODY"

if echo "$CONTENT_TYPE" | grep -qi "application/json"; then
  echo "✅ PASS: Returns JSON"
else
  echo "❌ FAIL: Does not return JSON"
  echo "Full response:"
  echo "$RESPONSE"
  exit 1
fi

if echo "$BODY" | grep -q "<!DOCTYPE html>"; then
  echo "❌ FAIL: Returns HTML instead of JSON"
  exit 1
fi

if echo "$BODY" | grep -q '"status"'; then
  echo "✅ PASS: Response contains expected JSON structure"
else
  echo "❌ FAIL: Response does not contain expected JSON structure"
  exit 1
fi

echo ""

# Test 2: / should return HTML (SPA)
echo "Test 2: / (root) should return HTML"
echo "------------------------------------------------"
RESPONSE=$(curl -s -i "${BASE_URL}/")
CONTENT_TYPE=$(echo "$RESPONSE" | grep -i "content-type:" | head -1)
BODY=$(echo "$RESPONSE" | tail -10)

echo "Content-Type: $CONTENT_TYPE"

if echo "$CONTENT_TYPE" | grep -qi "text/html"; then
  echo "✅ PASS: Returns HTML"
else
  echo "❌ FAIL: Does not return HTML"
  exit 1
fi

if echo "$BODY" | grep -q "<!DOCTYPE html>\|<!doctype html>"; then
  echo "✅ PASS: Response contains HTML doctype"
else
  echo "❌ FAIL: Response does not contain HTML doctype"
  exit 1
fi

echo ""

# Test 3: /about should return HTML (SPA fallback)
echo "Test 3: /about should return HTML (SPA fallback)"
echo "------------------------------------------------"
RESPONSE=$(curl -s -i "${BASE_URL}/about")
HTTP_CODE=$(echo "$RESPONSE" | head -1 | grep -o '[0-9][0-9][0-9]' | head -1)
CONTENT_TYPE=$(echo "$RESPONSE" | grep -i "content-type:" | head -1)

echo "HTTP Code: $HTTP_CODE"
echo "Content-Type: $CONTENT_TYPE"

if echo "$CONTENT_TYPE" | grep -qi "text/html"; then
  echo "✅ PASS: Returns HTML"
else
  echo "❌ FAIL: Does not return HTML"
  exit 1
fi

echo ""

# Summary
echo "================================================"
echo "All tests passed! ✅"
echo "================================================"
echo ""
echo "API routing is working correctly:"
echo "  - /api/* routes go to serverless functions"
echo "  - Other routes fall back to SPA (index.html)"
echo ""
