#!/bin/bash

# Quick Production Indexing Checks
# Based on the problem statement requirements for GSC optimization

echo "🔍 Quick Production Indexing Checks"
echo "=================================="
echo ""

PRODUCTION_URL="https://www.fixloapp.com"

echo "1) 📋 Canonical and noindex checks"
echo "-----------------------------------"
echo "Headers check:"
curl -sI $PRODUCTION_URL | sed -n '1,20p'
echo ""
echo "Meta tags check:"
curl -s $PRODUCTION_URL | grep -i -E 'canonical|robots'
echo ""

echo "2) 🔍 Sample deep routes (SPA shell vs proper meta)"
echo "---------------------------------------------------"
echo "Services plumbing route:"
curl -s $PRODUCTION_URL/services/plumbing | grep -i -E 'canonical|og:|twitter:|robots' | head -5
echo ""
echo "Pro profile route (if exists):"
curl -s $PRODUCTION_URL/pro/johns-plumbing | grep -i -E 'canonical|og:|twitter:|ld+json|robots' | head -5
echo ""

echo "3) 🤖 Robots & sitemap validation"
echo "--------------------------------"
echo "Robots.txt (first 80 lines):"
curl -s $PRODUCTION_URL/robots.txt | sed -n '1,80p'
echo ""
echo "Sitemap.xml (first 40 lines):"
curl -s $PRODUCTION_URL/sitemap.xml | head -n 40
echo ""

echo "4) 🖥️ SPA shell detection"
echo "------------------------"
echo "Is services/plumbing just SPA shell? (first 60 lines):"
curl -s $PRODUCTION_URL/services/plumbing | head -n 60 | grep -E "(JavaScript Required|Book Trusted Home Services Near You)"
echo ""

echo "5) 🌐 Host canonicalization test"
echo "-------------------------------"
echo "Non-www redirect test:"
curl -sI https://fixloapp.com | grep -E "(HTTP|Location)" | head -2
echo ""

echo "6) 🔗 Parameter handling test"
echo "----------------------------"
echo "UTM parameter canonical test:"
curl -s "$PRODUCTION_URL?utm_source=test&utm_medium=test" | grep -i canonical
echo ""

echo "=================================="
echo "✅ Quick checks complete!"
echo ""
echo "For comprehensive analysis, run:"
echo "  npm run verify-production-indexing"
echo ""
echo "Expected results:"
echo "- Single absolute canonical per page (no mixed www/non-www)"
echo "- No noindex on pages that should rank"
echo "- robots.txt allows public pages and lists sitemap"
echo "- sitemap.xml contains only 200/canonical URLs"
echo "- Routes serve specific meta, not generic SPA shell"