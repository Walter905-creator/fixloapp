#!/bin/bash

# Deploy Verification Script
# This script verifies that the canonical URL fixes are working after deployment

echo "🚀 Google Search Console Indexing Fix - Deployment Verification"
echo "=============================================================="

# Check if this is production deployment
if [[ "$1" == "--production" ]]; then
  echo "🌐 Testing production deployment at https://www.fixloapp.com"
  BASE_URL="https://www.fixloapp.com"
else
  echo "🏠 Testing local build"
  BASE_URL="http://localhost:3000"
fi

echo ""

PASSED=0
FAILED=0

# Test function for live URLs
test_live_canonical() {
  local path="$1"
  local expected_canonical="$2"
  local description="$3"
  
  echo -n "Testing $description... "
  
  # Get the page and extract canonical URL
  canonical=$(curl -s "$BASE_URL$path" | grep -o 'rel="canonical" href="[^"]*"' | sed 's/rel="canonical" href="//g' | sed 's/"//g')
  
  if [ "$canonical" = "$expected_canonical" ]; then
    echo "✅ $canonical"
    ((PASSED++))
  else
    echo "❌ Expected '$expected_canonical', got '$canonical'"
    ((FAILED++))
  fi
}

# Test cases - these should resolve the 408 "Duplicate without user-selected canonical" issues
echo "🔗 Testing Canonical URLs (fixes 'Duplicate without user-selected canonical'):"
test_live_canonical "/" "https://www.fixloapp.com/" "Homepage"
test_live_canonical "/how-it-works" "https://www.fixloapp.com/how-it-works" "How It Works"
test_live_canonical "/contact" "https://www.fixloapp.com/contact" "Contact"
test_live_canonical "/signup" "https://www.fixloapp.com/signup" "Signup"
test_live_canonical "/services" "https://www.fixloapp.com/services" "Services"
test_live_canonical "/services/plumbing" "https://www.fixloapp.com/services/plumbing" "Plumbing Service"
test_live_canonical "/pro/signup" "https://www.fixloapp.com/pro/signup" "Pro Signup"

echo ""
echo "📊 Test Results:"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "🎉 All canonical URL tests passed!"
  echo ""
  echo "📋 Expected Google Search Console Improvements:"
  echo "• 'Duplicate without user-selected canonical' issues should decrease from 408 to near 0"
  echo "• Pages should start appearing in 'Valid' status instead"
  echo "• Index coverage should improve within 1-2 weeks"
  echo ""
  echo "📈 Next Steps:"
  echo "1. Monitor Google Search Console for improvements"
  echo "2. Re-submit sitemap.xml in GSC"
  echo "3. Use 'Request indexing' for key pages"
  echo "4. Track indexing progress over next 2 weeks"
  exit 0
else
  echo "⚠️  Some tests failed. The deployment may need additional fixes."
  exit 1
fi