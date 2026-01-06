#!/bin/bash
# Test script to verify CORS configuration is working in production
# Usage: ./test-cors-deployment.sh [API_URL]

API_URL="${1:-https://fixloapp.onrender.com}"

echo "🧪 Testing CORS Configuration"
echo "📍 API URL: $API_URL"
echo ""

# Test 1: Health check
echo "Test 1: Health check endpoint"
curl -s "${API_URL}/api/health" | jq -r '.' 2>/dev/null || curl -s "${API_URL}/api/health"
echo ""

# Test 2: CORS test endpoint
echo "Test 2: CORS configuration endpoint"
curl -s "${API_URL}/api/cors-test" | jq -r '.' 2>/dev/null || curl -s "${API_URL}/api/cors-test"
echo ""

# Test 3: CORS preflight with production origin
echo "Test 3: CORS preflight from production domain"
curl -s -X OPTIONS "${API_URL}/api/country/detect" \
  -H "Origin: https://www.fixloapp.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1 | grep -E "(< HTTP|< Access-Control)"
echo ""

# Test 4: CORS preflight with Vercel preview origin
echo "Test 4: CORS preflight from Vercel preview deployment"
curl -s -X OPTIONS "${API_URL}/api/country/detect" \
  -H "Origin: https://fixloapp-test123.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1 | grep -E "(< HTTP|< Access-Control)"
echo ""

# Test 5: CORS preflight with disallowed origin
echo "Test 5: CORS preflight from unauthorized domain (should fail)"
curl -s -X OPTIONS "${API_URL}/api/country/detect" \
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
