#!/bin/bash
# Verification script for Vercel API routing fix
# This script validates the vercel.json configuration

set -e

echo "🔍 Vercel API Routing Fix - Configuration Validation"
echo "=================================================="
echo ""

# Check 1: Verify vercel.json exists and is valid JSON
echo "✓ Check 1: Validating vercel.json syntax..."
if ! cat vercel.json | python3 -m json.tool > /dev/null 2>&1; then
    echo "❌ FAILED: vercel.json is not valid JSON"
    exit 1
fi
echo "  ✅ vercel.json is valid JSON"
echo ""

# Check 2: Verify routes configuration exists
echo "✓ Check 2: Checking routes configuration..."
ROUTES_COUNT=$(python3 -c "import json; print(len(json.load(open('vercel.json'))['routes']))" 2>/dev/null || echo "0")
if [ "$ROUTES_COUNT" -eq 0 ]; then
    echo "❌ FAILED: No routes found in vercel.json"
    exit 1
fi
echo "  ✅ Found $ROUTES_COUNT routes"
echo ""

# Check 3: Verify filesystem handler is FIRST
echo "✓ Check 3: Verifying filesystem handler is first..."
FIRST_ROUTE=$(python3 -c "import json; route = json.load(open('vercel.json'))['routes'][0]; print(route.get('handle', 'none'))" 2>/dev/null)
if [ "$FIRST_ROUTE" != "filesystem" ]; then
    echo "❌ FAILED: First route is not filesystem handler (found: $FIRST_ROUTE)"
    echo "   The first route must be { \"handle\": \"filesystem\" }"
    exit 1
fi
echo "  ✅ First route is filesystem handler"
echo ""

# Check 4: Verify API route exists
echo "✓ Check 4: Verifying /api/(.*) route..."
API_ROUTE=$(python3 -c "
import json
routes = json.load(open('vercel.json'))['routes']
for r in routes:
    if r.get('src') == '/api/(.*)':
        print('found')
        break
else:
    print('missing')
" 2>/dev/null)

if [ "$API_ROUTE" != "found" ]; then
    echo "❌ FAILED: /api/(.*) route not found"
    exit 1
fi
echo "  ✅ /api/(.*) route exists"
echo ""

# Check 5: Verify SPA catch-all is LAST
echo "✓ Check 5: Verifying SPA catch-all route..."
LAST_ROUTE=$(python3 -c "import json; route = json.load(open('vercel.json'))['routes'][-1]; print(route.get('src', 'none'))" 2>/dev/null)
if [ "$LAST_ROUTE" != "/(.*)" ]; then
    echo "❌ FAILED: Last route is not SPA catch-all (found: $LAST_ROUTE)"
    exit 1
fi
echo "  ✅ Last route is SPA catch-all /(.*)"
echo ""

# Check 6: Verify API serverless functions exist
echo "✓ Check 6: Checking API serverless functions..."
if [ ! -f "api/ping.js" ]; then
    echo "❌ FAILED: api/ping.js not found"
    exit 1
fi
echo "  ✅ api/ping.js exists"

if [ ! -f "api/social/force-status.js" ]; then
    echo "⚠️  WARNING: api/social/force-status.js not found (optional - will be created when needed)"
fi

echo ""
echo "=================================================="
echo "✅ ALL CHECKS PASSED!"
echo ""
echo "Configuration Summary:"
echo "  1. ✅ Filesystem handler is FIRST (checks for API functions)"
echo "  2. ✅ /api/(.*) route exists"
echo "  3. ✅ SPA catch-all is LAST (won't catch API routes)"
echo "  4. ✅ API serverless functions exist"
echo ""
echo "Expected Behavior After Deployment:"
echo "  • GET /api/ping → Executes api/ping.js → Returns JSON"
echo "  • GET /about → No file → Falls to SPA → Returns HTML"
echo ""
echo "Next Steps:"
echo "  1. Deploy to Vercel (merge this PR)"
echo "  2. Wait 1-2 minutes for deployment"
echo "  3. Test: curl -i https://fixloapp.com/api/ping"
echo "  4. Verify: Content-Type: application/json"
echo ""
