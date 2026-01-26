#!/bin/bash

# Simple verification script for serverless scheduler endpoints
# Can be used with curl to test production deployment

echo "🧪 Serverless Scheduler Verification"
echo "===================================="
echo ""

BASE_URL="${1:-https://fixloapp.com}"
# SECURITY NOTE: Default key is for testing only. Set ADMIN_SECRET_KEY environment variable in production.
ADMIN_SECRET_KEY="${ADMIN_SECRET_KEY:-fixlo_admin_2026_super_secret_key}"

echo "Base URL: $BASE_URL"
echo ""

# Test 1: GET /api/social/scheduler/status
echo "📊 Test 1: GET /api/social/scheduler/status"
echo "------------------------------------------------------------"
curl -s -X GET "$BASE_URL/api/social/scheduler/status" | jq '.' || echo "❌ Failed to parse JSON"
echo ""
echo ""

# Test 2: POST /api/social/scheduler/run (without auth - should fail)
echo "🔒 Test 2: POST /api/social/scheduler/run (no auth - should fail with 401)"
echo "------------------------------------------------------------"
curl -s -X POST "$BASE_URL/api/social/scheduler/run" \
  -H "Content-Type: application/json" | jq '.' || echo "❌ Failed to parse JSON"
echo ""
echo ""

# Test 3: POST /api/social/scheduler/run (with auth - should succeed)
echo "🔑 Test 3: POST /api/social/scheduler/run (with auth - should succeed)"
echo "------------------------------------------------------------"
curl -s -X POST "$BASE_URL/api/social/scheduler/run" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_SECRET_KEY" | jq '.' || echo "❌ Failed to parse JSON"
echo ""
echo ""

# Test 4: GET /api/social/scheduler/status again
echo "🔄 Test 4: GET /api/social/scheduler/status (check updated state)"
echo "------------------------------------------------------------"
curl -s -X GET "$BASE_URL/api/social/scheduler/status" | jq '.' || echo "❌ Failed to parse JSON"
echo ""
echo ""

echo "✅ Verification complete!"
echo ""
echo "Expected Results:"
echo "  Test 1: Status 200, serverless=true, databaseAvailable shown"
echo "  Test 2: Status 401, error about missing/invalid auth"
echo "  Test 3: Status 200, result with postsProcessed/postsPublished"
echo "  Test 4: Status 200, lastRunAt should be updated"
echo ""
echo "Usage examples:"
echo "  # Test locally:"
echo "  $0 http://localhost:3001"
echo ""
echo "  # Test production:"
echo "  $0 https://fixloapp.com"
echo ""
echo "  # With custom admin key:"
echo "  ADMIN_SECRET_KEY=your_key $0 https://fixloapp.com"
