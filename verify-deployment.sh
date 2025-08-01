#!/bin/bash

# Website cache verification script
echo "🔍 WEBSITE CACHE VERIFICATION"
echo "============================="

WEBSITE_URL="https://www.fixloapp.com"
API_URL="https://fixloapp.onrender.com"

echo "🌐 Checking website status..."

# Check main website
echo "📄 Main site response:"
curl -s -I "$WEBSITE_URL" | grep -E "(HTTP|Cache-Control|Pragma|Expires|X-Cache)"

echo ""
echo "🔢 Build info from HTML:"
curl -s "$WEBSITE_URL" | grep -o 'build-timestamp.*content="[^"]*"' | head -1

echo ""
echo "🔍 Checking for cache busting headers:"
curl -s -I "$WEBSITE_URL" | grep -i cache

echo ""
echo "🧪 Testing with cache bypass:"
CACHE_BUST=$(date +%s)
curl -s -I "$WEBSITE_URL?cb=$CACHE_BUST" | grep HTTP

echo ""
echo "💡 Manual verification steps:"
echo "   1. Open browser dev tools (F12)"
echo "   2. Go to Network tab"
echo "   3. Hard refresh (Ctrl+Shift+R)"
echo "   4. Check if HTML shows 200 (not 304)"
echo "   5. Look for build-timestamp in HTML source"
echo ""
echo "🔗 Direct links to check:"
echo "   Main site: $WEBSITE_URL"
echo "   API health: $API_URL/api"
echo "   Vercel dashboard: https://vercel.com/dashboard"