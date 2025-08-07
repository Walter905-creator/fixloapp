#!/bin/bash

# Deployment Verification Script for 405 Error Fixes
# This script tests the key endpoints to ensure 405 errors are resolved

echo "🔍 Testing Fixlo API Endpoints for 405 Error Resolution"
echo "======================================================"

# Set the base URL (update this when testing different environments)
BASE_URL="https://fixloapp.onrender.com"
if [ "$1" != "" ]; then
    BASE_URL="$1"
fi

echo "🌐 Testing against: $BASE_URL"
echo ""

# Test 1: Admin Login (should work - 200 OK)
echo "📝 Test 1: Admin Login"
echo "Expected: 200 OK"
response=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -H "Origin: https://www.fixloapp.com" \
    -d '{"email":"admin@fixloapp.com","password":"FixloAdmin2024!"}' \
    -o /tmp/admin_login_response.json)

echo "Status: $response"
if [ "$response" = "200" ]; then
    echo "✅ PASS: Admin login working correctly"
else
    echo "❌ FAIL: Admin login returned $response"
    echo "Response body:"
    cat /tmp/admin_login_response.json
fi
echo ""

# Test 2: Pro Registration (should get 503 if no database, or proper response if database available)
echo "📝 Test 2: Pro Registration"
echo "Expected: 503 (no database) or 400/201 (with database)"
response=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/pros/register" \
    -H "Content-Type: application/json" \
    -H "Origin: https://www.fixloapp.com" \
    -d '{"name":"Test Pro","email":"test@example.com","phone":"1234567890","password":"testpass","trade":"plumbing","location":"Test City","dob":"1990-01-01"}' \
    -o /tmp/pro_register_response.json)

echo "Status: $response"
if [ "$response" = "503" ] || [ "$response" = "400" ] || [ "$response" = "201" ]; then
    echo "✅ PASS: Pro registration returning proper status (not 405 or timeout)"
else
    echo "❌ FAIL: Pro registration returned $response"
    echo "Response body:"
    cat /tmp/pro_register_response.json
fi
echo ""

# Test 3: Pro Login (should get 503 if no database, or proper response if database available)
echo "📝 Test 3: Pro Login"
echo "Expected: 503 (no database) or 401 (with database - invalid credentials)"
response=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/pros/login" \
    -H "Content-Type: application/json" \
    -H "Origin: https://www.fixloapp.com" \
    -d '{"email":"test@example.com","password":"testpass"}' \
    -o /tmp/pro_login_response.json)

echo "Status: $response"
if [ "$response" = "503" ] || [ "$response" = "401" ]; then
    echo "✅ PASS: Pro login returning proper status (not 405 or timeout)"
else
    echo "❌ FAIL: Pro login returned $response"
    echo "Response body:"
    cat /tmp/pro_login_response.json
fi
echo ""

# Test 4: OPTIONS requests (should work for CORS)
echo "📝 Test 4: CORS OPTIONS Request"
echo "Expected: 204 No Content"
response=$(curl -s -w "%{http_code}" -X OPTIONS "$BASE_URL/api/pros/register" \
    -H "Origin: https://www.fixloapp.com" \
    -o /tmp/options_response.txt)

echo "Status: $response"
if [ "$response" = "204" ]; then
    echo "✅ PASS: OPTIONS request working correctly"
else
    echo "❌ FAIL: OPTIONS request returned $response"
    echo "Response body:"
    cat /tmp/options_response.txt
fi
echo ""

echo "🎯 Summary"
echo "=========="
echo "The key fix was updating vercel.json to exclude Vercel internal endpoints"
echo "and adding proper database connection checks to prevent timeouts."
echo ""
echo "For Vercel Analytics 405 errors:"
echo "- Updated vercel.json with: {\"src\": \"/_vercel/(.*)\", \"continue\": true}"
echo ""
echo "For API 405 errors:"
echo "- Added mongoose.connection.readyState checks to all database-dependent endpoints"
echo "- Endpoints now return 503 Service Unavailable instead of timing out"
echo ""
echo "Next steps:"
echo "1. Ensure MONGO_URI is properly set in Render environment variables"
echo "2. Deploy the updated vercel.json to fix Vercel Analytics"
echo "3. Monitor logs to confirm 405 errors are resolved"

# Cleanup temp files
rm -f /tmp/admin_login_response.json /tmp/pro_register_response.json /tmp/pro_login_response.json /tmp/options_response.txt