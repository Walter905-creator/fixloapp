#!/usr/bin/env bash
set -e  # Exit immediately if any command fails

# Test script to verify CORS configuration is working in production
# Usage: ./test-cors-deployment.sh [API_URL]
#
# Note: This script uses 'jq' for JSON formatting. If not available, raw JSON will be displayed.
# To install jq: apt-get install jq (Debian/Ubuntu) or brew install jq (macOS)

API_URL="${1:-https://fixloapp.onrender.com}"

echo "🧪 Testing CORS Configuration"
echo "📍 API URL: $API_URL"
echo ""

# Check if jq is available for pretty printing
if command -v jq &> /dev/null; then
    HAS_JQ=true
else
    HAS_JQ=false
    echo "ℹ️  Note: 'jq' not found - JSON will be displayed without formatting"
    echo ""
fi

# Test 1: Health check
echo "Test 1: Health check endpoint"
if [ "$HAS_JQ" = true ]; then
    curl -s "${API_URL}/api/health" | jq '.'
else
    curl -s "${API_URL}/api/health"
fi
echo ""

# Test 2: CORS test endpoint
echo "Test 2: CORS configuration endpoint"
if [ "$HAS_JQ" = true ]; then
    curl -s "${API_URL}/api/cors-test" | jq '.'
else
    curl -s "${API_URL}/api/cors-test"
fi
echo ""

# Test 3: CORS preflight with production origin
echo "Test 3: CORS preflight from production domain"
curl -s -X OPTIONS "${API_URL}/api/cors-test" \
  -H "Origin: https://www.fixloapp.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1 | grep -E "(< HTTP|< Access-Control)"
echo ""

# Test 4: CORS preflight with Vercel preview origin
echo "Test 4: CORS preflight from Vercel preview deployment"
curl -s -X OPTIONS "${API_URL}/api/cors-test" \
  -H "Origin: https://fixloapp-test123.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1 | grep -E "(< HTTP|< Access-Control)"
echo ""

# Test 5: CORS preflight with disallowed origin
echo "Test 5: CORS preflight from unauthorized domain (should fail)"
curl -s -X OPTIONS "${API_URL}/api/cors-test" \
  -H "Origin: https://evil.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1 | grep -E "(< HTTP|< Access-Control|error|CORS)"
echo ""

echo "✅ CORS testing complete!"
echo ""
echo "Expected results:"
echo "  - Test 3 (production): Should return HTTP/2 204 with Access-Control headers"
echo "  - Test 4 (Vercel preview): Should return HTTP/2 204 with Access-Control headers"
echo "  - Test 5 (evil.com): Should return HTTP/2 403 or no Access-Control headers"
